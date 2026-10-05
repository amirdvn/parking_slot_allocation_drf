from datetime import timedelta
from django.utils import timezone
from notifications.models import Notification
from .models import ParkingRequest, ParkingSpace, ParkingSpaceBlock
from notifications.tasks import create_notification_task
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from vehicles.models import Vehicle



User = get_user_model()

class ParkingRequestService:

    @staticmethod
    def expire_pending_requests():
        
        RequestStatus = ParkingRequest.RequestStatus    

        time_expire = timezone.now() - timedelta(minutes=3)
        request_expired = ParkingRequest.objects.pending_or_review().created_before(time_expire)

        for parking_request in request_expired:
            create_notification_task.delay(
                user_id=parking_request.user_id,
                notification_type=Notification.Type.REQUEST_STATUS,
                title='درخواست پارکینگ منقضی شد',
                message=f'درخواست #{parking_request.id} به دلیل عدم بررسی به‌موقع منقضی شد',
                link=f'/api/parking/requests/detail/{parking_request.id}/',
            )
        return request_expired.update(status=RequestStatus.EXPIRED)


    @staticmethod
    def create(user, validated_data):
        parking_request = ParkingRequest.objects.create(user=user, **validated_data)

        if parking_request.parking_space and parking_request.parking_space.space_type == ParkingSpace.SpaceType.EMERGENCY:
            parking_request.status = ParkingRequest.RequestStatus.NEEDS_REVIEW
            parking_request.save(update_fields=['status'])

        return parking_request


    @staticmethod
    def check_editable(parking_request):
        if parking_request.status != ParkingRequest.RequestStatus.PENDING:
            raise ValueError('فقط درخواست‌های در وضعیت «در انتظار بررسی» قابل ویرایش هستند')


    @staticmethod
    def cancel(parking_request, reason):
        if parking_request.status not in [
            ParkingRequest.RequestStatus.PENDING,
            ParkingRequest.RequestStatus.APPROVED,
        ]:
            raise ValueError('این درخواست در وضعیت فعلی قابل لغو نیست')

        parking_request.status = ParkingRequest.RequestStatus.CANCELED
        parking_request.cancellation_reason = reason
        parking_request.save(update_fields=['status', 'cancellation_reason', 'updated_date'])

        return parking_request


    #manager
    @staticmethod
    def review(parking_request, status, rejection_reason=None):

        if parking_request.status not in [
            ParkingRequest.RequestStatus.PENDING,
            ParkingRequest.RequestStatus.NEEDS_REVIEW,
        ]:
            raise ValueError('این درخواست در وضعیت فعلی قابل بررسی نیست')


        parking_request.status = status


        if status == ParkingRequest.RequestStatus.REJECTED:
            parking_request.rejection_reason = rejection_reason


        parking_request.save(update_fields=['status', 'updated_date', 'rejection_reason'])


        if status == ParkingRequest.RequestStatus.APPROVED:
            title = 'تایید درخواست پارکینگ'
            message = f'درخواست شما برای جایگاه {parking_request.parking_space.code if parking_request.parking_space else "تعیین‌شده"} تایید شد'
        else:
            title = 'رد درخواست پارکینگ'
            message = f'درخواست شما رد شد؛ دلیل: {parking_request.rejection_reason or "تعیین نشده"}'

        create_notification_task.delay(
            user_id=parking_request.user_id,
            notification_type=Notification.Type.REQUEST_STATUS,
            title=title,
            message=message,
            link=f'/api/parking/requests/detail/{parking_request.id}/',
        )

        return parking_request



class EntryExitLogService:

    @staticmethod
    def record_entry(parking_request):
        parking_request.status = ParkingRequest.RequestStatus.IN_USE
        parking_request.save(update_fields=['status'])

        create_notification_task.delay(
            user_id=parking_request.user_id,
            notification_type=Notification.Type.REQUEST_STATUS,
            title='ورود خودرو ثبت شد',
            message=f'ورود خودرو برای درخواست #{parking_request.id} ثبت شد',
            link=f'/api/parking/requests/detail/{parking_request.id}/',
        )
    


    @staticmethod
    def record_exit(log):
        if log.exit_time:
            raise ValueError('خروج این خودرو قبلاً ثبت شده است')

        log.exit_time = timezone.now()
        log.save(update_fields=['exit_time'])

        parking_request = log.parking_request
        if parking_request:
            parking_request.status = ParkingRequest.RequestStatus.COMPLETED
            parking_request.save(update_fields=['status'])

            create_notification_task.delay(
                user_id=parking_request.user_id,
                notification_type=Notification.Type.REQUEST_STATUS,
                title='خروج خودرو ثبت شد',
                message=f'خروج خودرو برای درخواست #{parking_request.id} ثبت شد',
                link=f'/api/parking/requests/detail/{parking_request.id}/',
            )

        return log



class DashboardService:

    @staticmethod
    def get_manager_dashboard():
        now = timezone.now()

        total_spaces = ParkingSpace.objects.filter(is_active=True).count()

        occupied_spaces = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
        ).values('parking_space').distinct().count()

        blocked_spaces = ParkingSpaceBlock.objects.filter(
            start_time__lte=now, end_time__gt=now
        ).values('parking_space').distinct().count()

        available_spaces = total_spaces - (occupied_spaces + blocked_spaces)

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

        return {
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
        now = timezone.now()

        total_spaces = ParkingSpace.objects.filter(is_active=True).count()

        occupied_spaces = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
        ).values('parking_space').distinct().count()

        blocked_spaces = ParkingSpaceBlock.objects.filter(
            start_time__lte=now, end_time__gt=now
        ).values('parking_space').distinct().count()

        available_spaces = total_spaces - (occupied_spaces + blocked_spaces)

        in_use_vehicles = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.IN_USE
        ).count()

        approved_requests = ParkingRequest.objects.filter(
            status=ParkingRequest.RequestStatus.APPROVED
        ).count()

        return {
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