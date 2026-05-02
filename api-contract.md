# API Contract - LMS

Base URL : `http://localhost:5000/api`

---

## AUTH (Fatima)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | /auth/register | Public | Inscription |
| POST | /auth/login | Public | Connexion → retourne token |

**POST /auth/register**
```json
{ "name": "string", "email": "string", "password": "string", "role": "student|teacher" }
```

**POST /auth/login**
```json
{ "email": "string", "password": "string" }
```
Réponse : `{ "token": "...", "role": "...", "name": "..." }`

---

## COURS (Fatima)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | /courses | Authentifié | Liste tous les cours |
| POST | /courses | Teacher | Créer un cours |
| GET | /courses/:id | Authentifié | Détail d'un cours |
| DELETE | /courses/:id | Teacher | Supprimer un cours |

---

## INSCRIPTIONS (Ikram)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | /enrollments | Student | S'inscrire à un cours |
| GET | /enrollments/mine | Student | Mes cours inscrits |

---

## QUIZ (Ikram)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | /quizzes/:id | Student | Récupérer un quiz |
| POST | /quizzes/:id/submit | Student | Soumettre les réponses |

Réponse soumission : `{ "score": 8, "total": 10, "percentage": 80 }`

---

## ANNONCES (Ikram)

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | /announcements | Student | Liste annonces (avec ?course_id=1) |
| POST | /announcements | Teacher | Créer une annonce |
