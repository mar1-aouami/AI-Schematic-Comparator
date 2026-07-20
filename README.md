# AI SCHEMATIC

AI Schematic est une application de comparaison intelligente de plans P&ID (Schémas de Tuyauterie et d'Instrumentation) et de schémas industriels. Elle permet de détecter de manière robuste et automatisée les modifications, ajouts et suppressions entre deux versions d'un même plan, en utilisant des algorithmes avancés de Computer Vision.

## 🚀 Fonctionnalités
- **Comparaison Topologique Avancée** : Détection des vraies différences (ajouts, suppressions) tout en ignorant les faux-positifs dus aux décalages (shift tolerance) ou aux légères variations d'épaisseur de trait liées à la CAO.
- **Support des PDF Industriels** : Rendu en ultra-haute résolution (zoom x3) pour capturer tous les détails de l'instrumentation.
- **Interface Cyberpunk / Blueprint** : Design très moderne et immersif offrant une excellente ergonomie de visualisation, avec un système de pan/zoom pour inspecter les anomalies en profondeur.
- **Traitement Asynchrone** : Traitement de l'image en arrière-plan via Celery pour ne jamais bloquer l'interface utilisateur.

## 🛠️ Stack Technique

### Backend (Python)
- **Django & Django REST Framework** : API REST robuste pour gérer les uploads et l'historique des comparaisons.
- **Celery & Redis** : File d'attente pour la gestion asynchrone des analyses lourdes d'images (Worker).
- **OpenCV & PyMuPDF** : Algorithmique de Computer Vision (Alignement ORB, transformées affines, opérations morphologiques).
- **PostgreSQL** : Base de données relationnelle.

### Frontend (Javascript)
- **React (Vite)** : Framework web pour la fluidité de l'interface.
- **TailwindCSS** : Design system personnalisé (couleurs blueprint, grid, text-glow).
- **React-Zoom-Pan-Pinch** : Pour l'exploration interactive des plans très haute définition.
- **Lucide-React** : Typographie et icônes.

## 🐳 Lancement Rapide (Docker)

Le projet est entièrement conteneurisé. Pour démarrer la plateforme en local :

1. Clonez ce dépôt.
2. À la racine du projet, lancez Docker Compose :
   ```bash
   docker-compose up --build
   ```
3. L'application est maintenant fonctionnelle avec ses différents services en réseau :
   - **Application Web (Frontend)** : [http://localhost:3000](http://localhost:3000)
   - **Backend API** : [http://localhost:8000](http://localhost:8000)
   - **Worker Celery** : S'exécute en tâche de fond.

## 🔬 Méthodologie d'Analyse (Pipeline CV)
Lors de la soumission de deux plans pour comparaison :
1. Extraction : Conversion des PDF en numpy array (OpenCV).
2. Alignement Géométrique : Utilisation d'extracteurs de caractéristiques (ORB) pour caler parfaitement le Plan B sur le Plan A (rotation, translation, échelle).
3. Tolérance aux décalages (Shift Tolerance) : Érosion morphologique appliquée pour éviter les faux-positifs lors des chevauchements.
4. Différenciation : Soustraction et identification des éléments ajoutés (verts) et supprimés (rouges).
5. Regroupement : Dilatation spatiale pour cercler intelligemment chaque anomalie avec une Bounding Box précise.
