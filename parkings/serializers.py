from rest_framework import serializers
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock, EntryExitLog
from vehicles.models import Vehicle
from django.utils import timezone
from profiles.serializers import ProfileSerializer
from vehicles.serializers import VehicleSerializer
from django.contrib.auth import get_user_model


User = get_user_model()

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

#Manager

class ParkingSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpace
        fields = ['id', 'code', 'zone', 'floor', 'space_type', 'is_active', 'requires_permission', 'description']
        read_only_fields = ['id', 'code', 'requires_permission', 'is_active']


class ParkingSpaceBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpaceBlock
        fields = ['id', 'parking_space', 'start_time', 'end_time', 'reason', 'description', 'created_by', 'created_date']

        read_only_fields = ['id', 'created_by', 'created_date']

    def validate(self, attrs):

        start_time = attrs.get('start_time', self.instance.start_time if self.instance else None)
        end_time = attrs.get('end_time', self.instance.end_time if self.instance else None)
        parking_space = attrs.get('parking_space', self.instance.parking_space if self.instance else None)


        if start_time < timezone.now():
            raise serializers.ValidationError({'start_time':'زمان شروع نمی‌تواند در گذشته باشد'})
        
        if start_time >= end_time:
            raise serializers.ValidationError({'end_time':'زمان پایان باید بعد از زمان شروع باشد'})


        overlapping_blocks = ParkingSpaceBlock.objects.filter(
            parking_space=parking_space, start_time__lt=end_time, end_time__gt=start_time)

    
        if self.instance:
            overlapping_blocks = overlapping_blocks.exclude(id=self.instance.id)

        if overlapping_blocks.exists():
            raise serializers.ValidationError({'parking_space':'این جایگاه در بازه زمانی انتخاب‌شده قبلاً مسدود شده است'})

        return attrs


class ParkingRequestReviewSerializer(serializers.ModelSerializer): 
    class Meta: 
        model = ParkingRequest 
        fields = ['id', 'status', 'rejection_reason'] 
        read_only_fields = ['id'] 

    def validate(self, attrs): 
        status_value = attrs.get('status') 
        rejection_reason = attrs.get('rejection_reason') 

        if status_value not in [ ParkingRequest.RequestStatus.APPROVED, ParkingRequest.RequestStatus.REJECTED]: 
            raise serializers.ValidationError({ 'status': 'وضعیت باید تایید یا رد باشد' }) 

        if status_value == ParkingRequest.RequestStatus.REJECTED: 
            if not rejection_reason or not rejection_reason.strip(): 
                raise serializers.ValidationError({ 
                    'rejection_reason': 'دلیل رد درخواست الزامی است'}) 
        return attrs


class ParkingRequestManagerSerializer(serializers.ModelSerializer):

    user_detail = serializers.SerializerMethodField()
    vehicle_detail = serializers.SerializerMethodField()
    parking_space_detail = serializers.SerializerMethodField()

    class Meta:
        model = ParkingRequest

        fields = ['id', 'user_detail', 'vehicle_detail', 'parking_space_detail', 'start_time', 'end_time', 'status', 'description', 'rejection_reason', 'cancellation_reason',  'created_date']

        read_only_fields = fields

    def get_user_detail(self, obj):
        return {
            'id': obj.user.id,
            'full_name': obj.user.full_name,
            'phone_number': obj.user.phone_number,
        }

    def get_vehicle_detail(self, obj):

        if not obj.vehicle:
            return None

        return {
            'id': obj.vehicle.id,
            'plate_number': obj.vehicle.plate_number,
            'vehicle_type': obj.vehicle.vehicle_type,
            'sub_type': obj.vehicle.sub_type,
            'color': obj.vehicle.color,
        }

    def get_parking_space_detail(self, obj):

        if not obj.parking_space:
            return None

        return {
            'id': obj.parking_space.id,
            'code': obj.parking_space.code,
            'space_type': obj.parking_space.space_type,
            'zone': obj.parking_space.zone,
            'floor': obj.parking_space.floor,
        }


class ParkingManagerUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = ['id', 'phone_number', 'email', 'full_name', 'department', 'role', 'is_active', 'is_staff', 'description', 'created_date', 'updated_date']

        read_only_fields = ['id', 'phone_number', 'email', 'full_name', 'department', 'role', 'is_staff', 'created_date', 'updated_date']



class ParkingManagerVehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle

        fields = ['id', 'user', 'plate_number', 'vehicle_type', 'sub_type', 'color', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'user', 'plate_number', 'vehicle_type', 'sub_type', 'color', 'created_at', 'updated_at']




#User
class ParkingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingRequest
        fields = ['id', 'vehicle', 'parking_space', 'start_time', 'end_time', 'status', 'description', 'cancellation_reason', 'created_date', 'updated_date']
        read_only_fields = ['id', 'status', 'cancellation_reason', 'created_at', 'updated_at', 'created_date', 'updated_date']


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request and request.user and request.user.is_authenticated:
            self.fields['vehicle'].queryset = Vehicle.objects.none()
            self.fields['parking_space'].queryset = ParkingSpace.objects.none()

            user = request.user

            self.fields['vehicle'].queryset = Vehicle.objects.filter(user=user, is_active=True)

            vehicle_id = None

            if hasattr(self, 'initial_data'):
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

        if self.instance:
            if self.instance.status != ParkingRequest.RequestStatus.PENDING:
                raise serializers.ValidationError('فقط درخواست‌های در وضعیت «در انتظار بررسی» قابل ویرایش هستند')

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

        if parking_space and start_time and end_time:
            is_blocked = ParkingSpaceBlock.objects.filter(parking_space=parking_space, start_time__lt=end_time, end_time__gt=start_time)
            if self.instance:
                is_blocked = is_blocked.exclude(pk=self.instance.pk)

            if is_blocked.exists():
                raise serializers.ValidationError({'parking_space': 'این جایگاه در این بازه زمانی قبلاً مسدود شده است'})

        if parking_space and start_time and end_time:
            overlapping_requests = ParkingRequest.objects.filter(parking_space=parking_space, start_time__lt=end_time, end_time__gt=start_time, status__in=[ParkingRequest.RequestStatus.PENDING, ParkingRequest.RequestStatus.APPROVED, ParkingRequest.RequestStatus.IN_USE, ParkingRequest.RequestStatus.NEEDS_REVIEW])
            if self.instance:
                overlapping_requests = overlapping_requests.exclude(id=self.instance.id)
            if overlapping_requests.exists():
                raise serializers.ValidationError({'parking_space': 'این جایگاه در بازه زمانی انتخابی قبلاً درخواست یا رزرو شده است'})
    
        return validated_data


class ParkingRequestCancelSerializer(serializers.ModelSerializer):

    class Meta:
        model = ParkingRequest
        fields = ['id', 'cancellation_reason']
        read_only_fields = ['id']
        extra_kwargs = { 'cancellation_reason': { 'required': True } }

    def validate_cancellation_reason(self, value): 
        if not value.strip():
            raise serializers.ValidationError( 'دلیل لغو الزامی است' ) 
        return value


#Guard
class EntryExitLogSerializer(serializers.ModelSerializer):

    vehicle_detail = serializers.SerializerMethodField()
    parking_request_detail = serializers.SerializerMethodField()
    guard_detail = serializers.SerializerMethodField()

    class Meta:
        model = EntryExitLog
        fields = ['id', 'parking_request', 'parking_request_detail', 'vehicle', 'vehicle_detail', 'entry_time', 'exit_time', 'guard', 'guard_detail', 'description']

        read_only_fields = ['id', 'entry_time', 'exit_time', 'guard', 'vehicle_detail', 'parking_request_detail', 'guard_detail']

        extra_kwargs = {'vehicle': {'required': True}}

    def validate(self, attrs):

        vehicle = attrs.get('vehicle')
        parking_request = attrs.get('parking_request')
        exit_time = attrs.get('exit_time')

        if parking_request and vehicle:
            if parking_request.vehicle != vehicle:
                raise serializers.ValidationError({'vehicle': 'این خودرو با خودروی درخواست پارک یکسان نیست'})
        if parking_request:
            if parking_request.status != ParkingRequest.RequestStatus.APPROVED:
                raise serializers.ValidationError({
                    'parking_request': 'این درخواست هنوز تایید نشده است'})


            if timezone.now() < parking_request.start_time:
                raise serializers.ValidationError({'parking_request': 'هنوز زمان شروع این درخواست نرسیده است'})

            if timezone.now() > parking_request.end_time:
                raise serializers.ValidationError({'parking_request': 'زمان این درخواست به پایان رسیده است'})

            active_entry = EntryExitLog.objects.filter(parking_request=parking_request, exit_time__isnull=True).exists()
            if active_entry:
                raise serializers.ValidationError({'parking_request': 'برای این درخواست قبلاً ورود ثبت شده است'})

        return attrs

    def get_vehicle_detail(self, obj):
        if not obj.vehicle:
            return None

        return {
            'id': obj.vehicle.id,
            'plate_number': obj.vehicle.plate_number,
            'vehicle_type': obj.vehicle.vehicle_type,
            'color': obj.vehicle.color,
        }

    def get_parking_request_detail(self, obj):
        if not obj.parking_request:
            return None

        return {
            'id': obj.parking_request.id,
            'parking_space': obj.parking_request.parking_space.code,
            'start_time': obj.parking_request.start_time,
            'end_time': obj.parking_request.end_time,
            'status': obj.parking_request.status,
        }

    def get_guard_detail(self, obj):
        if not obj.guard:
            return None

        return {
            'id': obj.guard.id,
            'full_name': obj.guard.full_name,
            'phone_number': obj.guard.phone_number,
        }

#guest

class GuestParkingRequestSerializer(serializers.ModelSerializer):

    class Meta: 
        model = ParkingRequest 

        fields = ['id', 'parking_space', 'start_time', 'end_time', 'status', 'description', 'cancellation_reason', 'rejection_reason', 'is_guest', 'guest_name', 'guest_email', 'guest_phone', 'guest_plate_number', 'reason', 'created_date', 'updated_date'] 

        read_only_fields = [ 'id', 'status', 'is_guest', 'cancellation_reason', 'rejection_reason', 'created_date', 'updated_date', ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['parking_space'].queryset = get_allowed_parking_spaces(is_guest=True)

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        parking_space = attrs.get('parking_space')
        guest_name = attrs.get('guest_name')
        guest_phone = attrs.get('guest_phone')
        guest_email = attrs.get('guest_email')
        guest_plate_number = attrs.get('guest_plate_number')
        reason = attrs.get('reason')


        if not guest_name or not guest_name.strip():
            raise serializers.ValidationError({ 'guest_name': 'نام مهمان الزامی است' })

        if not guest_phone or not guest_phone.strip():
            raise serializers.ValidationError({ 'guest_phone': 'شماره تماس مهمان الزامی است' })

        if not guest_email or not guest_email.strip():
            raise serializers.ValidationError({ 'guest_email': 'ایمیل مهمان الزامی است' })

        if not guest_plate_number or not guest_plate_number.strip():
            raise serializers.ValidationError({ 'guest_plate_number': 'پلاک مهمان الزامی است' })

        if not reason or not reason.strip():
            raise serializers.ValidationError({ 'reason': 'دلیل مراجعه مهمان الزامی است' })

        if start_time and start_time < timezone.now():
            raise serializers.ValidationError({ 'start_time': 'زمان شروع نمی‌تواند در گذشته باشد' })

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({ 'end_time': 'زمان پایان باید بعد از زمان شروع باشد' })

        if parking_space and start_time and end_time:

            is_blocked = ParkingSpaceBlock.objects.filter( parking_space=parking_space, start_time__lt=end_time, end_time__gt=start_time)

            if is_blocked.exists(): 
                raise serializers.ValidationError({ 
                    'parking_space': 'این جایگاه در بازه زمانی انتخابی مسدود است' })

        if parking_space and start_time and end_time:

            overlapping_requests = ParkingRequest.objects.filter( parking_space=parking_space, start_time__lt=end_time, end_time__gt=start_time, status__in=[ ParkingRequest.RequestStatus.PENDING, ParkingRequest.RequestStatus.APPROVED, ParkingRequest.RequestStatus.IN_USE, ParkingRequest.RequestStatus.NEEDS_REVIEW, ] )

            if overlapping_requests.exists(): 
                raise serializers.ValidationError({ 
                    'parking_space': 'این جایگاه در بازه زمانی انتخابی قبلاً درخواست یا رزرو شده است' })

        if parking_space:

            if parking_space.space_type != ParkingSpace.SpaceType.GUEST:
                raise serializers.ValidationError(
                    {'parking_space': 'برای درخواست مهمان فقط جایگاه‌های نوع مهمان مجاز است'})

        return attrs


class GuestParkingRequestListSerializer(serializers.ModelSerializer):

    user_detail = serializers.SerializerMethodField()
    parking_space_detail = serializers.SerializerMethodField()

    class Meta:
        model = ParkingRequest

        fields = ['id', 'parking_space', 'parking_space_detail', 'user_detail', 'start_time', 'end_time', 'status', 'description', 'cancellation_reason', 'rejection_reason', 'guest_name', 'guest_email', 'guest_phone', 'guest_plate_number', 'reason', 'created_date', 'updated_date']

    def get_user_detail(self, obj):
        if not obj.user:
            return None
    
        return {
                'id': obj.user.id,
                'full_name': obj.user.full_name,
                'phone_number': obj.user.phone_number,
            }
    def get_parking_space_detail(self, obj):
        if not obj.parking_space:
            return None

        return {
            'id': obj.parking_space.id,
            'code': obj.parking_space.code,
            'floor':obj.parking_space.floor,
            'zone':obj.parking_space.zone,
            'status': obj.status,
        }