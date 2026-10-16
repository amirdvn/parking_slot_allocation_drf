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


class EntryExitLogService:

    @staticmethod
    @transaction.atomic
    def record_entry(parking_request):

        parking_request = ParkingRequest.objects.select_for_update().get(pk=parking_request.id)

        if parking_request.status != ParkingRequest.RequestStatus.APPROVED:
            raise ValueError('فقط درخواست‌های تاییدشده امکان ثبت ورود دارند')

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
        return parking_request


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
    def get_manager_dashboard():

        cached = DashboardCache.get(DashboardCache.MANAGER_KEY)

        if cached is not None:
            return cached

        now = timezone.now()

        total_spaces = ParkingSpace.objects.filter(is_active=True).count()

        occupied_ids = set(
            ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
            ).exclude(parking_space__isnull=True).values_list('parking_space_id', flat=True)
        )


        blocked_ids = set(
            ParkingSpaceBlock.objects.filter(
            start_time__lte=now, end_time__gt=now
            ).exclude(parking_space__isnull=True).values_list('parking_space_id', flat=True)
        )

        occupied_spaces = len(occupied_ids)
        blocked_spaces = len(blocked_ids)
        available_spaces = total_spaces - len(occupied_ids | blocked_ids)   
        
        pending_requests = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.PENDING
        ).count()

        needs_review_requests = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.NEEDS_REVIEW
        ).count()

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
            'parking_spaces': {
                'total': total_spaces,
                'occupied': occupied_spaces,
                'blocked': blocked_spaces,
                'available': available_spaces,
            },
            'requests': {
                'pending': pending_requests,
                'needs_review': needs_review_requests,
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
        total_vehicles = Vehicle.objects.filter(user=user).count()
        active_vehicles = Vehicle.objects.filter(user=user, is_active=True).count()

        pending_requests = ParkingRequest.objects.filter(
            user=user, status=ParkingRequest.RequestStatus.PENDING
        ).count()

        needs_review_requests = ParkingRequest.objects.filter(
            user=user, status=ParkingRequest.RequestStatus.NEEDS_REVIEW
        ).count()

        approved_requests = ParkingRequest.objects.filter(
            user=user, status=ParkingRequest.RequestStatus.APPROVED
        ).count()

        rejected_requests = ParkingRequest.objects.filter(
            user=user, status=ParkingRequest.RequestStatus.REJECTED
        ).count()

        return {
            'vehicles': {
                'total': total_vehicles,
                'active': active_vehicles,
            },
            'requests': {
                'pending': pending_requests,
                'needs_review': needs_review_requests,
                'approved': approved_requests,
                'rejected': rejected_requests,
            },
        }


    @staticmethod
    def get_guard_dashboard():
        cached = DashboardCache.get(DashboardCache.GUARD_KEY)
        if cached is not None:
            return cached

        now = timezone.now()

        total_spaces = ParkingSpace.objects.filter(is_active=True).count()

        occupied_ids = set(
        ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
        ).exclude(parking_space__isnull=True).values_list('parking_space_id', flat=True)
    )

        blocked_ids = set(
        ParkingSpaceBlock.objects.filter(
            start_time__lte=now, end_time__gt=now
        ).exclude(parking_space__isnull=True).values_list('parking_space_id', flat=True)
    )
        
        
        occupied_spaces = len(occupied_ids)
        blocked_spaces = len(blocked_ids)
        available_spaces = total_spaces - len(occupied_ids | blocked_ids)
        
        
        in_use_vehicles = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
        ).count()

        approved_requests = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.APPROVED
        ).count()

        data = {
            'parking_spaces': {
                'total': total_spaces,
                'occupied': occupied_spaces,
                'blocked': blocked_spaces,
                'available': available_spaces,
            },
            'vehicles': {
                'in_use': in_use_vehicles,
            },
            'requests': {
                'approved': approved_requests,
            },
        }

        DashboardCache.set(DashboardCache.GUARD_KEY, data)
        return data