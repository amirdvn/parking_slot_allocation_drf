from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock
from .cache import AllowedParkingSpacesCache, DashboardCache


@receiver([post_save, post_delete], sender=ParkingSpace)
def invalidate_allowed_spaces_cache(sender, instance, **kwargs):
    AllowedParkingSpacesCache.invalidate_all()

@receiver([post_save, post_delete], sender=ParkingRequest)
@receiver([post_save, post_delete], sender=ParkingSpaceBlock)
def invalidate_dashboard_cache(sender, instance, **kwargs):
    DashboardCache.invalidate()


