from django.db import models


class NotificationQuerySet(models.QuerySet):

    def for_user(self, user):
        return self.filter(user=user)

    def unread(self):
        return self.filter(is_read=False)