# Projet LMS - Plateforme d'apprentissage en ligne

## Équipe
- **Fatima** : Authentification, Cours, Chapitres, Ressources
- **Ikram** : Inscriptions, Quiz, Progression, Annonces

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env   # remplir les variables
node app.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de données
```bash
mysql -u root -p < db/init_db.sql
```

## Stack technique
- **Frontend** : React + Vite + Bootstrap
- **Backend** : Node.js + Express
- **Base de données** : MySQL
- **Auth** : JWT + bcrypt
