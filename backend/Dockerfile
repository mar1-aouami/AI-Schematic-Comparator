FROM python:3.12-slim

# Définition du répertoire de travail dans le conteneur
WORKDIR /app

# Empêche Python d'écrire des fichiers .pyc et force l'affichage des logs
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Installation des dépendances système nécessaires pour OpenCV et PostgreSQL
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copie du reste du code du backend
COPY . .

RUN chmod +x start.sh

CMD ["./start.sh"]
