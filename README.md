# Projet LMS - Plateforme d'apprentissage en ligne

## Équipe
| Développeuse | Module | Responsabilités |
|---|---|---|
| **Fatima** | Créateur | Auth, Cours, Chapitres, Dashboard Enseignant |
| **Ikram** | Utilisateur | Resources, Inscriptions, Quiz, Progression, Annonces |

---

## Structure du projet
```
PROJET-LMS/
├── backend/
│   ├── routes/
│   │   ├── auth.js           ← Fatima
│   │   ├── courses.js        ← Fatima
│   │   ├── chapters.js       ← Fatima
│   │   ├── resources.js      ← Ikram
│   │   ├── enrollments.js    ← Ikram
│   │   ├── quizzes.js        ← Ikram
│   │   ├── announcements.js  ← Ikram
│   │   └── progress.js       ← Ikram
│   ├── middleware/
│   │   ├── auth.js           ← Commun
│   │   └── roleChecker.js    ← Commun
│   ├── db.js                 ← Commun
│   ├── app.js                ← Commun
│   └── .env                  ← Commun
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx           ← Fatima
│       │   ├── Register.jsx        ← Fatima
│       │   ├── TeacherDashboard.jsx← Fatima
│       │   ├── CourseCreator.jsx   ← Fatima
│       │   ├── StudentDashboard.jsx← Ikram
│       │   ├── CourseView.jsx      ← Ikram
│       │   ├── QuizPage.jsx        ← Ikram
│       │   └── Results.jsx         ← Ikram
│       ├── components/
│       │   ├── Navbar.jsx          ← Commun
│       │   ├── ProtectedRoute.jsx  ← Commun
│       │   ├── ProgressBar.jsx     ← Ikram
│       │   ├── FileViewer.jsx      ← Ikram
│       │   └── FileUploader.jsx    ← Ikram
│       └── services/
│           └── api.js              ← Commun
├── db/
│   └── init_db.sql           ← Commun
└── docs/
    ├── guide_utilisateur.md
    └── rapport_projet.md
```

---

## Installation

### Prérequis
- Node.js >= 18
- MySQL >= 8

### Base de données
```bash
mysql -u root -p < db/init_db.sql
```

### Backend
```bash
cd backend
npm install
# Copier et remplir les variables d'environnement
cp .env.example .env
node app.js
# ou en développement :
npx nodemon app.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Accès
| Interface | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |

---

## Stack technique
| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite |
| Style | Bootstrap 5 + CSS |
| Backend | Node.js + Express |
| Base de données | MySQL |
| Auth | JWT + bcrypt |
| Upload | Multer |

---

## Comptes de test
| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@lms.com | admin123 |
| Enseignant | fatima@lms.com | teacher123 |
| Étudiant | ikram@lms.com | student123 |