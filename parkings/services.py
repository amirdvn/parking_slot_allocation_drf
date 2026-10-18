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


User = get_user_model()

class ParkingRequestService:

    @staticmethod
    def expire_pending_requests():
        
        RequestStatus = ParkingRequest.RequestStatus    

        time_expire = timezone.now() - timedelta(minutes=3)

        with transaction.atomic():
            request_expired =(
                ParkingRequest.objects
                .select_for_update(of=('self',))
                .pending_or_review()
                .created_before(time_expire))

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
                    title='درخواست پارکینگ منقضی شد',
                    message=f'درخواست #{req_id} به دلیل عدم بررسی به‌موقع منقضی شد',
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
                raise ValueError('این جایگاه در بازه زمانی انتخابی قبلاً رزرو شده است')

            if ParkingSpaceBlock.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time'],
            ).exists():
                raise ValueError('این جایگاه در بازه زمانی انتخابی مسدود است')

            parking_request = ParkingRequest.objects.create(user=user, **validated_data)

            if space.space_type == ParkingSpace.SpaceType.EMERGENCY:
                parking_request.status = ParkingRequest.RequestStatus.NEEDS_REVIEW
                parking_request.save(update_fields=['status'])

        return parking_request


    @staticmethod
    def check_editable(parking_request):
        if parking_request.status != ParkingRequest.RequestStatus.PENDING:
            raise ValueError('فقط درخواست‌های در وضعیت «در انتظار بررسی» قابل ویرایش هستند')


    @staticmethod
    def cancel(parking_request, reason):

        RequestStatus = ParkingRequest.RequestStatus

        with transaction.atomic():
            locked = (
                ParkingRequest.objects
                .select_related('parking_space')
                .select_for_update(of=('self',))
                .get(pk=parking_request.id)
            )

            if locked.status not in [
                RequestStatus.PENDING,
                RequestStatus.APPROVED,
            ]:
                raise ValueError('این درخواست در وضعیت فعلی قابل لغو نیست')

            locked.status = RequestStatus.CANCELED
            locked.cancellation_reason = reason
            locked.save(update_fields=['status', 'cancellation_reason', 'updated_date'])

        return locked


    #manager
    @staticmethod
    def review(parking_request, status, rejection_reason=None):

        RequestStatus = ParkingRequest.RequestStatus

        if status not in [
            RequestStatus.APPROVED,
            RequestStatus.REJECTED,
        ]:
            raise ValueError('وضعیت جدید باید تایید یا رد باشد')

        with transaction.atomic():
            locked = (
                ParkingRequest.objects
                .select_related('parking_space')
                .select_for_update(of=('self',))
                .get(pk=parking_request.id)
            )

            if locked.status not in [
                RequestStatus.PENDING,
                RequestStatus.NEEDS_REVIEW,
            ]:
                raise ValueError('این درخواست در وضعیت فعلی قابل بررسی نیست')

            locked.status = status
            if status == RequestStatus.REJECTED:
                locked.rejection_reason = rejection_reason

            locked.save(update_fields=['status', 'updated_date', 'rejection_reason'])


            if locked.status == RequestStatus.APPROVED:
                title = 'تایید درخواست پارکینگ'
                message = f'درخواست شما برای جایگاه {locked.parking_space.code if locked.parking_space else "تعیین‌شده"} تایید شد'
            else:
                title = 'رد درخواست پارکینگ'
                message = f'درخواست شما رد شد؛ دلیل: {locked.rejection_reason or "تعیین نشده"}'

            def send_notification():

                create_notification_task.delay(
                    user_id=locked.user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title=title,
                    message=message,
                    link=f'/api/parking/requests/detail/{locked.id}/',
                )
            transaction.on_commit(send_notification)

        return locked


    @staticmethod
    def update(parking_request, validated_data):

        RequestStatus = ParkingRequest.RequestStatus

        with transaction.atomic():

            target_space = validated_data.get('parking_space') or parking_request.parking_space
            if target_space is None:
                raise ValueError('جایگاه نامعتبر است')


            space = ParkingSpace.objects.select_for_update().get(
                pk=validated_data.get(
                    'parking_space',
                    parking_request.parking_space).id
            )
            locked = ParkingRequest.objects.select_for_update().get(pk=parking_request.id)

            if locked.status != RequestStatus.PENDING:
                raise ValueError('فقط درخواست‌های در وضعیت «در انتظار بررسی» قابل ویرایش هستند')

            start = validated_data.get('start_time', locked.start_time)
            end = validated_data.get('end_time', locked.end_time)

            if start >= end:
                raise ValueError('زمان پایان باید بعد از زمان شروع باشد')

            if ParkingRequest.objects.overlapping(space, start, end).exclude(pk=locked.id).exists():
                raise ValueError('این جایگاه در بازه زمانی انتخابی قبلاً رزرو شده است')

            if ParkingSpaceBlock.objects.overlapping(space, start, end).exists():
                raise ValueError('این جایگاه در بازه زمانی انتخابی مسدود است')

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
                raise ValueError('این جایگاه در بازه زمانی انتخابی قبلاً رزرو شده است')

            if ParkingSpaceBlock.objects.overlapping(
                    space,
                    validated_data['start_time'],
                    validated_data['end_time'],
            ).exists():
                raise ValueError('این جایگاه در بازه زمانی انتخابی مسدود است')

            parking_request = ParkingRequest.objects.create(user=user, vehicle=None, is_guest=True, **validated_data)

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
                raise ValueError('فقط درخواست‌های تاییدشده امکان ثبت ورود دارند')

            now = timezone.now()
            if now < parking_request.start_time:
                raise ValueError('هنوز زمان شروع این درخواست نرسیده است')
            if now > parking_request.end_time:
                raise ValueError('زمان این درخواست به پایان رسیده است')

            if log.vehicle_id and parking_request.vehicle_id != log.vehicle_id:
                raise ValueError('این خودرو با خودروی درخواست پارک یکسان نیست')

            if EntryExitLog.objects.for_request(parking_request).active().exclude(pk=log.id).exists():
                raise ValueError('برای این درخواست قبلاً ورود ثبت شده است')


            parking_request.status = ParkingRequest.RequestStatus.IN_USE
            parking_request.save(update_fields=['status', 'updated_date'])

            user_id = parking_request.user_id
            request_id = parking_request.id

            def send_notification():
                create_notification_task.delay(
                    user_id=user_id,
                    notification_type=Notification.Type.REQUEST_STATUS,
                    title='ورود خودرو ثبت شد',
                    message=f'ورود خودرو برای درخواست #{request_id} ثبت شد',
                    link=f'/api/parking/requests/detail/{request_id}/',
                )
            transaction.on_commit(send_notification)

        else:
            if not log.vehicle_id:
                raise ValueError('وسیله نقلیه الزامی است')

            if EntryExitLog.objects.for_vehicle(log.vehicle_id).active().exclude(pk=log.pk).exists():
                raise ValueError('این خودرو قبلاً وارد شده و هنوز خارج نشده است')

        return log


    @staticmethod
    @transaction.atomic
    def record_exit(log):

        log = EntryExitLog.objects.select_for_update().get(pk=log.id)


        if log.exit_time:
            raise ValueError('خروج این خودرو قبلاً ثبت شده است')

        parking_request = None

        if log.parking_request_id:
            parking_request = ParkingRequest.objects.select_for_update().get(pk=log.parking_request_id)

            if parking_request.status != ParkingRequest.RequestStatus.IN_USE:
                raise ValueError('این درخواست در وضعیت «در حال استفاده» نیست')

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
                    title='خروج خودرو ثبت شد',
                    message=f'خروج خودرو برای درخواست #{request_id} ثبت شد',
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
            .filter(status=ParkingRequest.RequestStatus.IN_USE)
            .exclude(parking_space__isnull=True)
            .values_list('parking_space_id', flat=True)
        )

        blocked_ids = set(
            ParkingSpaceBlock.objects
            .filter(start_time__lte=now, end_time__gt=now)
            .exclude(parking_space__isnull=True)
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

            'requests':
                {
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
            total = Count('id'),
            active = Count('id', filter=Q(is_active=True)),
        )

        request_stats = ParkingRequest.objects.filter(user=user).aggregate(
            pending = Count('id', filter=Q(status=RequestStatus.PENDING)),
            needs_review = Count('id', filter=Q(status=RequestStatus.NEEDS_REVIEW)),
            approved = Count('id', filter=Q(status=RequestStatus.APPROVED)),
            rejected = Count('id', filter=Q(status=RequestStatus.REJECTED)),
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

            'vehicles':
                {
                    'in_use': request_stats['in_use']
                },

            'requests':
                {
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
                raise ValueError('این جایگاه در بازه زمانی انتخاب‌شده قبلاً مسدود شده است')

            if ParkingRequest.objects.overlapping(space, start, end).exists():
                raise ValueError('این جایگاه در بازه زمانی انتخاب‌شده دارای درخواست یا رزرو فعال است و نمی‌توان آن را مسدود کرد')

            return ParkingSpaceBlock.objects.create(created_by=created_by, **validated_data)