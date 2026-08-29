from django.contrib import admin
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock

admin.site.register(ParkingRequest)
admin.site.register(ParkingSpace)
admin.site.register(ParkingSpaceBlock)
