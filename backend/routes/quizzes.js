const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// --- ROUTES STATIQUES / PREFIXÉES --- (Doivent être avant les routes avec :id)

// GET : Mes soumissions (student)
router.get('/my/submissions', verifyToken, async (req, res) => {
  try {
    const [subs] = await db.query(`
      SELECT s.*, q.title as quiz_title, c.title as course_title, 
      IF(s.total > 0, ROUND((s.score / s.total) * 100), 0) as percentage
      FROM submissions s
      JOIN quizzes q ON s.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE s.student_id = ? ORDER BY s.submitted_at DESC
    `, [req.user.id]);
    res.json(subs);
  } catch (error) {
    console.error('Erreur My Submissions:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET : Lister les quiz d'un cours
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const [quizzes] = await db.query(`
      SELECT q.*, 
      (SELECT COUNT(*) FROM submissions s WHERE s.quiz_id = q.id AND s.student_id = ?) as has_submitted
      FROM quizzes q WHERE q.course_id = ? ORDER BY q.created_at DESC
    `, [req.user.id, courseId]);
    res.json(quizzes);
  } catch (error) {
    console.error('Erreur Get Quizzes By Course:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- ROUTES AVEC :ID ---

// GET : Résultats d'un quiz spécifique pour l'étudiant
router.get('/:quizId/results', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const [submissions] = await db.query(`
      SELECT s.*, q.title as quiz_title
      FROM submissions s
      JOIN quizzes q ON s.quiz_id = q.id
      WHERE s.quiz_id = ? AND s.student_id = ?
      ORDER BY s.submitted_at DESC LIMIT 1
    `, [quizId, req.user.id]);
    
    if (submissions.length === 0) return res.status(404).json({ message: 'Résultats non trouvés.' });
    res.json(submissions[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET : Détails quiz
router.get('/:quizId', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const [quizzes] = await db.query(`
      SELECT q.*, c.teacher_id FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `, [quizId]);

    if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz non trouvé.' });
    const quiz = quizzes[0];
    const isTeacher = quiz.teacher_id === req.user.id || req.user.role === 'admin';

    // Check if student already submitted
    let alreadySubmitted = false;
    let previousScore = null;
    if (req.user.role === 'student') {
      const [submissions] = await db.query('SELECT score, total FROM submissions WHERE student_id = ? AND quiz_id = ?', [req.user.id, quizId]);
      if (submissions.length > 0) {
        alreadySubmitted = true;
        previousScore = submissions[0];
      }
    }

    const [questions] = await db.query(`
      SELECT q.id as question_id, q.question_text, o.id as option_id, o.option_text, o.is_correct
      FROM questions q
      LEFT JOIN options o ON q.id = o.question_id
      WHERE q.quiz_id = ?
      ORDER BY q.id, o.id
    `, [quizId]);

    const structured = [];
    for (const row of questions) {
      let q = structured.find(x => x.id === row.question_id);
      if (!q) {
        q = { id: row.question_id, question_text: row.question_text, options: [] };
        structured.push(q);
      }
      q.options.push({
        id: row.option_id,
        text: row.option_text,
        ...(isTeacher && { is_correct: row.is_correct })
      });
    }
    res.json({ ...quiz, questions: structured, alreadySubmitted, previousScore });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST : Créer un quiz
router.post('/', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { course_id, title, questions } = req.body;
    
    if (!course_id || !title || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Données invalides.' });
    }

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) return res.status(404).json({ message: 'Cours non trouvé.' });
    if (courses[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [quizResult] = await connection.query('INSERT INTO quizzes (course_id, title) VALUES (?, ?)', [course_id, title]);
      const quizId = quizResult.insertId;

      for (const q of questions) {
        const [qResult] = await connection.query('INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)', [quizId, q.question_text]);
        const questionId = qResult.insertId;
        for (const opt of q.options) {
          await connection.query('INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)', [questionId, opt.text, opt.is_correct || false]);
        }
      }
      await connection.commit();
      res.status(201).json({ message: 'Quiz créé.', quiz_id: quizId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST : Soumettre un quiz
router.post('/:quizId/submit', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    // Prevent duplicate submission
    const [existing] = await db.query('SELECT id FROM submissions WHERE student_id = ? AND quiz_id = ?', [req.user.id, quizId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Vous avez déjà passé ce quiz.' });
    }
    const [correctAnswers] = await db.query(`
      SELECT q.id as q_id, o.id as o_id FROM questions q
      JOIN options o ON q.id = o.question_id
      WHERE q.quiz_id = ? AND o.is_correct = TRUE
    `, [quizId]);

    let score = 0;
    const total = correctAnswers.length;
    correctAnswers.forEach(ca => {
      if (answers[ca.q_id] == ca.o_id) score++;
    });

    await db.query('INSERT INTO submissions (student_id, quiz_id, score, total) VALUES (?, ?, ?, ?)', [req.user.id, quizId, score, total]);
    res.json({ score, total, percentage: total > 0 ? Math.round((score / total) * 100) : 0 });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE : Supprimer un quiz
router.delete('/:id', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const [quizzes] = await db.query(`
      SELECT q.id, c.teacher_id FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (quizzes.length === 0) return res.status(404).json({ message: 'Quiz non trouvé.' });
    if (quizzes[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    await db.query('DELETE FROM quizzes WHERE id = ?', [id]);
    res.json({ message: 'Quiz supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;