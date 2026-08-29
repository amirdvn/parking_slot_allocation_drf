from django.contrib import admin
from .models import ParkingSpace, ParkingRequest

admin.site.register(ParkingRequest)
admin.site.register(ParkingSpace)
