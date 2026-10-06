from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ParkingSpace
from .cache import AllowedParkingSpacesCache


@receiver([post_save, post_delete], sender=ParkingSpace)
def invalidate_allowed_spaces_cache(sender, instance, **kwargs):
    AllowedParkingSpacesCache.invalidate_all()