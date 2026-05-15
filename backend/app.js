const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// TEMPORARY DB FIX
const dbFix = require('./db');
async function runFix() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Fix quizzes
    const [qCols] = await dbFix.query(`DESCRIBE quizzes`).catch(() => [[]]);
    if (qCols.length > 0) {
      if (!qCols.some(c => c.Field === 'course_id')) {
        await dbFix.query(`ALTER TABLE quizzes ADD COLUMN course_id INT NOT NULL AFTER id`).catch(() => {});
      }
      if (!qCols.some(c => c.Field === 'created_at')) {
        await dbFix.query(`ALTER TABLE quizzes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
      }
      if (!qCols.some(c => c.Field === 'title')) {
        await dbFix.query(`ALTER TABLE quizzes ADD COLUMN title VARCHAR(255) NOT NULL AFTER course_id`).catch(() => {});
      }
      if (qCols.some(c => c.Field === 'chapter_id')) {
        await dbFix.query(`ALTER TABLE quizzes DROP FOREIGN KEY quizzes_ibfk_1`).catch(() => {});
        await dbFix.query(`ALTER TABLE quizzes MODIFY COLUMN chapter_id INT NULL`).catch(() => {});
      }
      await dbFix.query(`ALTER TABLE quizzes ADD CONSTRAINT fk_quiz_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE`).catch(() => {});
    }
    
    // Fix submissions
    const [sCols] = await dbFix.query(`DESCRIBE submissions`).catch(() => [[]]);
    if (sCols.length > 0 && !sCols.some(c => c.Field === 'total')) {
      await dbFix.query(`ALTER TABLE submissions ADD COLUMN total INT DEFAULT 0 AFTER score`).catch(() => {});
    }
    
    // Fix announcements
    const [aCols] = await dbFix.query(`DESCRIBE announcements`).catch(() => [[]]);
    if (aCols.length > 0) {
      if (!aCols.some(c => c.Field === 'title')) {
        await dbFix.query(`ALTER TABLE announcements ADD COLUMN title VARCHAR(200) NOT NULL AFTER teacher_id`).catch(() => {});
      }
      if (!aCols.some(c => c.Field === 'course_id')) {
        await dbFix.query(`ALTER TABLE announcements ADD COLUMN course_id INT NOT NULL AFTER teacher_id`).catch(() => {});
      }
      if (!aCols.some(c => c.Field === 'created_at')) {
        await dbFix.query(`ALTER TABLE announcements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
      }
    }

    // Fix questions
    const [qsCols] = await dbFix.query(`DESCRIBE questions`).catch(() => [[]]);
    if (qsCols.length > 0 && !qsCols.some(c => c.Field === 'question_text')) {
      await dbFix.query(`ALTER TABLE questions ADD COLUMN question_text TEXT`).catch(() => {});
    }

    // Fix options
    const [optCols] = await dbFix.query(`DESCRIBE options`).catch(() => [[]]);
    if (optCols.length > 0 && !optCols.some(c => c.Field === 'option_text')) {
      await dbFix.query(`ALTER TABLE options ADD COLUMN option_text TEXT`).catch(() => {});
    }

    console.log('✅ DB FIX: Database structure verified');
  } catch (err) {
    console.error('❌ DB FIX ERROR:', err.message);
  }
}
runFix();

// Routes - Fatima
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/profile', require('./routes/profile'));

// Routes - Ikram
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/progress', require('./routes/progress'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});