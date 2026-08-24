from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        USER = 'USER', 'کاربر'
        GUARD = 'GUARD', 'نگهبان'
        MANAGER = 'MANAGER', 'مدیر'

    class Department(models.TextChoices):
        MANAGEMENT = 'MANAGEMENT', 'مدیریت'
        ADMINISTRATIVE = 'ADMINISTRATIVE', 'اداری'
        WORKERS = 'WORKERS', 'کارگران'

    email = models.EmailField(max_length=225, unique=True, verbose_name='ایمیل')
    phone_number = models.CharField(max_length=11, unique=True, verbose_name='شماره تلفن')
    full_name = models.CharField(max_length=255, verbose_name='نام و نام خانوادگی')
    department = models.CharField(
        max_length=20, choices=Department.choices,
        default=Department.WORKERS, verbose_name='دپارتمان'
    )
    role = models.CharField(
        max_length=10, choices=Role.choices,
        default=Role.USER, verbose_name='نقش'
    )
    is_active = models.BooleanField(default=False, verbose_name='فعال')
    is_staff = models.BooleanField(default=False, verbose_name='دسترسی ادمین')
    created_date = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت‌نام')
    updated_date = models.DateTimeField(auto_now=True, verbose_name='تاریخ آخرین بروزرسانی')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['email', 'full_name']

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return self.email


class OtpCode(models.Model):
    phone_number = models.CharField(max_length=11, verbose_name='شماره تلفن')
    code = models.PositiveIntegerField(verbose_name='کد تایید')
    created_date = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    def __str__(self):
        return f'{self.phone_number} - {self.code} - {self.created_date}'
    