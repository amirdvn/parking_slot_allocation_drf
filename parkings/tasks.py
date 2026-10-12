from celery import shared_task
from .services import ParkingRequestService


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def expire_pending_requests_task(self):
    try:
        count = ParkingRequestService.expire_pending_requests()
        return count
    except Exception as exc:
        raise self.retry(exc=exc)