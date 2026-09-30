from django.core.cache import cache
from django.conf import settings

class OtpCache:

    TTL = settings.OTP_TTL

    @staticmethod
    def _key(phone_number: str) -> str:
        return f'otp:{phone_number}'

    @classmethod
    def set(cls, phone_number: str, code: int) -> None:
        cache.set(cls._key(phone_number), code, timeout=cls.TTL)

    @classmethod
    def get(cls, phone_number: str) -> int | None:
        return cache.get(cls._key(phone_number))

    @classmethod
    def delete(cls, phone_number: str) -> None:
        cache.delete(cls._key(phone_number))
