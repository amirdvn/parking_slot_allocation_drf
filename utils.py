from kavenegar import *
from decouple import config

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
        print(response)
    except APIException as e: 
        print(e)
        raise
    except HTTPException as e: 
        print(e)
        raise

def _send_mock(phone_number, code):
    print(f'[MOCK SMS] to={phone_number} code={code}')