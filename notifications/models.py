from django.db import models
from django.conf import settings
import uuid
from .querysets import NotificationQuerySet


class Notification(models.Model):
    
    class Meta:
        ordering = ['-created_date']

        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_date']),
        ]


    class Type(models.TextChoices):
        REQUEST_STATUS = 'REQUEST_STATUS', 'تغییر وضعیت درخواست'
        REVIEW_NEEDED = 'REVIEW_NEEDED', 'درخواست نیازمند بررسی'
        SYSTEM = 'SYSTEM', 'اعلان سیستمی'
        REMINDER = 'REMINDER', 'یادآوری'
        
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=Type.choices, default=Type.SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True, null=True)  
    is_read = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)

    objects = NotificationQuerySet.as_manager()

    def __str__(self):
        return f'{self.user} - {self.title}'