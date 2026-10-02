from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = ['id', 'plate_number', 'vehicle_type', 'sub_type', 'color', 'is_active', 'created_at', 'updated_at']

        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']


    def validate(self, attrs):
        vehicle_type = attrs.get('vehicle_type') or getattr(self.instance, 'vehicle_type', None)
        sub_type = attrs.get('sub_type') or getattr(self.instance, 'sub_type', None)


        if vehicle_type in [Vehicle.VehicleType.BICYCLE, Vehicle.VehicleType.MOTORCYCLE] and sub_type in[Vehicle.SubType.CARGO, Vehicle.SubType.DISABLED]:
            raise serializers.ValidationError(
                {'sub_type': 'دوچرخه/موتورسیکلت نمی‌تواند دارای حالت غیرمجاز باشد'})
        return attrs