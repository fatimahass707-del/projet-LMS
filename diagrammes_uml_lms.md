# Architecture & Diagrammes UML du Projet LMS

Ce document rassemble les spécifications techniques et les diagrammes UML exacts du projet **LMS (Learning Management System)**. Ces schémas reflètent rigoureusement la structure de la base de données MySQL, l'architecture du backend (Express/Node.js) et du frontend (React/Vite).

---

## 1. Diagramme Entité-Relation (Modèle de Données / Diagramme de Classes)

Ce diagramme modélise l'intégralité des tables MySQL (`lms_db`), leurs clés primaires (PK), clés étrangères (FK), types de champs exacts et les relations (1:N, N:M) entre les entités.

```mermaid
erDiagram
    USERS ||--o{ COURSES : "enseigne (teacher_id)"
    USERS ||--o{ ENROLLMENTS : "s'inscrit (student_id)"
    USERS ||--o{ SUBMISSIONS : "soumet (student_id)"
    USERS ||--o{ PROGRESS : "suit (student_id)"
    USERS ||--o{ ANNOUNCEMENTS : "publie (teacher_id)"

    COURSES ||--o{ CHAPTERS : "contient (course_id)"
    COURSES ||--o{ ENROLLMENTS : "a des inscrits (course_id)"
    COURSES ||--o{ QUIZZES : "propose (course_id)"
    COURSES ||--o{ ANNOUNCEMENTS : "concerne (course_id)"
    COURSES ||--o{ PROGRESS : "mesure (course_id)"

    CHAPTERS ||--o{ RESOURCES : "contient (chapter_id)"

    RESOURCES ||--o{ PROGRESS : "suivi par (resource_id)"

    QUIZZES ||--o{ QUESTIONS : "contient (quiz_id)"
    QUIZZES ||--o{ SUBMISSIONS : "évalué par (quiz_id)"

    QUESTIONS ||--o{ OPTIONS : "offre (question_id)"

    USERS {
        int id PK
        varchar(100) name
        varchar(150) email "UNIQUE"
        varchar(255) password_hash
        enum role "admin, teacher, student"
        enum status "active, blocked"
        timestamp created_at
    }

    COURSES {
        int id PK
        varchar(200) title
        text description
        int teacher_id FK
        boolean is_published
        timestamp created_at
    }

    CHAPTERS {
        int id PK
        int course_id FK
        varchar(200) title
        int order_num
    }

    RESOURCES {
        int id PK
        int chapter_id FK
        varchar(200) title
        enum type "pdf, video, link, document"
        varchar(500) url
        timestamp created_at
    }

    ENROLLMENTS {
        int id PK
        int student_id FK
        int course_id FK
        timestamp enrolled_at
    }

    QUIZZES {
        int id PK
        int course_id FK
        varchar(200) title
        timestamp created_at
    }

    QUESTIONS {
        int id PK
        int quiz_id FK
        text question_text
    }

    OPTIONS {
        int id PK
        int question_id FK
        varchar(300) option_text
        boolean is_correct
    }

    SUBMISSIONS {
        int id PK
        int student_id FK
        int quiz_id FK
        int score
        int total
        timestamp submitted_at
    }

    PROGRESS {
        int id PK
        int student_id FK
        int course_id FK
        int resource_id FK
        timestamp viewed_at
    }

    ANNOUNCEMENTS {
        int id PK
        int course_id FK
        int teacher_id FK
        varchar(200) title
        text content
        timestamp created_at
    }
```

---

## 2. Diagramme d'Architecture du Système (Composants & Flux)

Présentation des flux de communication entre le client (Navigateur / React), l'API Backend Express.js (et ses routeurs/middlewares) et la base de données MySQL.

```mermaid
flowchart TB
    subgraph Frontend [Frontend - React / Vite]
        UI[Interfaces Utilisateur : Dashboards, Pages Cours]
        API_Client[Service API / Axios]
        Auth_Context[Gestion d'État / Stockage Token JWT]
    end

    subgraph Backend [Backend API - Node.js / Express]
        Router[Express Router : /api]
        MW_Auth[Middleware Auth JWT & Role Checker]
        
        subgraph Controllers [Contrôleurs / Routes API]
            Auth_Route[auth.js]
            Courses_Route[courses.js]
            Quizzes_Route[quizzes.js]
            Enroll_Route[enrollments.js]
            Prog_Route[progress.js]
            Notif_Route[notifications.js]
            Admin_Route[admin.js]
        end

        DB_Connector[Module Connexion DB : db.js / MySQL2]
    end

    subgraph Database [Serveur Base de Données]
        MySQL[(MySQL : lms_db)]
    end

    UI <-->|Requêtes HTTP / Réponses JSON| API_Client
    API_Client -->|Envoi Bearer Token| MW_Auth
    MW_Auth --> Auth_Route & Courses_Route & Quizzes_Route & Enroll_Route & Prog_Route & Notif_Route & Admin_Route
    Auth_Route & Courses_Route & Quizzes_Route & Enroll_Route & Prog_Route & Notif_Route & Admin_Route <--> DB_Connector
    DB_Connector <-->|Pool Requêtes SQL / Requêtes Préparées| MySQL

    style Frontend fill:#e3f2fd,stroke:#1e88e5,stroke-width:2px
    style Backend fill:#e8f5e9,stroke:#43a047,stroke-width:2px
    style Database fill:#fff3e0,stroke:#fb8c00,stroke-width:2px
```

---

## 3. Diagramme de Cas d'Utilisation (Use Cases des Acteurs)

Les trois rôles distincts de la plateforme (`student`, `teacher`, `admin`) et leurs interactions avec le système.

```mermaid
graph LR
    subgraph Acteurs
        Student((Étudiant))
        Teacher((Enseignant / Formateur))
        Admin((Administrateur))
    end

    subgraph Système LMS
        UC1[S'authentifier & Gérer son Profil]
        UC2[Consulter le Catalogue & S'inscrire à un Cours]
        UC3[Suivre les Ressources de Cours & Progrès]
        UC4[Passer des Quiz & Consulter ses Scores]
        UC5[Consulter les Notifications & Annonces]
        
        UC6[Créer et Éditer des Cours & Chapitres]
        UC7[Ajouter / Supprimer des Ressources]
        UC8[Créer des Quiz & Questions]
        UC9[Publier des Annonces aux Étudiants]
        
        UC10[Gérer tous les Utilisateurs : Bloquer/Activer]
        UC11[Superviser l'intégralité des Cours]
        UC12[Consulter les Statistiques Globales]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5

    Teacher --> UC1
    Teacher --> UC6
    Teacher --> UC7
    Teacher --> UC8
    Teacher --> UC9

    Admin --> UC1
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    style Acteurs fill:#f5f5f5,stroke:#999,stroke-width:2px
    style Système LMS fill:#fafafa,stroke:#333,stroke-width:2px
```

---

## 4. Diagramme de Séquence : Authentification & Token JWT

Processus d'identification d'un utilisateur et d'accès sécurisé aux routes protégées par jeton d'authentification (JSON Web Token).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Navigateur (React)
    participant API as Backend (Express)
    participant DB as MySQL (lms_db)

    Client->>API: POST /api/auth/login {email, password}
    API->>DB: SELECT * FROM users WHERE email = ?
    
    alt Utilisateur non trouvé ou bloqué
        DB-->>API: Résultat vide ou status = 'blocked'
        API-->>Client: 401 Unauthorized / 403 Forbidden
    else Utilisateur valide
        DB-->>API: Données utilisateur (id, role, password_hash)
        API->>API: Comparaison bcrypt.compare(password, hash)
        
        alt Mot de passe incorrect
            API-->>Client: 401 Unauthorized
        else Mot de passe correct
            API->>API: Génération JWT (id, role) avec secret
            API-->>Client: 200 OK + {token, user: {id, name, role}}
        end
    end

    Note over Client, API: Lors des requêtes ultérieures sécurisées
    Client->>API: GET /api/courses/my-courses (Header: Authorization Bearer <token>)
    API->>API: Middleware verifyToken() : Décodage JWT
    API->>DB: SELECT courses JOIN enrollments WHERE student_id = token.id
    DB-->>API: Liste des cours inscrits
    API-->>Client: 200 OK + Données JSON
```

---

## 5. Diagramme d'Activité : Déroulement d'un Quiz & Enregistrement du Score

Logique fonctionnelle d'un étudiant répondant à un quiz et du calcul / stockage de son évaluation dans le système.

```mermaid
stateDiagram-v2
    [*] --> SelectionQuiz : L'étudiant ouvre un Quiz
    SelectionQuiz --> ChargementQuestions : GET /api/quizzes/:id
    ChargementQuestions --> ReponseQuestions : Affichage des questions & options
    
    state ReponseQuestions {
        [*] --> QuestionEnCours
        QuestionEnCours --> SelectionOption : L'étudiant coche une réponse
        SelectionOption --> QuestionSuivante : Suivant
        QuestionSuivante --> QuestionEnCours
    }

    ReponseQuestions --> Soumission : Clic sur "Valider le Quiz"
    Soumission --> TraitementBackend : POST /api/quizzes/:id/submit {answers}
    
    state TraitementBackend {
        [*] --> VerificationReponses : Comparaison avec options (is_correct=1)
        VerificationReponses --> CalculScore : Score / Total
        CalculScore --> EnregistrementDB : INSERT INTO submissions
    }
    
    TraitementBackend --> AffichageResultats : Retour JSON (score, total, correction)
    AffichageResultats --> [*] : Fin du Quiz
```

---

## 6. Diagramme de Composants (Component Diagram)

Ce diagramme illustre l'organisation modulaire du système en composants logiciels, mettant en évidence les interfaces requises et fournies entre le Frontend (React), le Backend (Express) et la Base de Données.

```mermaid
flowchart TB
    subgraph Frontend ["Subsystem : Frontend (React / Vite)"]
        direction TB
        subgraph Pages ["Composants Pages (Views)"]
            P_Auth["Login / Register / Profile"]
            P_Dash["Dashboards (Student, Teacher, Admin)"]
            P_Course["CourseManager / CourseView"]
            P_Quiz["QuizPage / Results"]
        end
        
        subgraph UI_Components ["Composants Réutilisables"]
            C_Layout["Layout & Navbar"]
            C_Card["CourseCard"]
            C_Auth["ProtectedRoute"]
            C_Viewer["FileViewer"]
        end

        API_Service["Service Axios (api.js) <br/> Interface REST Client"]
        
        Pages --> UI_Components
        Pages --> API_Service
        UI_Components --> API_Service
    end

    subgraph Backend ["Subsystem : Backend (Node.js / Express)"]
        direction TB
        App_Entry["app.js <br/> (Serveur Express & Configuration)"]
        
        subgraph Middlewares ["Middlewares de Sécurité"]
            MW_JWT["auth.js (Vérification Token JWT)"]
            MW_Role["roleChecker.js (Contrôle RBAC)"]
        end

        subgraph Routes ["Modules de Routes API (/api/...)"]
            R_Auth["auth.js (Authentification)"]
            R_Course["courses.js & chapters.js"]
            R_Res["resources.js & uploads"]
            R_Quiz["quizzes.js & progress.js"]
            R_Enroll["enrollments.js"]
            R_Admin["admin.js & announcements.js"]
        end

        DB_Pool["db.js <br/> (Pool de Connexion MySQL2)"]

        App_Entry --> Middlewares
        App_Entry --> Routes
        Middlewares --> Routes
        Routes --> DB_Pool
    end

    subgraph Database ["Subsystem : Database (MySQL)"]
        DB_Storage[("Base de Données MySQL <br/> (lms_db)")]
    end

    %% Connexions et Interfaces
    API_Service <-->|API REST / HTTPS JSON| App_Entry
    DB_Pool <-->|Connexion TCP / Pool SQL| DB_Storage

    style Frontend fill:#f8faff,stroke:#2b6cb0,stroke-width:2px
    style Pages fill:#edf2f7,stroke:#cbd5e0
    style UI_Components fill:#edf2f7,stroke:#cbd5e0
    style Backend fill:#f7fafc,stroke:#2f855a,stroke-width:2px
    style Routes fill:#e6fffa,stroke:#b2f5ea
    style Database fill:#fffaf0,stroke:#dd6b20,stroke-width:2px
```

---

## 7. Diagramme de Déploiement (Deployment Diagram)

Ce diagramme décrit l'infrastructure physique et virtuelle sur laquelle l'application LMS est déployée. Il montre la répartition des conteneurs, des runtimes et les protocoles de communication réseau entre les différents nœuds.

```mermaid
flowchart TB
    subgraph ClientNode ["Nœud Client : Appareil Utilisateur"]
        Browser["Navigateur Web <br/> (Chrome, Safari, Firefox, Mobile)"]
        subgraph SPA ["Conteneur d'Exécution Client"]
            ReactBundle["Application React / Vite SPA <br/> (HTML5, CSS3, JS Bundle)"]
        end
        Browser --> ReactBundle
    end

    subgraph HostingNode ["Nœud de Distribution Frontend : Serveur Web / CDN"]
        WebSec["Serveur Nginx / CDN <br/> Hébergement Fichiers Statiques"]
    end

    subgraph AppServerNode ["Nœud Serveur d'Application : VPS / Docker Container"]
        subgraph RuntimeNode ["Environnement d'Exécution Node.js"]
            NodeService["Processus Node.js / PM2 <br/> (Port 5000)"]
            AppExpress["Application Express.js <br/> (Backend API)"]
        end
        FSNode["Système de Fichiers Local <br/> (/uploads : PDFs, Images, Médias)"]
        NodeService --> AppExpress
        AppExpress --> FSNode
    end

    subgraph DBServerNode ["Nœud Serveur Base de Données : SGBD Dédié / Cloud RDS"]
        MySQLEngine["Moteur SGBD MySQL v8.0 <br/> (Port 3306)"]
        StorageVol[("Volume de Stockage Persistant <br/> (Schéma lms_db & Index)")]
        MySQLEngine --> StorageVol
    end

    %% Communications Réseau
    Browser <-->|Téléchargement SPA <br/> HTTPS / Port 443| HostingNode
    Browser <-->|Requêtes API REST (Axios) <br/> HTTPS / Port 443 (ou 5000)| AppServerNode
    AppExpress <-->|Requêtes SQL / Préparées <br/> Protocole TCP MySQL / Port 3306| MySQLEngine

    style ClientNode fill:#eeb,stroke:#996,stroke-width:2px
    style HostingNode fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style AppServerNode fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style DBServerNode fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
```

