from .models import Vehicle
from vehicles.translations.fa import MESSAGES

class VehicleReportService:

    COLUMNS = [
        ('user_id', MESSAGES['vehicle']['report']['headers']['user_id']),
        ('full_name', MESSAGES['vehicle']['report']['headers']['full_name']),
        ('phone_number', MESSAGES['vehicle']['report']['headers']['phone_number']),
        ('plate_number', MESSAGES['vehicle']['report']['headers']['plate_number']),
        ('vehicle_type', MESSAGES['vehicle']['report']['headers']['vehicle_type']),
        ('sub_type', MESSAGES['vehicle']['report']['headers']['sub_type']),
        ('color', MESSAGES['vehicle']['report']['headers']['color']),
        ('is_active', MESSAGES['vehicle']['report']['headers']['is_active']),
        ('user_vehicle_count', MESSAGES['vehicle']['report']['headers']['user_vehicle_count']),
    ]

    HEADERS = [key for key, _ in COLUMNS]
    HEADER_LABELS = [label for _, label in COLUMNS]

    @staticmethod
    def iter_rows():
        from django.db.models import Count
        counts = dict(
            Vehicle.objects.values('user_id')
            .annotate(c=Count('id'))
            .values_list('user_id', 'c')
        )
        vehicles = Vehicle.objects.select_related('user').order_by('user_id', 'id').iterator(chunk_size=500)
        for v in vehicles:
            yield {
                'user_id': v.user_id,
                'full_name': v.user.full_name,
                'phone_number': v.user.phone_number,
                'plate_number': v.plate_number,
                'vehicle_type': v.get_vehicle_type_display(),
                'sub_type': v.get_sub_type_display(),
                'color': v.get_color_display(),
                'is_active': MESSAGES['vehicle']['report']['yes'] if v.is_active else MESSAGES['vehicle']['report']['no'],
                'user_vehicle_count': counts.get(v.user_id, 0),
            }