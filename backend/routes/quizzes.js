const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// ========== QUIZZES ==========

// POST : Créer un quiz (enseignant)
router.post('/', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { course_id, title } = req.body;
    const teacherId = req.user.id;

    // Vérifier que l'enseignant est l'auteur du cours
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [course_id]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    const sql = 'INSERT INTO quizzes (course_id, title) VALUES (?, ?)';
    const [result] = await db.query(sql, [course_id, title]);

    res.status(201).json({ message: 'Quiz créé avec succès', quizId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Liste des quiz d'un cours
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const sql = 'SELECT * FROM quizzes WHERE course_id = ? ORDER BY created_at DESC';
    const [quizzes] = await db.query(sql, [courseId]);
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir un quiz avec questions et options
router.get('/:id', async (req, res) => {
  try {
    const quizId = req.params.id;
    
    const [quizzes] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    const [questions] = await db.query(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    const quizWithQuestions = { ...quizzes[0], questions: [] };

    for (const question of questions) {
      const [options] = await db.query(
        'SELECT id, option_text FROM options WHERE question_id = ?',
        [question.id]
      );
      quizWithQuestions.questions.push({
        ...question,
        options
      });
    }

    res.json(quizWithQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier un quiz
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title } = req.body;
    const quizId = req.params.id;
    const teacherId = req.user.id;

    const [quiz] = await db.query(
      'SELECT c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?',
      [quizId]
    );

    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    if (quiz[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await db.query('UPDATE quizzes SET title = ? WHERE id = ?', [title, quizId]);
    res.json({ message: 'Quiz modifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer un quiz
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    const [quiz] = await db.query(
      'SELECT c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?',
      [quizId]
    );

    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    if (quiz[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await db.query('DELETE FROM quizzes WHERE id = ?', [quizId]);
    res.json({ message: 'Quiz supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========== QUESTIONS ==========

// POST : Ajouter une question à un quiz
router.post('/:quizId/questions', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { question_text } = req.body;
    const quizId = req.params.quizId;
    const teacherId = req.user.id;

    const [quiz] = await db.query(
      'SELECT c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?',
      [quizId]
    );

    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    if (quiz[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const sql = 'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)';
    const [result] = await db.query(sql, [quizId, question_text]);

    res.status(201).json({ message: 'Question ajoutée', questionId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST : Ajouter des options à une question
router.post('/questions/:questionId/options', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { option_text, is_correct } = req.body;
    const questionId = req.params.questionId;
    const teacherId = req.user.id;

    const [question] = await db.query(
      'SELECT c.teacher_id FROM questions q JOIN quizzes quiz ON q.quiz_id = quiz.id JOIN courses c ON quiz.course_id = c.id WHERE q.id = ?',
      [questionId]
    );

    if (question.length === 0) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }
    if (question[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const sql = 'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [questionId, option_text, is_correct || false]);

    res.status(201).json({ message: 'Option ajoutée', optionId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========== SOUMISSIONS ==========

// POST : Soumettre un quiz (étudiant)
router.post('/:quizId/submit', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const studentId = req.user.id;
    const { answers } = req.body; // { questionId: optionId }

    // Récupérer le quiz et vérifier si l'étudiant est inscrit au cours
    const [quiz] = await db.query('SELECT course_id FROM quizzes WHERE id = ?', [quizId]);
    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    const [enrollment] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, quiz[0].course_id]
    );
    if (enrollment.length === 0) {
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à ce cours" });
    }

    // Calculer le score
    let score = 0;
    let total = 0;

    for (const [questionId, optionId] of Object.entries(answers)) {
      const [options] = await db.query(
        'SELECT is_correct FROM options WHERE id = ? AND question_id = ?',
        [optionId, questionId]
      );
      total++;
      if (options.length > 0 && options[0].is_correct) {
        score++;
      }
    }

    // Enregistrer la soumission
    const sql = 'INSERT INTO submissions (student_id, quiz_id, score, total) VALUES (?, ?, ?, ?)';
    await db.query(sql, [studentId, quizId, score, total]);

    res.json({ 
      message: 'Quiz soumis avec succès', 
      score, 
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir les résultats d'un quiz (enseignant)
router.get('/:quizId/results', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const teacherId = req.user.id;

    const [quiz] = await db.query(
      'SELECT c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?',
      [quizId]
    );

    if (quiz.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }
    if (quiz[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const sql = `
      SELECT s.*, u.name as student_name, u.email
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      WHERE s.quiz_id = ?
      ORDER BY s.submitted_at DESC
    `;
    const [submissions] = await db.query(sql, [quizId]);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Mes résultats de quiz (étudiant)
router.get('/my-results', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    const sql = `
      SELECT s.*, q.title as quiz_title, c.title as course_title
      FROM submissions s
      INNER JOIN quizzes q ON s.quiz_id = q.id
      INNER JOIN courses c ON q.course_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `;
    const [results] = await db.query(sql, [studentId]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;