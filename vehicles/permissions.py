from rest_framework.permissions import BasePermission

class IsManagerUser(BasePermission):
    """Only managers / superusers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == request.user.Role.MANAGER or request.user.is_superuser)
        )