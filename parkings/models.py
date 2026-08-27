from django.db import models
from django.conf import settings 
import uuid

class ParkingSpace(models.Model):

    class Meta:
        verbose_name = 'جایگاه پارکینگ'
        verbose_name_plural = 'جایگاه‌های پارکینگ'

    class SpaceType(models.TextChoices):
        NORMAL = 'NORMAL', 'عادی'
        GUEST = 'GUEST', 'مهمان'
        MANAGERS = 'MANAGERS', 'مدیران'
        DISABLED = 'DISABLED', 'معلولین'
        MOTORCYCLE = 'MOTORCYCLE', 'موتور'
        ELECTRIC = 'ELECTRIC', 'خودرو برقی'
        LOADING = 'LOADING', 'بارگیری کوتاه مدت'
        EMERGENCY = 'EMERGENCY', 'جایگاه رزرو اضطراری'

    class ZoneChoice(models.TextChoices):
        NORTH = 'NORTH', 'بخش شمالی'
        SOUTH = 'SOUTH', 'بخش جنوبی'
        WEST = 'WEST', 'بخش غربی'
        EAST = 'EAST', 'بخش شرقی'

    class FloorChoice(models.TextChoices):
        GROUND = 'GROUND', 'همکف'
        FLOOR_1 = 'FLOOR_1', 'طبقه ۱'
        FLOOR_2 = 'FLOOR_2', 'طبقه ۲'
        BASEMENT_1 ='BASEMENT_1', 'طبقه منفی ۱'
        BASEMENT_2 = 'BASEMENT_2', 'طبقه منفی ۲'


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name='شناسه یکتا (UUID)')
    code = models.CharField(max_length=50, unique=True, editable=False, verbose_name='کد یکتا جایگاه')
    zone = models.CharField(max_length=50, choices=ZoneChoice.choices, default=ZoneChoice.NORTH, verbose_name='ناحیه')
    floor = models.CharField(max_length=50, choices=FloorChoice.choices, default=FloorChoice.GROUND, verbose_name='طبقه')
    space_type = models.CharField(max_length=30, choices=SpaceType.choices, default=SpaceType.NORMAL, verbose_name='نوع جایگاه')
    is_active = models.BooleanField(default=True, verbose_name='وضعیت فعال بودن')
    requires_permission = models.BooleanField(default=False, verbose_name='نیاز به تایید مدیر / مجوز')
    description = models.TextField(blank=True, null=True, verbose_name='ویژگی‌ها و توضیحات')

    def __str__(self):
        return f'{self.code} - {self.get_space_type_display()} - {self.get_floor_display()} - {self.get_zone_display()} - توضیحات: {self.description if self.description else "ندارد"}'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f'{self.zone}-{self.floor}-{str(self.id)[:3].upper()}'
        if self.zone == self.ZoneChoice.EAST:
            self.requires_permission = True
        return super().save(*args, **kwargs)