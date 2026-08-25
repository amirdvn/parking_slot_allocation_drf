from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'phone_number', 'full_name', 'department', 'role', 'description']
        read_only_fields = ['email', 'phone_number', 'role']