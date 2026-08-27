from rest_framework.permissions import BasePermission

class IsManagerUserOrReadOnly(BasePermission):
    """
    Allows authenticated users to read,
    and managers/superusers to modify.
    """

    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return (
                request.user
                and request.user.is_authenticated)

        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == request.user.Role.MANAGER
                or request.user.is_superuser))