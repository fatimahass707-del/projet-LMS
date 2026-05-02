const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés (accès protégé via route)
app.use('/uploads', express.static('uploads'));

// Routes - Fatima
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/chapters', require('./routes/chapters'));

// Routes - Ikram
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/progress', require('./routes/progress'));

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: 'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});