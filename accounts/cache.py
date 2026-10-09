from django.core.cache import cache
from django.conf import settings

class OtpCache:

    OTP_TTL = settings.OTP_TTL
    REGISTRATION_TTL = settings.REGISTRATION_TTL

    @staticmethod
    def _key(phone_number: str) -> str:
        return f'otp:{phone_number}'

    @classmethod
    def set(cls, phone_number: str, code: int) -> None:
        cache.set(cls._key(phone_number), code, timeout=cls.OTP_TTL)

    @classmethod
    def get(cls, phone_number: str) -> int | None:
        return cache.get(cls._key(phone_number))

    @classmethod
    def delete(cls, phone_number: str) -> None:
        cache.delete(cls._key(phone_number))



    @staticmethod
    def _registration_key(phone_number: str) -> str:
        return f'registration_verify:{phone_number}'

    @classmethod
    def set_registration_verified(cls, phone_number: str) -> None:
        cache.set(cls._registration_key(phone_number) ,True ,timeout=cls.REGISTRATION_TTL)

    @classmethod
    def is_registration_verified(cls, phone_number: str) -> bool:
        return cache.get(cls._registration_key(phone_number)) is True

    @classmethod
    def delete_registration_verified(cls, phone_number: str) -> None:
        cache.delete(cls._registration_key(phone_number))