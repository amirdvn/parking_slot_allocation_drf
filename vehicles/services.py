from .models import Vehicle

class VehicleReportService:

    COLUMNS = [
        ('user_id', 'شناسه کاربر'),
        ('full_name', 'نام و نام خانوادگی'),
        ('phone_number', 'شماره تلفن'),
        ('plate_number', 'پلاک'),
        ('vehicle_type', 'نوع وسیله'),
        ('sub_type', 'نوع سوخت / حالت'),
        ('color', 'رنگ'),
        ('is_active', 'فعال'),
        ('user_vehicle_count', 'تعداد خودروی کاربر'),
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
                'is_active': 'بله' if v.is_active else 'خیر',
                'user_vehicle_count': counts.get(v.user_id, 0),
            }