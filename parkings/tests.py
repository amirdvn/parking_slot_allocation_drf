from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from parkings.models import ParkingRequest, ParkingSpace, ParkingSpaceBlock
from parkings.services import ParkingRequestService
from vehicles.models import Vehicle


def _make_user(phone, role=User.Role.USER):
    return User.objects.create_user(
        phone_number=phone,
        email=f'{phone}@test.com',
        full_name=f'User {phone[-3:]}',
        role=role,
        department=User.Department.WORKERS,
    )


class ParkingRequestOverlapTest(TestCase):

    def setUp(self):
        self.user = _make_user('09120000001')
        self.other_user = _make_user('09120000002')
        self.space = ParkingSpace.objects.create(
            zone='NORTH', floor='GROUND', space_type='NORMAL',
        )
        self.vehicle = Vehicle.objects.create(
            user=self.user, plate_number='11111111',
            vehicle_type='CAR', sub_type='PASSENGER', color='BLACK',
        )
        self.other_vehicle = Vehicle.objects.create(
            user=self.other_user, plate_number='22222222',
            vehicle_type='CAR', sub_type='PASSENGER', color='WHITE',
        )
        self.start = timezone.now() + timedelta(hours=1)
        self.end = timezone.now() + timedelta(hours=2)

    def _create(self, vehicle, start, end):
        return ParkingRequestService.create(
            user=vehicle.user,
            validated_data={
                'vehicle': vehicle,
                'parking_space': self.space,
                'start_time': start,
                'end_time': end,
                'description': '',
            },
        )

    def test_overlapping_request_rejected(self):
        self._create(self.vehicle, self.start, self.end)
        with self.assertRaises(ValueError):
            self._create(
                self.other_vehicle,
                self.start + timedelta(minutes=30),
                self.end + timedelta(minutes=30),
            )

    def test_adjacent_request_allowed(self):
        self._create(self.vehicle, self.start, self.end)
        req = self._create(
            self.other_vehicle,
            self.end,
            self.end + timedelta(hours=1),
        )
        self.assertIsNotNone(req.id)

    def test_blocked_space_rejected(self):
        ParkingSpaceBlock.objects.create(
            parking_space=self.space,
            start_time=self.start,
            end_time=self.end,
            reason='REPAIR',
            created_by=self.user,
        )
        with self.assertRaises(ValueError):
            self._create(self.vehicle, self.start, self.end)


class ParkingRequestStateMachineTest(TestCase):

    def setUp(self):
        self.user = _make_user('09120000003')
        self.space = ParkingSpace.objects.create(
            zone='NORTH', floor='GROUND', space_type='NORMAL',
        )
        self.vehicle = Vehicle.objects.create(
            user=self.user, plate_number='33333333',
            vehicle_type='CAR', sub_type='PASSENGER', color='GRAY',
        )

    def _create(self):
        return ParkingRequestService.create(
            user=self.user,
            validated_data={
                'vehicle': self.vehicle,
                'parking_space': self.space,
                'start_time': timezone.now() + timedelta(hours=1),
                'end_time': timezone.now() + timedelta(hours=2),
                'description': '',
            },
        )

    def test_cancel_pending_succeeds(self):
        req = self._create()
        ParkingRequestService.cancel(req, 'changed plans')
        req.refresh_from_db()
        self.assertEqual(req.status, ParkingRequest.RequestStatus.CANCELED)

    def test_cancel_completed_fails(self):
        req = self._create()
        req.status = ParkingRequest.RequestStatus.COMPLETED
        req.save()
        with self.assertRaises(ValueError):
            ParkingRequestService.cancel(req, 'too late')


class EmergencySpaceTest(TestCase):

    def setUp(self):
        self.user = _make_user('09120000004')
        self.space = ParkingSpace.objects.create(
            zone='NORTH', floor='GROUND', space_type='EMERGENCY',
        )
        self.vehicle = Vehicle.objects.create(
            user=self.user, plate_number='44444444',
            vehicle_type='CAR', sub_type='PASSENGER', color='BLUE',
        )

    def test_emergency_space_requires_review(self):
        req = ParkingRequestService.create(
            user=self.user,
            validated_data={
                'vehicle': self.vehicle,
                'parking_space': self.space,
                'start_time': timezone.now() + timedelta(hours=1),
                'end_time': timezone.now() + timedelta(hours=2),
                'description': '',
            },
        )
        self.assertEqual(req.status, ParkingRequest.RequestStatus.NEEDS_REVIEW)