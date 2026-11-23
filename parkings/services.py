from datetime import timedelta
from django.utils import timezone
from notifications.models import Notification
from .models import ParkingRequest, ParkingSpace, ParkingSpaceBlock, EntryExitLog
from notifications.tasks import create_notification_task
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from vehicles.models import Vehicle
from .cache import DashboardCache
from django.db import transaction
from django.conf import settings
from parkings.translations.fa import MESSAGES

User = get_user_model()


class ParkingRequestService:

    @staticmethod
    def _notify_managers(parking_request):
        manager_ids = list(
            User.objects
            .filter(role=User.Role.MANAGER, is_active=True)
            .values_list('id', flat=True)
        )

        if not manager_ids:
            return

        space_code = parking_request.parking_space.code if parking_request.parking_space else '---'

        if parking_request.status == ParkingRequest.RequestStatus.NEEDS_REVIEW:
            title = MESSAGES['notifications']['titles']['emergency']
            message = MESSAGES['notifications']['messages']['emergency'].format(
                id=parking_request.id, code=space_code
            )
        elif parking_request.is_guest:
            title = MESSAGES['notifications']['titles']['guest']
            message = MESSAGES['notifications']['messages']['guest'].format(
                id=parking_request.id,
                name=parking_request.guest_name or "---",
                plate=parking_request.guest_plate_number or "---"
            )
        else:
            plate = parking_request.vehicle.plate_number if parking_request.vehicle else '---'
            title = MESSAGES['notifications']['titles']['new_request']
            message = MESSAGES['notifications']['messages']['new_request'].format(
                id=parking_request.id, plate=plate, code=space_code
            )

        def send():
            for manager_id in manager_ids:
                create_notification_task.delay(
                    user_id=manager_id,
                    notification_type=Notification.Type.REVIEW_NEEDED,
                    title=title,
                    message=message,
                    link='/manage-requests',
                )
        transaction.on_commit(send)

    @staticmethod
    def expire_pending_requests():
        RequestStatus = ParkingRequest.RequestStatus
        time_expire = timezone.now() - timedelta(minutes=settings.PARKING_REQUEST_EXPIRY_MINUTES)

        with transaction.atomic():
            request_expired = (
                ParkingRequest.objects
                .select_for_update(of=('self',))
                .pending_or_review()
                .created_before(time_expire)
            )

            expired_requests = list(request_expired.values_list('id', 'user_id'))
            ids = [req_id for req_id, _ in expired_requests]

            updated_count = 0
            if ids:
                updated_count = ParkingRequest.objects.filter(id__in=ids).update(
                    status=RequestStatus.EXPIRED
                )

        if updated_count:
            DashboardCache.invalidate()

        for req_id, user_id in expired_requests:
            def send_notification(req_id=req_id, user_id=user_id):
                create_notification_task.delay(
                    user_id=user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title=MESSAGES['notifications']['titles']['expired'],
                    message=MESSAGES['notifications']['messages']['expired'].format(id=req_id),
                    link=f'/api/parking/requests/detail/{req_id}/',
                )
            transaction.on_commit(send_notification)

        return updated_count

    @staticmethod
    def create(user, validated_data):
        with transaction.atomic():
            space = ParkingSpace.objects.select_for_update().get(pk=validated_data['parking_space'].pk)

            if ParkingRequest.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time']
            ).exists():
                raise ValueError(MESSAGES['errors']['space_reserved'])

            if ParkingSpaceBlock.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time'],
            ).exists():
                raise ValueError(MESSAGES['errors']['space_blocked'])

            parking_request = ParkingRequest.objects.create(user=user, **validated_data)

            if space.space_type == ParkingSpace.SpaceType.EMERGENCY:
                parking_request.status = ParkingRequest.RequestStatus.NEEDS_REVIEW
                parking_request.save(update_fields=['status'])

            ParkingRequestService._notify_managers(parking_request)

        return parking_request

    @staticmethod
    def check_editable(parking_request):
        if parking_request.status != ParkingRequest.RequestStatus.PENDING:
            raise ValueError(MESSAGES['validation']['edit_not_pending'])

    @staticmethod
    def cancel(parking_request, reason):
        RequestStatus = ParkingRequest.RequestStatus

        with transaction.atomic():
            locked = (
                ParkingRequest.objects
                .select_related('parking_space', 'vehicle')
                .select_for_update(of=('self',))
                .get(pk=parking_request.id)
            )

            if locked.status not in [
                RequestStatus.PENDING,
                RequestStatus.APPROVED,
            ]:
                raise ValueError(MESSAGES['errors']['cancel_invalid_status'])

            locked.status = RequestStatus.CANCELED
            locked.cancellation_reason = reason
            locked.save(update_fields=['status', 'cancellation_reason', 'updated_date'])

            def notify_managers_on_cancel():
                manager_ids = list(
                    User.objects
                    .filter(role=User.Role.MANAGER, is_active=True)
                    .values_list('id', flat=True)
                )
                for manager_id in manager_ids:
                    create_notification_task.delay(
                        user_id=manager_id,
                        notification_type=Notification.Type.REQUEST_STATUS,
                        title=MESSAGES['notifications']['titles']['canceled'],
                        message=MESSAGES['notifications']['messages']['canceled'].format(
                            id=locked.id, reason=reason
                        ),
                        link='/manage-requests',
                    )
            transaction.on_commit(notify_managers_on_cancel)

        return locked

    # manager
    @staticmethod
    def review(parking_request, status, rejection_reason=None):
        RequestStatus = ParkingRequest.RequestStatus

        if status not in [
            RequestStatus.APPROVED,
            RequestStatus.REJECTED,
        ]:
            raise ValueError(MESSAGES['errors']['review_invalid_status'])

        with transaction.atomic():
            locked = (
                ParkingRequest.objects
                .select_related('parking_space', 'vehicle')
                .select_for_update(of=('self',))
                .get(pk=parking_request.id)
            )

            if locked.status not in [
                RequestStatus.PENDING,
                RequestStatus.NEEDS_REVIEW,
            ]:
                raise ValueError(MESSAGES['errors']['review_not_allowed'])

            locked.status = status
            if status == RequestStatus.REJECTED:
                locked.rejection_reason = rejection_reason

            locked.save(update_fields=['status', 'updated_date', 'rejection_reason'])

            if locked.status == RequestStatus.APPROVED:
                title = MESSAGES['notifications']['titles']['approved']
                message = MESSAGES['notifications']['messages']['approved'].format(
                    code=locked.parking_space.code if locked.parking_space else MESSAGES['notifications']['defaults']['space_code']
                )
            else:
                title = MESSAGES['notifications']['titles']['rejected']
                message = MESSAGES['notifications']['messages']['rejected'].format(
                    reason=locked.rejection_reason or MESSAGES['notifications']['defaults']['reason']
                )

            def send_notification():
                create_notification_task.delay(
                    user_id=locked.user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title=title,
                    message=message,
                    link=f'/api/parking/requests/detail/{locked.id}/',
                )
            transaction.on_commit(send_notification)

            if locked.status == RequestStatus.APPROVED:
                guard_ids = list(
                    User.objects
                    .filter(role=User.Role.GUARD, is_active=True)
                    .values_list('id', flat=True)
                )

                if guard_ids:
                    plate = locked.vehicle.plate_number if locked.vehicle else '---'
                    space_code = locked.parking_space.code if locked.parking_space else '---'

                    guard_title = MESSAGES['notifications']['titles']['ready_for_entry']
                    guard_message = MESSAGES['notifications']['messages']['ready_for_entry'].format(
                        id=locked.id, plate=plate, code=space_code
                    )

                    def send_guard_notifications():
                        for guard_id in guard_ids:
                            create_notification_task.delay(
                                user_id=guard_id,
                                notification_type=Notification.Type.REVIEW_NEEDED,
                                title=guard_title,
                                message=guard_message,
                                link='/entry-exit',
                            )

                    transaction.on_commit(send_guard_notifications)

        return locked

    @staticmethod
    def update(parking_request, validated_data):
        RequestStatus = ParkingRequest.RequestStatus

        with transaction.atomic():
            target_space = validated_data.get('parking_space') or parking_request.parking_space
            if target_space is None:
                raise ValueError(MESSAGES['errors']['invalid_space'])

            space = ParkingSpace.objects.select_for_update().get(
                pk=validated_data.get(
                    'parking_space',
                    parking_request.parking_space).id
            )
            locked = ParkingRequest.objects.select_for_update().get(pk=parking_request.id)

            if locked.status != RequestStatus.PENDING:
                raise ValueError(MESSAGES['validation']['edit_not_pending'])

            start = validated_data.get('start_time', locked.start_time)
            end = validated_data.get('end_time', locked.end_time)

            if start >= end:
                raise ValueError(MESSAGES['validation']['end_before_start'])

            if ParkingRequest.objects.overlapping(space, start, end).exclude(pk=locked.id).exists():
                raise ValueError(MESSAGES['errors']['space_reserved'])

            if ParkingSpaceBlock.objects.overlapping(space, start, end).exists():
                raise ValueError(MESSAGES['errors']['space_blocked'])

            locked.parking_space = space
            locked.start_time = start
            locked.end_time = end
            if 'description' in validated_data:
                locked.description = validated_data['description']

            locked.save(update_fields=['parking_space', 'start_time', 'end_time', 'description', 'updated_date'])

        return locked

    @staticmethod
    def create_guest(user, validated_data):
        with transaction.atomic():
            space = ParkingSpace.objects.select_for_update().get(pk=validated_data['parking_space'].id)

            if ParkingRequest.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time']
            ).exists():
                raise ValueError(MESSAGES['errors']['space_reserved'])

            if ParkingSpaceBlock.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time'],
            ).exists():
                raise ValueError(MESSAGES['errors']['space_blocked'])

            parking_request = ParkingRequest.objects.create(
                user=user, vehicle=None, is_guest=True, **validated_data
            )

            ParkingRequestService._notify_managers(parking_request)

            return parking_request


class EntryExitLogService:

    @staticmethod
    @transaction.atomic
    def record_entry(log):
        RequestStatus = ParkingRequest.RequestStatus

        if log.parking_request_id:
            parking_request = ParkingRequest.objects.select_for_update(
                of=('self',)
            ).get(pk=log.parking_request_id)

            if parking_request.status != ParkingRequest.RequestStatus.APPROVED:
                raise ValueError(MESSAGES['errors']['entry_not_approved'])

            now = timezone.now()
            if now < parking_request.start_time:
                raise ValueError(MESSAGES['errors']['entry_too_early'])
            if now > parking_request.end_time:
                raise ValueError(MESSAGES['errors']['entry_too_late'])

            if not parking_request.is_guest and log.vehicle_id and parking_request.vehicle_id != log.vehicle_id:
                raise ValueError(MESSAGES['validation']['vehicle_mismatch'])

            if EntryExitLog.objects.for_request(parking_request).active().exclude(pk=log.id).exists():
                raise ValueError(MESSAGES['errors']['entry_already_recorded'])

            parking_request.status = ParkingRequest.RequestStatus.IN_USE
            parking_request.save(update_fields=['status', 'updated_date'])

            user_id = parking_request.user_id
            request_id = parking_request.id

            def send_notification():
                create_notification_task.delay(
                    user_id=user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title=MESSAGES['notifications']['titles']['entry_logged'],
                    message=MESSAGES['notifications']['messages']['entry_logged'].format(id=request_id),
                    link=f'/api/parking/requests/detail/{request_id}/',
                )
            transaction.on_commit(send_notification)

        else:
            if not log.vehicle_id:
                raise ValueError(MESSAGES['errors']['vehicle_required'])

            Vehicle.objects.select_for_update(of=('self',)).get(pk=log.vehicle_id)

            if EntryExitLog.objects.for_vehicle(log.vehicle_id).active().exclude(pk=log.pk).exists():
                raise ValueError(MESSAGES['errors']['vehicle_already_inside'])

        return log

    @staticmethod
    @transaction.atomic
    def record_exit(log):
        log = EntryExitLog.objects.select_for_update().get(pk=log.id)

        if log.exit_time:
            raise ValueError(MESSAGES['errors']['exit_already_recorded'])

        parking_request = None

        if log.parking_request_id:
            parking_request = ParkingRequest.objects.select_for_update().get(pk=log.parking_request_id)

            if parking_request.status != ParkingRequest.RequestStatus.IN_USE:
                raise ValueError(MESSAGES['errors']['exit_invalid_status'])

            parking_request.status = ParkingRequest.RequestStatus.COMPLETED
            parking_request.save(update_fields=['status'])

        log.exit_time = timezone.now()
        log.save(update_fields=['exit_time'])

        if parking_request:
            user_id = parking_request.user_id
            request_id = parking_request.id

            def send_notification():
                create_notification_task.delay(
                    user_id=user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title=MESSAGES['notifications']['titles']['exit_logged'],
                    message=MESSAGES['notifications']['messages']['exit_logged'].format(id=request_id),
                    link=f'/api/parking/requests/detail/{request_id}/',
                )
            transaction.on_commit(send_notification)

        return log


class DashboardService:

    @staticmethod
    def _space_availability(now):
        total_spaces = ParkingSpace.objects.filter(is_active=True).count()

        occupied_ids = set(
            ParkingRequest.objects
            .filter(status=ParkingRequest.RequestStatus.IN_USE,
                parking_space__is_active=True)
            .values_list('parking_space_id', flat=True)
        )

        blocked_ids = set(
            ParkingSpaceBlock.objects
            .filter(start_time__lte=now, end_time__gt=now,
                    parking_space__is_active=True)
            .values_list('parking_space_id', flat=True)
        )

        return {
            'total': total_spaces,
            'occupied': len(occupied_ids),
            'blocked': len(blocked_ids),
            'available': total_spaces - len(occupied_ids | blocked_ids),
        }

    @staticmethod
    def get_manager_dashboard():
        cached = DashboardCache.get(DashboardCache.MANAGER_KEY)

        if cached is not None:
            return cached

        now = timezone.now()
        RequestStatus = ParkingRequest.RequestStatus

        request_stats = ParkingRequest.objects.aggregate(
            pending=Count('id', filter=Q(status=RequestStatus.PENDING)),
            needs_review=Count('id', filter=Q(status=RequestStatus.NEEDS_REVIEW)),
        )

        top_parking_spaces = (
            ParkingSpace.objects.annotate(
                usage_count=Count(
                    'parking_requests',
                    filter=Q(parking_requests__status__in=[
                        ParkingRequest.RequestStatus.IN_USE,
                        ParkingRequest.RequestStatus.COMPLETED,
                    ]),
                )
            ).order_by('-usage_count')[:5]
        )

        top_users = (
            User.objects.annotate(
                request_count=Count(
                    'parking_requests',
                    filter=Q(parking_requests__status__in=[
                        ParkingRequest.RequestStatus.IN_USE,
                        ParkingRequest.RequestStatus.COMPLETED,
                    ]),
                )
            ).order_by('-request_count')[:5]
        )

        data = {
            'parking_spaces': DashboardService._space_availability(now),
            'requests': {
                'pending': request_stats['pending'],
                'needs_review': request_stats['needs_review'],
            },
            'top_parking_spaces': [
                {
                    'id': space.id,
                    'code': space.code,
                    'usage_count': space.usage_count,
                }
                for space in top_parking_spaces
            ],
            'top_users': [
                {
                    'id': user.id,
                    'full_name': user.full_name,
                    'phone_number': user.phone_number,
                    'request_count': user.request_count,
                }
                for user in top_users
            ],
        }

        DashboardCache.set(DashboardCache.MANAGER_KEY, data)
        return data

    @staticmethod
    def get_user_dashboard(user):
        RequestStatus = ParkingRequest.RequestStatus

        vehicle_stats = Vehicle.objects.filter(user=user).aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
        )

        request_stats = ParkingRequest.objects.filter(user=user).aggregate(
            pending=Count('id', filter=Q(status=RequestStatus.PENDING)),
            needs_review=Count('id', filter=Q(status=RequestStatus.NEEDS_REVIEW)),
            approved=Count('id', filter=Q(status=RequestStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=RequestStatus.REJECTED)),
        )

        return {
            'vehicles': {
                'total': vehicle_stats['total'],
                'active': vehicle_stats['active'],
            },
            'requests': {
                'pending': request_stats['pending'],
                'needs_review': request_stats['needs_review'],
                'approved': request_stats['approved'],
                'rejected': request_stats['rejected'],
            },
        }

    @staticmethod
    def get_guard_dashboard():
        cached = DashboardCache.get(DashboardCache.GUARD_KEY)
        if cached is not None:
            return cached

        now = timezone.now()
        RequestStatus = ParkingRequest.RequestStatus

        request_stats = ParkingRequest.objects.aggregate(
            in_use=Count('id', filter=Q(status=RequestStatus.IN_USE)),
            approved=Count('id', filter=Q(status=RequestStatus.APPROVED)),
        )

        data = {
            'parking_spaces': DashboardService._space_availability(now),
            'vehicles': {
                'in_use': request_stats['in_use']
            },
            'requests': {
                'approved': request_stats['approved']
            },
        }

        DashboardCache.set(DashboardCache.GUARD_KEY, data)
        return data


class ParkingSpaceBlockService:

    @staticmethod
    def create(validated_data, created_by):
        with transaction.atomic():
            space = ParkingSpace.objects.select_for_update().get(pk=validated_data['parking_space'].pk)

            start, end = validated_data['start_time'], validated_data['end_time']

            if ParkingSpaceBlock.objects.overlapping(space, start, end).exists():
                raise ValueError(MESSAGES['errors']['block_already_exists'])

            if ParkingRequest.objects.overlapping(space, start, end).exists():
                raise ValueError(MESSAGES['errors']['space_has_active_requests'])

            return ParkingSpaceBlock.objects.create(created_by=created_by, **validated_data)

    @staticmethod
    def update(instance, validated_data):
        with transaction.atomic():
            locked_instance = ParkingSpaceBlock.objects.select_for_update().get(pk=instance.pk)

            parking_space = validated_data.get('parking_space', locked_instance.parking_space)
            parking_space = ParkingSpace.objects.select_for_update().get(pk=parking_space.pk)

            start_time = validated_data.get('start_time', locked_instance.start_time)
            end_time = validated_data.get('end_time', locked_instance.end_time)

            if ParkingSpaceBlock.objects.overlapping(parking_space, start_time, end_time).exclude(pk=locked_instance.pk).exists():
                raise ValueError(MESSAGES['errors']['block_already_exists'])

            if ParkingRequest.objects.overlapping(parking_space, start_time, end_time).exists():
                raise ValueError(MESSAGES['errors']['space_has_active_requests_short'])

            locked_instance.parking_space = parking_space
            locked_instance.start_time = start_time
            locked_instance.end_time = end_time
            if 'reason' in validated_data:
                locked_instance.reason = validated_data['reason']
            if 'description' in validated_data:
                locked_instance.description = validated_data['description']

            locked_instance.save()
            return locked_instance


class EntryExitReportService:
    COLUMNS = [
        ('user_id', MESSAGES['report']['headers']['user_id']),
        ('full_name', MESSAGES['report']['headers']['full_name']),
        ('plate_number', MESSAGES['report']['headers']['plate_number']),
        ('parking_space', MESSAGES['report']['headers']['parking_space']),
        ('entry_time', MESSAGES['report']['headers']['entry_time']),
        ('exit_time', MESSAGES['report']['headers']['exit_time']),
        ('duration', MESSAGES['report']['headers']['duration']),
        ('still_inside', MESSAGES['report']['headers']['still_inside']),
    ]

    HEADERS = [key for key, _ in COLUMNS]
    HEADER_LABELS = [label for _, label in COLUMNS]

    @staticmethod
    def _format_duration(delta):
        total = int(delta.total_seconds())
        hours, rem = divmod(total, 3600)
        minutes, seconds = divmod(rem, 60)
        return f'{hours:02d}:{minutes:02d}:{seconds:02d}'

    @staticmethod
    def iter_rows(start, end):
        logs = (
            EntryExitLog.objects
            .with_relations()
            .filter(entry_time__gte=start, entry_time__lt=end)
            .order_by('entry_time')
            .iterator(chunk_size=500)
        )
        now = timezone.now()

        for log in logs:
            vehicle = log.vehicle
            user = vehicle.user if vehicle else None
            last_time = log.exit_time or now
            delta = last_time - log.entry_time

            yield {
                'user_id': user.id if user else None,
                'full_name': user.full_name if user else None,
                'plate_number': vehicle.plate_number if vehicle else None,
                'parking_space': (
                    log.parking_request.parking_space.code
                    if log.parking_request and log.parking_request.parking_space
                    else None
                ),
                'entry_time': timezone.localtime(log.entry_time).strftime('%Y-%m-%d %H:%M:%S'),
                'exit_time': timezone.localtime(log.exit_time).strftime('%Y-%m-%d %H:%M:%S') if log.exit_time else None,
                'duration': EntryExitReportService._format_duration(delta),
                'still_inside': log.exit_time is None,
            }