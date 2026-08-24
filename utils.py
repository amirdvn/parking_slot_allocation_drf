from kavenegar import *
from decouple import config

def send_otp_code(phone_number, code):

    try:
        api = KavenegarAPI(config("KAVENEGAR_API_KEY"))
        params = {
            'sender': '',#optional
            'receptor': phone_number,#multiple mobile number, split by comma
            'message': f'کد تایید شما: {code}',
        } 
        response = api.sms_send(params)
        print(response)
    except APIException as e: 
        print(e)
    except HTTPException as e: 
        print(e)