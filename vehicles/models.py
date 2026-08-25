from django.db import models
from django.conf import settings 

class Vehicle(models.Model):

    class Meta:
        verbose_name = 'وسیله نقلیه'
        verbose_name_plural = 'وسایل نقلیه'
        ordering = ['-id']
    class VehicleType(models.TextChoices):
        CAR = 'CAR', 'ماشین'
        MOTORCYCLE = 'MOTORCYCLE', 'موتورسیکلت'
        BICYCLE = 'BICYCLE', 'دوچرخه'

    class SubType(models.TextChoices):
        PASSENGER = 'PASSENGER', 'عادی / سواری'
        CARGO = 'CARGO', 'باری'
        ELECTRIC = 'ELECTRIC', 'برقی'
        DISABLED = 'DISABLED', 'معلولین'

    class ColorType(models.TextChoices):
        RED = 'RED', 'قرمز'
        BLUE = 'BLUE', 'آبی'
        GREEN = 'GREEN', 'سبز'
        BLACK = 'BLACK', 'مشکی'
        WHITE = 'WHITE', 'سفید'
        YELLOW = 'YELLOW', 'زرد'
        ORANGE = 'ORANGE', 'نارنجی'
        PURPLE = 'PURPLE', 'بنفش'
        BROWN = 'BROWN', 'قهوه‌ای'
        GRAY = 'GRAY', 'خاکستری'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles', verbose_name='مالک')
    plate_number = models.CharField(max_length=10, unique=True, verbose_name='پلاک')
    vehicle_type = models.CharField(max_length=20, choices=VehicleType.choices, default=VehicleType.CAR, verbose_name='نوع وسیله نقلیه')
    sub_type = models.CharField(max_length=20, choices=SubType.choices, default=SubType.PASSENGER, verbose_name='نوع سوخت / حالت')
    color = models.CharField(max_length=20, choices=ColorType.choices, default=ColorType.BLACK, verbose_name='رنگ')
    is_active = models.BooleanField(default=False, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ آخرین بروزرسانی')
    
    def __str__(self):
        return f'کاربر:{self.user} - وسیله نقلیه:{self.get_vehicle_type_display()}  - پلاک:{self.plate_number} - نوع:{self.get_sub_type_display()}'
