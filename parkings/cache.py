from django.conf import settings
from django.core.cache import cache


class AllowedParkingSpacesCache:

    TTL = getattr(settings, 'ALLOWED_PARKING_SPACE_CACHE_TTL')
    PREFIX = 'allowed_spaces'

    @classmethod
    def make_key(cls, vehicle_type=None, sub_type=None, is_guest=False, is_manager=False):
        if is_manager:
            return f'{cls.PREFIX}:manager'
        
        if is_guest:
            return f'{cls.PREFIX}:guest'
        
        if not vehicle_type:
            return f'{cls.PREFIX}:all'
        
        return f'{cls.PREFIX}:{vehicle_type}:{sub_type or 'default'}'

    @classmethod
    def get(cls, key):
        return cache.get(key)

    @classmethod
    def set(cls, key, ids):
        cache.set(key, ids, timeout=cls.TTL)

    @classmethod
    def invalidate_all(cls):
        cache.delete_pattern(f'{cls.PREFIX}:*')



class DashboardCache:
    TTL = getattr(settings, 'DASHBOARD_CACHE_TTL')
 
    MANAGER_KEY = 'dashboard:manager'
    GUARD_KEY = 'dashboard:guard'   

    @classmethod
    def get(cls, key):
        return cache.get(key)

    @classmethod
    def set(cls, key, data):
        cache.set(key, data, timeout=cls.TTL)

    @classmethod
    def invalidate(cls):
        cache.delete(cls.MANAGER_KEY)
        cache.delete(cls.GUARD_KEY)