from django.contrib import admin
from .models import ParkingSpace, ParkingRequest, ParkingSpaceBlock, EntryExitLog

admin.site.register(ParkingRequest)
admin.site.register(ParkingSpace)
admin.site.register(ParkingSpaceBlock)

@admin.register(EntryExitLog)
class EntryExitLogAdmin(admin.ModelAdmin):

    list_display = [
        'id',
        'vehicle',
        'parking_request',
        'entry_time',
        'exit_time',
        'guard',
    ]
    readonly_fields = [
        'entry_time',
    ]