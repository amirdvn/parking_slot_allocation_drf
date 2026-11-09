from celery import shared_task
from .models import Notification


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def create_notification_task(self, user_id, notification_type, title, message, link=None):
    try:
        Notification.objects.create(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
        )
    except Exception as exc:
        raise self.retry(exc=exc)