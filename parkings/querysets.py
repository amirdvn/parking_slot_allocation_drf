from django.db import models
from parkings.cache import AllowedParkingSpacesCache


class ParkingSpaceQuerySet(models.QuerySet):
    def get_allowed_parking_spaces(self, vehicle=None, user=None, is_guest=False):

        from vehicles.models import Vehicle


        SpaceType = self.model.SpaceType

        if user and (user.is_staff or user.is_superuser):
            cache_key = AllowedParkingSpacesCache.make_key(is_manager=True)

        elif is_guest:
            cache_key = AllowedParkingSpacesCache.make_key(is_guest=True)

        elif not vehicle:
            cache_key = AllowedParkingSpacesCache.make_key()

        else:
            cache_key = AllowedParkingSpacesCache.make_key(
                vehicle_type=vehicle.vehicle_type,
                sub_type=vehicle.sub_type
            )


        cached_ids = AllowedParkingSpacesCache.get(cache_key)

        if cached_ids is not None:
            return self.filter(id__in=cached_ids)


        query_set = self.filter(is_active=True)
            
        if user and (user.is_staff or user.is_superuser):
            query_set = query_set.filter(space_type=SpaceType.MANAGERS)

        elif is_guest:
            query_set = query_set.filter(space_type=SpaceType.GUEST)

        elif not vehicle:
            query_set = query_set

        elif vehicle.vehicle_type in (Vehicle.VehicleType.MOTORCYCLE, Vehicle.VehicleType.BICYCLE):
            query_set = query_set.filter(space_type__in=[SpaceType.MOTORCYCLE, SpaceType.EMERGENCY])

        elif vehicle.vehicle_type == Vehicle.VehicleType.CAR:
            
            if vehicle.sub_type == Vehicle.SubType.ELECTRIC:
                query_set = query_set.filter(space_type__in=[SpaceType.ELECTRIC, SpaceType.EMERGENCY])

            elif vehicle.sub_type == Vehicle.SubType.DISABLED:
                query_set = query_set.filter(space_type__in=[SpaceType.DISABLED, SpaceType.EMERGENCY])

            elif vehicle.sub_type == Vehicle.SubType.CARGO:
                query_set = query_set.filter(space_type__in=[SpaceType.LOADING, SpaceType.EMERGENCY])
            else:
                query_set = query_set.filter(space_type__in=[SpaceType.NORMAL, SpaceType.EMERGENCY])
        
        else:
            query_set = self.none()

        ids = list(query_set.values_list('id', flat=True))
        AllowedParkingSpacesCache.set(cache_key, ids)

        return self.filter(id__in=ids)
    


class ParkingRequestQuerySet(models.QuerySet):


    def overlapping(self, parking_space, start_time, end_time):

        RequestStatus = self.model.RequestStatus
        
        overlapping_requests = self.filter(
            parking_space=parking_space,
            start_time__lt=end_time,
            end_time__gt=start_time,
            status__in=[
                RequestStatus.PENDING,
                RequestStatus.APPROVED,
                RequestStatus.IN_USE,
                RequestStatus.NEEDS_REVIEW])

        return overlapping_requests

    def pending_or_review(self):
        RequestStatus = self.model.RequestStatus

        status = self.filter(status__in=[RequestStatus.PENDING, RequestStatus.NEEDS_REVIEW])
        return status

    def created_before(self, appointed_time):
        time = self.filter(created_date__lt=appointed_time)
        return time


class ParkingSpaceBlockQuerySet(models.QuerySet):

    def overlapping(self, parking_space, start_time, end_time):
        return self.filter(
            parking_space=parking_space,
            start_time__lt=end_time,
            end_time__gt=start_time,
        )

class EntryExitLogQuerySet(models.QuerySet):

    def with_relations(self):
        return self.select_related('vehicle', 'parking_request', 'guard')

    def active(self):
        return self.filter(exit_time__isnull=True)

    def for_vehicle(self, vehicle):
        return self.filter(vehicle=vehicle)

    def for_request(self, parking_request):
        return self.filter(parking_request=parking_request)