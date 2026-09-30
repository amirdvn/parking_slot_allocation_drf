from django.db import models
from django.utils import timezone
from datetime import timedelta


class OtpCodeQuerySet(models.QuerySet):

    def get_valid(self, phone_number, code):
        expire_time = timezone.now() - timedelta(minutes=2)

        return self.filter(
            phone_number=phone_number,
            code=code,
            created_date__gte = expire_time,
        ).first()

    def delete_expired(self):
        expiry_time = timezone.now() - timedelta(minutes=2)

        return self.filter(created_date__lte=expiry_time).delete()