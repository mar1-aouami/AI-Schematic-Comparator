from rest_framework import serializers
from .models import Comparison

class ComparisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comparison
        fields = ['id', 'file_a', 'file_b', 'status', 'output_image', 'differences_json', 'created_at']
        # On empêche React de modifier manuellement le statut ou l'ID
        read_only_fields = ['id', 'status', 'output_image', 'differences_json', 'created_at']