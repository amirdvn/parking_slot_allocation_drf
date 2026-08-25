from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = ['id', 'plate_number', 'vehicle_type', 'sub_type', 'color', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']

    def validate_plate_number(self, value):
        queryset = Vehicle.objects.filter(plate_number=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('این پلاک قبلاً ثبت شده است')

        return value

    def validate(self, attrs):
        vehicle_type = attrs['vehicle_type']
        sub_type = attrs['sub_type']
        plate_number = attrs['plate_number']

        if not plate_number:
            raise serializers.ValidationError(
                {'plate_number':'شماره پلاک برای این نوع وسیله نقلیه الزامی اس'})

        if vehicle_type in [Vehicle.VehicleType.BICYCLE, Vehicle.VehicleType.MOTORCYCLE] and sub_type in[Vehicle.SubType.CARGO, Vehicle.SubType.DISABLED]:
            raise serializers.ValidationError(
                {'sub_type': 'دوچرخه/موتورسیکلت نمی‌تواند دارای حالت غیرمجاز باشد'})
        return attrs