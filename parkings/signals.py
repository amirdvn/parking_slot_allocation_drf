from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock
from .cache import AllowedParkingSpacesCache, DashboardCache
from vehicles.models import Vehicle


@receiver([post_save, post_delete], sender=ParkingSpace)
def invalidate_allowed_spaces_cache(sender, instance, **kwargs):
    AllowedParkingSpacesCache.invalidate_all()
    DashboardCache.invalidate()

@receiver([post_save, post_delete], sender=ParkingRequest)
@receiver([post_save, post_delete], sender=ParkingSpaceBlock)
def invalidate_dashboard_cache(sender, instance, **kwargs):
    DashboardCache.invalidate()

@receiver([post_save, post_delete], sender=Vehicle)
def invalidate_cache_on_vehicle_change(sender, instance, **kwargs):
    AllowedParkingSpacesCache.invalidate_for_vehicle(
        instance.vehicle_type, instance.sub_type,
    )
