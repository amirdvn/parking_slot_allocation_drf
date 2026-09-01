from django.db import models
from django.conf import settings 
import uuid
from vehicles.models import Vehicle


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

        self.code = f'{self.zone}-{self.floor}-{str(self.id)[:3].upper()}'
        if self.zone == self.ZoneChoice.EAST:
            self.requires_permission = True
        return super().save(*args, **kwargs)


class ParkingRequest(models.Model):

    class Meta:
        verbose_name = 'درخواست پارکینگ'
        verbose_name_plural = 'درخواست‌های پارکینگ'
        ordering = ['-id']

    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'در انتظار بررسی'
        APPROVED = 'APPROVED', 'تایید شده'
        REJECTED = 'REJECTED', 'رد شده'
        CANCELED = 'CANCELED', 'لغو شده '
        EXPIRED = 'EXPIRED', 'منقضی شده'
        IN_USE = 'IN_USE', 'در حال استفاده'
        COMPLETED = 'COMPLETED', 'تکمیل شده'
        NEEDS_REVIEW = 'NEEDS_REVIEW', 'نیازمند بررسی دستی'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='کاربر')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, null=True, blank=True, verbose_name='وسیله نقلیه')
    parking_space = models.ForeignKey('ParkingSpace', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='جایگاه ')
    
    start_time = models.DateTimeField(verbose_name='ساعت شروع')
    end_time = models.DateTimeField(verbose_name='ساعت پایان')
    
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING, verbose_name='وضعیت درخواست')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    cancellation_reason = models.TextField(blank=True, null=True, verbose_name='دلیل لغو')
    rejection_reason = models.TextField( blank=True, null=True, verbose_name='دلیل رد درخواست' )
    created_date = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_date = models.DateTimeField(auto_now=True, verbose_name='تاریخ آخرین بروزرسانی')
    #GUEST
    is_guest = models.BooleanField(default=False, verbose_name="درخواست مهمان")
    guest_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="نام مهمان")
    guest_email = models.EmailField(max_length=150, blank=True, null=True, verbose_name="ایمیل مهمان")
    guest_phone = models.CharField(max_length=11, blank=True, null=True, verbose_name="شماره تماس مهمان")
    guest_plate_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="شماره پلاک مهمان")
    reason = models.TextField(blank=True, null=True, verbose_name="دلیل مراجعه")


    def __str__(self):
        return f'{self.user} - {self.vehicle} - {self.parking_space} - {self.get_status_display()}'


class ParkingSpaceBlock(models.Model):
    class Meta:
        verbose_name = 'انسداد جایگاه'
        verbose_name_plural = 'انسداد جایگاه ها'
        ordering = ['-id']

    class ReasonChoice(models.TextChoices):
        REPAIR = 'REPAIR', 'تعمیرات و نگهداری'
        EVENT = 'EVENT', 'رویداد سازمانی'
        CLEANING = 'CLEANING', 'نظافت و شستشوی محوطه'
        VIP_RESERVE = 'VIP_RESERVE', 'رزرو مقامات یا مهمان ویژه'
        EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE', 'خرابی تجهیزات'
        OTHER = 'OTHER', 'سایر موارد'


    parking_space = models.ForeignKey('ParkingSpace', on_delete=models.CASCADE, related_name='blocks', verbose_name='جایگاه')

    start_time = models.DateTimeField(verbose_name='زمان شروع مسدودی')
    end_time = models.DateTimeField(verbose_name='زمان پایان مسدودی')
    reason = models.CharField(max_length=255, choices=ReasonChoice.choices, default=ReasonChoice.REPAIR, verbose_name='دلیل مسدودی')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات ')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='ثبت کننده')
    created_date = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت ')

    def __str__(self):
        return f'انسداد {self.parking_space.code} ({self.start_time.strftime("%Y-%m-%d %H:%M")} تا {self.end_time.strftime("%Y-%m-%d %H:%M")})'


class EntryExitLog(models.Model):

    class Meta:
        verbose_name=' گزارش ورود و خروج'
        verbose_name_plural='گزارشات ورود و خروج'

    parking_request = models.ForeignKey('ParkingRequest', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='درخواست')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, blank=True, null=True, verbose_name='وسیله نقلیه')

    entry_time = models.DateTimeField(auto_now_add=True, verbose_name=' زمان ورود')
    exit_time = models.DateTimeField(null=True, blank=True, verbose_name='زمان خروج ')

    guard = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='نگهبان')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')

    def __str__(self):
        if self.vehicle:
            return f'{self.vehicle.plate_number} - {self.entry_time.strftime("%Y%m%d-%H:%M:%S")}'
        return f'بدون وسیله نقلیه - {self.entry_time.strftime("%Y%m%d-%H:%M:%S")}'