from django.db import models
from django.utils import timezone
from datetime import timedelta


class ParkingSpaceQuerySet(models.QuerySet):
    def get_allowed_parking_spaces(self, vehicle=None, user=None, is_guest=False):

        from vehicles.models import Vehicle

        SpaceType = self.model.SpaceType

        query_set = self.filter(is_active=True)
            
        if user and (user.is_staff or user.is_superuser):
            return query_set.filter(space_type=SpaceType.MANAGERS)

        if is_guest:
            return query_set.filter(space_type=SpaceType.GUEST)

        if not vehicle:
            return query_set

        if vehicle.vehicle_type in (Vehicle.VehicleType.MOTORCYCLE, Vehicle.VehicleType.BICYCLE):
            return query_set.filter(space_type__in=[SpaceType.MOTORCYCLE, SpaceType.EMERGENCY])

        if vehicle.vehicle_type == Vehicle.VehicleType.CAR:
            if vehicle.sub_type == Vehicle.SubType.ELECTRIC:
                return query_set.filter(space_type__in=[SpaceType.ELECTRIC, SpaceType.EMERGENCY])

            elif vehicle.sub_type == Vehicle.SubType.DISABLED:
                return query_set.filter(space_type__in=[SpaceType.DISABLED, SpaceType.EMERGENCY])

            elif vehicle.sub_type == Vehicle.SubType.CARGO:
                return query_set.filter(space_type__in=[SpaceType.LOADING, SpaceType.EMERGENCY])
            else:
                return query_set.filter(space_type__in=[SpaceType.NORMAL, SpaceType.EMERGENCY])
        return self.none()


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