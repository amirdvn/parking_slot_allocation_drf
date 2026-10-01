from rest_framework.throttling import SimpleRateThrottle

class BasePhoneThrottle(SimpleRateThrottle):

    def parse_rate(self, rate):

        if rate is None:
            return(None, None)
        num, seconds = rate.split('/')
        return int(num), int(seconds)


    def get_cache_key(self, request, view):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return None  
        return self.cache_format % {
            'scope': self.scope,
            'ident': phone_number,
        }

class LoginSendOtpThrottle(BasePhoneThrottle):
    scope = 'login_send_otp'

class LoginVerifyOtpThrottle(BasePhoneThrottle):
    scope = 'login_verify_otp'

class RegisterThrottle(BasePhoneThrottle):
    scope = 'register'

class ChangePhoneSendOtpThrottle(BasePhoneThrottle):
    scope = 'change_phone_send_otp'

class ChangePhoneVerifyOtpThrottle(BasePhoneThrottle):
    scope = 'change_phone_verify_otp'