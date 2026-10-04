from datetime import timedelta
from django.utils import timezone
from notifications.models import Notification
from .models import ParkingRequest, ParkingSpace



class ParkingRequestService:

    @staticmethod
    def expire_pending_requests():
        
        RequestStatus = ParkingRequest.RequestStatus    

        time_expire = timezone.now() - timedelta(minutes=3)
        request_expired = ParkingRequest.objects.pending_or_review().created_before(time_expire)

        for parking_request in request_expired:
            Notification.objects.create(
                user=parking_request.user,
                type=Notification.Type.REQUEST_STATUS,
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

        Notification.objects.create(
            user=parking_request.user,
            type=Notification.Type.REQUEST_STATUS,
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

        Notification.objects.create(
            user=parking_request.user,
            type=Notification.Type.REQUEST_STATUS,
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

            Notification.objects.create(
                user=parking_request.user,
                type=Notification.Type.REQUEST_STATUS,
                title='خروج خودرو ثبت شد',
                message=f'خروج خودرو برای درخواست #{parking_request.id} ثبت شد',
                link=f'/api/parking/requests/detail/{parking_request.id}/',
            )

        return log