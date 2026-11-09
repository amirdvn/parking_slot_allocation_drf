from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManagerUser(BasePermission):
    """Only managers / superusers."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_manager)


class IsManagerOrGuard(BasePermission):
    """Only managers, guards, or superusers."""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.is_manager or request.user.is_guard)
        )


class IsManagerUserOrReadOnly(BasePermission):
    """Authenticated can read; only managers can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_manager)


class IsManagerForGetOrAuthenticatedForPost(BasePermission):
    """POST → any authenticated user; GET → only managers."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method == 'POST':
            return True
        if request.method == 'GET':
            return request.user.is_manager
        return False