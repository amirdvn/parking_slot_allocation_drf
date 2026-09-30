import random
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OtpCode
from utils import send_otp_code

User = get_user_model()


class OtpService:

    @staticmethod
    def _create_and_send(phone_number: str) -> None:
        code = random.randint(1000, 9999)
        OtpCode.objects.create(phone_number=phone_number, code=code)
        send_otp_code(phone_number=phone_number, code=code)

    
    @staticmethod
    def send_otp(phone_number: str) -> None:
        user = User.objects.filter(phone_number=phone_number).exists()
        if not user:
            raise ValueError('کاربری با این شماره یافت نشد')
        OtpService._create_and_send(phone_number)

    @staticmethod
    def verify_otp(phone_number: str, code: int) -> dict:
        otp = OtpCode.objects.get_valid(phone_number, code)
        if not otp:
            raise ValueError('کد تایید اشتباه یا منقضی شده است')

        otp.delete()

        user = User.objects.filter(phone_number=phone_number).first()
        if not user:
            return {'is_registered': False}

        tokens = RefreshToken.for_user(user)
        return {
            'is_registered': True,
            'tokens': {
                'refresh': str(tokens),
                'access': str(tokens.access_token),
            }
        }

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
        user = User.objects.create_user(
            email=validated_data['email'],
            phone_number=validated_data['phone_number'],
            full_name=validated_data['full_name'],
            role=validated_data['role'],
            department=validated_data['department'],
        )
        return user


    @staticmethod
    def change_phone(user, new_phone_number:str, code:int):
        otp = OtpCode.objects.get_valid(new_phone_number, code)
        if not otp:
            raise ValueError('کد تایید اشتباه یا منقضی شده است')
        
        otp.delete()    

        user.phone_number = new_phone_number
        user.save(update_fields=['phone_number'])
        
        return user


class AuthService:

    @staticmethod
    def logout(refresh_token: str) -> None:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            raise ValueError('Refresh Token نامعتبر است')