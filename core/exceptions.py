from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    AuthenticationFailed
)
from core.translations.common import MESSAGES as COMMON_MESSAGES


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            response.data['detail'] = COMMON_MESSAGES['authentication_required']

        elif isinstance(exc, PermissionDenied):
            response.data['detail'] = COMMON_MESSAGES['permission_denied']

        elif isinstance(exc, NotFound):
            response.data['detail'] = COMMON_MESSAGES['not_found']

        elif isinstance(exc, MethodNotAllowed):
            response.data['detail'] = COMMON_MESSAGES['method_not_allowed']

        elif response.status_code >= 500:
            response.data['detail'] = COMMON_MESSAGES['server_error']

    return response