from celery import shared_task
from .models import Notification


@shared_task
def create_notification_task(user_id, notification_type, title, message, link=None):
    Notification.objects.create(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        link=link,
    )