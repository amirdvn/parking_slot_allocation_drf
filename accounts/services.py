import secrets
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .cache import OtpCache
from .tasks import send_otp_code_task
from rest_framework_simplejwt.exceptions import TokenError
from django.core.cache import cache

User = get_user_model()


class OtpService:

    @staticmethod
    def _create_and_send(phone_number: str) -> None:
        code = secrets.randbelow(9000) + 1000
        OtpCache.set(phone_number, code)
        send_otp_code_task.delay(phone_number=phone_number, code=code)

    
    @staticmethod
    def send_otp(phone_number: str) -> None:
        
        OtpService._create_and_send(phone_number)

    @staticmethod
    def verify(phone_number: str, code: int) -> None:
        lock_key = f'otp_lock:{phone_number}'

        with cache.lock(lock_key, timeout=5):
            otp = OtpCache.get(phone_number)
            if otp is None or otp != code:
                raise ValueError('کد تایید اشتباه یا منقضی شده است')

            OtpCache.delete(phone_number)


    @staticmethod
    def send_change_phone_otp(user, new_phone_number: str):
        if new_phone_number == user.phone_number:
            raise ValueError('شماره جدید وارد شده با شماره قبلی یکسان میباشد')
        already_exists = User.objects.filter(phone_number=new_phone_number).exists()

        if already_exists:
            raise ValueError('این شماره از قبل موجود میباشد')

        OtpService._create_and_send(new_phone_number)


class UserService:

    @staticmethod
    def register(validated_data: dict):
        email=validated_data['email']
        phone_number = validated_data['phone_number']

        if not OtpCache.is_registration_verified(phone_number):
            raise ValueError('ابتدا شماره تلفن خود را تأیید کنید')

        if User.objects.filter(email=email).exists():
            raise ValueError('این ایمیل قبلاً ثبت شده')
        
        if User.objects.filter(phone_number=phone_number).exists():
            raise ValueError('این شماره قبلاً ثبت شده')

        user = User.objects.create_user(
            email=email,
            phone_number=phone_number,
            full_name=validated_data['full_name'],
            role=User.Role.USER,
            department=User.Department.WORKERS,
        )
        
        OtpCache.delete_registration_verified(phone_number)

        return user


    @staticmethod
    def change_phone(user, new_phone_number:str, code:int):
        OtpService.verify(new_phone_number, code)
        user.phone_number = new_phone_number
        user.save(update_fields=['phone_number'])
        
        return user


class AuthService:

    @staticmethod
    def logout(refresh_token: str) -> None:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            raise ValueError('Refresh Token نامعتبر است')
    
    @staticmethod
    def verify_login_otp(phone_number: str, code: int) -> dict:
        OtpService.verify(phone_number, code)
        user = User.objects.filter(phone_number=phone_number).first()

        if not user:
            OtpCache.set_registration_verified(phone_number)
            return {'is_registered': False}

        if not user.is_active:
            raise ValueError('حساب کاربری شما فعال نیست')
        
        tokens = RefreshToken.for_user(user)
        
        return {
            'is_registered': True,
            'tokens': {
                'refresh': str(tokens),
                'access': str(tokens.access_token),
            }
        }