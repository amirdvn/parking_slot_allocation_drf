import threading
from datetime import timedelta

from django.db import connection
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from accounts.models import User
from parkings.models import ParkingRequest, ParkingSpace, ParkingSpaceBlock
from parkings.services import ParkingRequestService, ParkingSpaceBlockService
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


class ParkingConcurrencyTest(TransactionTestCase):

    def setUp(self):
        self.user1 = _make_user('09121111111')
        self.user2 = _make_user('09122222222')

        self.vehicle1 = Vehicle.objects.create(
            user=self.user1, plate_number='11111111', vehicle_type='CAR', sub_type='PASSENGER', color='BLACK'
        )
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2, plate_number='22222222', vehicle_type='CAR', sub_type='PASSENGER', color='WHITE'
        )
        self.space = ParkingSpace.objects.create(zone='NORTH', floor='GROUND', space_type='NORMAL')
        self.start_time = timezone.now() + timedelta(hours=1)
        self.end_time = timezone.now() + timedelta(hours=2)

    def test_concurrent_request_creation_only_one_succeeds(self):

        results = []

        def create_request(user, vehicle):
            try:
                ParkingRequestService.create(
                    user=user,
                    validated_data={
                        'vehicle': vehicle,
                        'parking_space': self.space,
                        'start_time': self.start_time,
                        'end_time': self.end_time,
                        'description': ''
                    }
                )
                results.append('success')
            except ValueError as e:
                results.append(f'error: {e}')
            finally:
                connection.close()

        t1 = threading.Thread(target=create_request, args=(self.user1, self.vehicle1))
        t2 = threading.Thread(target=create_request, args=(self.user2, self.vehicle2))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        successes = results.count('success')
        errors = [r for r in results if r.startswith('error')]

        self.assertEqual(successes, 1, f"باید فقط ۱ درخواست موفق ثبت شود. نتایج: {results}")
        self.assertEqual(len(errors), 1, "باید یکی از درخواست‌ها با خطا مواجه شود.")
        self.assertIn('قبلاً رزرو شده', errors[0])

    def test_concurrent_block_creation_only_one_succeeds(self):

        results = []

        def create_block():
            try:
                ParkingSpaceBlockService.create(
                    validated_data={
                        'parking_space': self.space,
                        'start_time': self.start_time,
                        'end_time': self.end_time,
                        'reason': 'REPAIR',
                        'description': ''
                    },
                    created_by=self.user1
                )
                results.append('success')
            except ValueError as e:
                results.append(f'error: {e}')
            finally:
                connection.close()

        t1 = threading.Thread(target=create_block)
        t2 = threading.Thread(target=create_block)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        successes = results.count('success')
        errors = [r for r in results if r.startswith('error')]

        self.assertEqual(successes, 1, f"باید فقط ۱ انسداد موفق ثبت شود. نتایج: {results}")
        self.assertEqual(len(errors), 1, "باید یکی از انسدادها با خطا مواجه شود.")
        self.assertIn('قبلاً مسدود شده', errors[0])