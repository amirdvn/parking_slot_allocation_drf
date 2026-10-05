from celery import shared_task
from .services import ParkingRequestService


@shared_task
def expire_pending_requests_task():
    count = ParkingRequestService.expire_pending_requests()
    return count