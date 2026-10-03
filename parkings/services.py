from datetime import timedelta
from django.utils import timezone
from notifications.models import Notification
from .models import ParkingRequest



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
