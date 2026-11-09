from django.test import TestCase

from accounts.models import User
from vehicles.models import Vehicle
from vehicles.serializers import VehicleSerializer


def _make_user(phone):
    return User.objects.create_user(
        phone_number=phone,
        email=f'{phone}@test.com',
        full_name='Test',
        role=User.Role.USER,
        department=User.Department.WORKERS,
    )


class VehicleSerializerTest(TestCase):

    def setUp(self):
        self.user = _make_user('09120000010')

    def test_duplicate_plate_rejected(self):
        Vehicle.objects.create(
            user=self.user, plate_number='55555555',
            vehicle_type='CAR', sub_type='PASSENGER', color='BLACK',
        )
        serializer = VehicleSerializer(data={
            'plate_number': '55555555',
            'vehicle_type': 'CAR',
            'sub_type': 'PASSENGER',
            'color': 'WHITE',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate_number', serializer.errors)

    def test_motorcycle_cannot_be_cargo(self):
        serializer = VehicleSerializer(data={
            'plate_number': '66666666',
            'vehicle_type': 'MOTORCYCLE',
            'sub_type': 'CARGO',
            'color': 'BLACK',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('sub_type', serializer.errors)

    def test_bicycle_cannot_be_disabled(self):
        serializer = VehicleSerializer(data={
            'plate_number': '77777777',
            'vehicle_type': 'BICYCLE',
            'sub_type': 'DISABLED',
            'color': 'RED',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('sub_type', serializer.errors)