import uuid
from django.db import models

class Comparison(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('PROCESSING', 'En cours de traitement'),
        ('SUCCESS', 'Succès'),
        ('FAILED', 'Échec'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_a = models.FileField(upload_to='uploads/')
    file_b = models.FileField(upload_to='uploads/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    output_image = models.ImageField(upload_to='results/', null=True, blank=True)
    differences_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comparaison {self.id} - {self.status}"