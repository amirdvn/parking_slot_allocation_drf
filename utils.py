from kavenegar import *
from decouple import config
import logging

logger = logging.getLogger(__name__)


def send_otp_code(phone_number, code):
    if config('SMS_BACKEND', default='mock') == 'kavenegar':
        _send_kavenegar(phone_number, code)
    else:
        _send_mock(phone_number, code)


def _send_kavenegar(phone_number, code):

    try:
        api = KavenegarAPI(config("KAVENEGAR_API_KEY"))
        params = {
            'sender': config('SENDER_NUMBER'),#optional
            'receptor': phone_number,#multiple mobile number, split by comma
            'message': f'کد تایید شما: {code}',
        } 
        
        response = api.sms_send(params)

        logger.info('SMS sent to %s via Kavenegar', phone_number)
        logger.debug('Kavenegar response: %s', response)
    except (APIException, HTTPException):
        logger.exception('Kavenegar failed for %s', phone_number)
        raise


def _send_mock(phone_number, code):
    logger.warning('[MOCK SMS] to=%s code=%s', phone_number, code)