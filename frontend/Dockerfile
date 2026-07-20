# Utilisation d'une image Node.js légère
FROM node:20-alpine

# Définition du répertoire de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code
COPY . .

# Exposition du port utilisé par Vite
EXPOSE 3000

# Lancement en mode développement
CMD ["npm", "run", "dev"]
