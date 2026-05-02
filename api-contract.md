# API Contract - LMS Platform

**Base URL :** `http://localhost:5000/api`
**Auth :** Header `Authorization: Bearer <token>` requis sur toutes les routes protégées.

---

## AUTH — Fatima

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Inscription |
| POST | `/auth/login` | Public | Connexion |

**POST /auth/register**
```json
Body: { "name": "string", "email": "string", "password": "string", "role": "student|teacher" }
Réponse: { "message": "Compte créé avec succès" }
```

**POST /auth/login**
```json
Body: { "email": "string", "password": "string" }
Réponse: { "token": "...", "role": "teacher", "name": "Fatima", "id": 1 }
```

---

## COURS — Fatima

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/courses` | Authentifié | Liste tous les cours |
| GET | `/courses/:id` | Authentifié | Détail d'un cours |
| POST | `/courses` | Teacher/Admin | Créer un cours |
| PUT | `/courses/:id` | Teacher/Admin | Modifier un cours |
| DELETE | `/courses/:id` | Teacher/Admin | Supprimer un cours |
| GET | `/courses/mine` | Teacher | Mes cours |

**POST /courses**
```json
Body: { "title": "string", "description": "string" }
Réponse: { "message": "Cours créé", "id": 1 }
```

---

## CHAPITRES — Fatima

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/chapters/course/:courseId` | Authentifié | Chapitres d'un cours |
| POST | `/chapters` | Teacher/Admin | Créer un chapitre |
| DELETE | `/chapters/:id` | Teacher/Admin | Supprimer un chapitre |

**POST /chapters**
```json
Body: { "course_id": 1, "title": "string", "order_num": 1 }
Réponse: { "message": "Chapitre créé", "id": 1 }
```

---

## RESSOURCES — Ikram

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/resources/chapter/:chapterId` | Authentifié | Ressources d'un chapitre |
| POST | `/resources` | Teacher/Admin | Uploader une ressource |
| DELETE | `/resources/:id` | Teacher/Admin | Supprimer une ressource |

**POST /resources** (multipart/form-data)
```
Fields: chapter_id, title, type (pdf|video|link|document)
File: file (optionnel si type = link)
Réponse: { "message": "Ressource ajoutée", "url": "/uploads/fichier.pdf" }
```

---

## INSCRIPTIONS — Ikram

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/enrollments` | Student | S'inscrire à un cours |
| GET | `/enrollments/mine` | Student | Mes cours inscrits |

**POST /enrollments**
```json
Body: { "course_id": 1 }
Réponse: { "message": "Inscription réussie" }
```

---

## QUIZ — Ikram

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/quizzes/course/:courseId` | Student | Quiz d'un cours |
| GET | `/quizzes/:id` | Student | Détail d'un quiz |
| POST | `/quizzes/:id/submit` | Student | Soumettre les réponses |
| GET | `/quizzes/:id/results` | Student | Voir les résultats |
| POST | `/quizzes` | Teacher/Admin | Créer un quiz |

**POST /quizzes/:id/submit**
```json
Body: { "answers": { "question_id": "option_id", ... } }
Réponse: { "score": 8, "total": 10, "percentage": 80 }
```

---

## PROGRESSION — Ikram

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/progress/:courseId` | Student | % progression d'un cours |
| POST | `/progress/update` | Student | Marquer ressource comme vue |

**GET /progress/:courseId**
```json
Réponse: { "percentage": 65, "viewed": 5, "total": 8 }
```

**POST /progress/update**
```json
Body: { "course_id": 1, "resource_id": 3 }
Réponse: { "message": "Progression mise à jour" }
```

---

## ANNONCES — Ikram

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/announcements?course_id=1` | Authentifié | Annonces d'un cours |
| POST | `/announcements` | Teacher/Admin | Créer une annonce |

**POST /announcements**
```json
Body: { "course_id": 1, "title": "string", "content": "string" }
Réponse: { "message": "Annonce publiée" }
```