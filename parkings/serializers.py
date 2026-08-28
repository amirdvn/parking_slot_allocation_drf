from rest_framework import serializers
from .models import ParkingSpace, ParkingRequest
from vehicles.models import Vehicle
from django.utils import timezone


def get_allowed_parking_spaces(vehicle=None, user=None, is_guest=False):

    query_set = ParkingSpace.objects.filter(is_active=True)
        
    if user and (user.is_staff or user.is_superuser):
        return query_set.filter(space_type=ParkingSpace.SpaceType.MANAGERS)

    if is_guest:
        return query_set.filter(space_type=ParkingSpace.SpaceType.GUEST)

    if not vehicle:
        return query_set

    if vehicle.vehicle_type in (Vehicle.VehicleType.MOTORCYCLE, Vehicle.VehicleType.BICYCLE):
        return query_set.filter(space_type__in=[ParkingSpace.SpaceType.MOTORCYCLE, ParkingSpace.SpaceType.EMERGENCY])

    if vehicle.vehicle_type == Vehicle.VehicleType.CAR:
        if vehicle.sub_type == Vehicle.SubType.ELECTRIC:
            return query_set.filter(space_type__in=[ParkingSpace.SpaceType.ELECTRIC, ParkingSpace.SpaceType.EMERGENCY])

        elif vehicle.sub_type == Vehicle.SubType.DISABLED:
            return query_set.filter(space_type__in=[ParkingSpace.SpaceType.DISABLED, ParkingSpace.SpaceType.EMERGENCY])

        elif vehicle.sub_type == Vehicle.SubType.CARGO:
            return query_set.filter(space_type__in=[ParkingSpace.SpaceType.LOADING, ParkingSpace.SpaceType.EMERGENCY])
        else:
            return query_set.filter(space_type__in=[ParkingSpace.SpaceType.NORMAL, ParkingSpace.SpaceType.EMERGENCY])
    return ParkingSpace.objects.none()

class ParkingSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpace
        fields = ['id', 'code', 'zone', 'floor', 'space_type', 'is_active', 'requires_permission', 'description']
        read_only_fields = ['id', 'code', 'requires_permission', 'is_active']


class ParkingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingRequest
        fields = ['id', 'vehicle', 'parking_space', 'start_time', 'end_time', 'status', 'description', 'cancellation_reason', 'created_date', 'updated_date']
        read_only_fields = ['id', 'status', 'cancellation_reason', 'created_at', 'updated_at', 'created_date', 'updated_date']


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request.user and request.user.is_authenticated:
            self.fields['vehicle'].queryset = Vehicle.objects.none()
            self.fields['parking_space'].queryset = ParkingSpace.objects.none()

            user = request.user

            self.fields['vehicle'].queryset = Vehicle.objects.filter(user=user, is_active=True)

            vehicle_id = self.initial_data.get('vehicle')

            if vehicle_id:
                vehicle = Vehicle.objects.filter(id=vehicle_id, user=user, is_active=True).first()

                if vehicle:
                    self.fields['parking_space'].queryset = (get_allowed_parking_spaces(vehicle=vehicle, user=user))
                else:
                    self.fields['parking_space'].queryset = ParkingSpace.objects.none()
            else:
                self.fields['parking_space'].queryset = ParkingSpace.objects.none()
            

    def validate_vehicle(self, value):

        request = self.context.get('request')
        user = request.user

        if value.user != user:
            raise serializers.ValidationError('این خودرو متعلق به شما نیست')

        if not value.is_active:
            raise serializers.ValidationError('این خودرو فعال نیست')

        return value

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        parking_space = validated_data.get('parking_space')
        vehicle = validated_data.get('vehicle')

        request = self.context.get('request')
        user = request.user

        if parking_space and vehicle:
            allowed_spaces = get_allowed_parking_spaces(vehicle=vehicle, user=user)
            if not allowed_spaces.filter(id=parking_space.id).exists():
                raise serializers.ValidationError({'parking_space':'این جایگاه با وسیله نقلیه انتخاب‌شده همخوانی ندارد'})

        if start_time and end_time:
            if start_time < timezone.now():
                raise serializers.ValidationError({'start_time':'زمان شروع نمی‌تواند در گذشته باشد'})

            if start_time >= end_time:
                raise serializers.ValidationError({'end_time':'زمان پایان باید بعد از زمان شروع باشد'})