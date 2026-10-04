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
