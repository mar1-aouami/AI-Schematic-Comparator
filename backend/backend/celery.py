import os
from celery import Celery

# Définir le module de paramètres par défaut pour Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Nommer notre application Celery
app = Celery('backend')

# Charger la configuration depuis settings.py (toutes les variables commençant par CELERY_)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Dire à Celery de chercher automatiquement les fichiers "tasks.py" dans tes applications (comme "api")
app.autodiscover_tasks()