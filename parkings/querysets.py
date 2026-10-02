from django.db import models
from django.utils import timezone
from datetime import timedelta


class ParkingRequestQuerySet(models.QuerySet):
    
    def expire_pending_requests(self):
        from notifications.models import Notification
        
        RequestStatus = self.model.RequestStatus    

        time_expire = timezone.now() - timedelta(minutes=3)
        request_expired = self.filter(
            status__in=[RequestStatus.PENDING, RequestStatus.NEEDS_REVIEW],
            created_date__lt=time_expire)

        for parking_request in request_expired:
            Notification.objects.create(
                user=parking_request.user,
                type=Notification.Type.REQUEST_STATUS,
                title='درخواست پارکینگ منقضی شد',
                message=f'درخواست #{parking_request.id} به دلیل عدم بررسی به‌موقع منقضی شد',
                link=f'/api/parking/requests/detail/{parking_request.id}/',
            )
        return request_expired.update(status=RequestStatus.EXPIRED)