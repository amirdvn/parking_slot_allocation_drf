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


class IsGuardUserOrReadOnly(BasePermission):
    """
    Authenticated users can read.
    Only guards / superusers can write.
    """
    def has_permission(self, request, view):

        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated

        return (
            request.user.is_authenticated
            and (
                request.user.role == request.user.Role.GUARD
                or request.user.is_superuser))


class IsManagerOrGuard(BasePermission):
    """Only managers or guards can access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (
                request.user.role == request.user.Role.MANAGER
                or request.user.role == request.user.Role.GUARD
                or request.user.is_superuser))


class IsManagerForGetOrAuthenticatedForPost(BasePermission):
    """
    POST → any authenticated user
    GET  → only managers
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method == 'POST':
            return True 
        if request.method == 'GET':
            return request.user.role == request.user.Role.MANAGER or request.user.is_superuser
        return False

class IsManagerUser(BasePermission):
    """Only managers / superusers."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.role == request.user.Role.MANAGER or request.user.is_superuser)
        )

