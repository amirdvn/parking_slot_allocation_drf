from celery import shared_task
from utils import send_otp_code


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def send_otp_code_task(self, phone_number: str, code: int) -> None:
    try:
        send_otp_code(phone_number, code)
    except Exception as exc:
        raise self.retry(exc=exc)