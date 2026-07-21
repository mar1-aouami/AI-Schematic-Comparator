#!/bin/bash
set -e

echo "==> Application des migrations..."
python manage.py migrate --noinput

echo "==> Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

echo "==> Démarrage du Worker Celery en arrière-plan..."
celery -A backend worker --loglevel=info &

echo "==> Démarrage du serveur Web Gunicorn..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 2
