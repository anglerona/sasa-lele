from rest_framework import serializers
from .models import UserSettings

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'text_color',
            'input_border_color',
            'button_color',
            'button_text_color',
        ]
