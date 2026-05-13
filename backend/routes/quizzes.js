const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// Créer un quiz (teacher)
router.post('/', verifyToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { course_id, title, questions } = req.body;
    
    if (!course_id || !title || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'course_id, title et questions sont requis.' });
    }

    // Vérifier que le teacher possède le cours
    const [courses] = await db.query('SELECT id FROM courses WHERE id = ? AND teacher_id = ?', 
      [course_id, req.user.id]);
    if (courses.length === 0) {
      return res.status(403).json({ message: 'Cours non trouvé ou accès interdit.' });
    }

    // Transaction pour créer quiz + questions + options
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [quizResult] = await connection.query(
        'INSERT INTO quizzes (course_id, title) VALUES (?, ?)',
        [course_id, title]
      );
      const quizId = quizResult.insertId;

      for (const q of questions) {
        if (!q.question_text || !Array.isArray(q.options)) continue;
        
        const [qResult] = await connection.query(
          'INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)',
          [quizId, q.question_text]
        );
        const questionId = qResult.insertId;

        for (const opt of q.options) {
          await connection.query(
            'INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)',
            [questionId, opt.text, opt.is_correct || false]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'Quiz créé avec succès.', quiz_id: quizId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erreur création quiz:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer un quiz (étudiant inscrit ou teacher)
router.get('/:quizId', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;

    // Récupérer le quiz avec son cours
    const [quizzes] = await db.query(`
      SELECT q.*, c.teacher_id FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `, [quizId]);

    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé.' });
    }
    const quiz = quizzes[0];

    // Vérifier les permissions
    const isTeacher = quiz.teacher_id === req.user.id || req.user.role === 'admin';
    const isStudent = req.user.role === 'student';

    if (isStudent) {
      // Vérifier l'inscription au cours
      const [enrolled] = await db.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [req.user.id, quiz.course_id]
      );
      if (enrolled.length === 0 && !isTeacher) {
        return res.status(403).json({ message: 'Vous devez être inscrit au cours.' });
      }
    }

    // Récupérer questions et options (sans révéler is_correct aux étudiants)
    const [questions] = await db.query(`
      SELECT 
        q.id as question_id, q.question_text,
        o.id as option_id, o.option_text${isStudent ? '' : ', o.is_correct'}
      FROM questions q
      LEFT JOIN options o ON q.id = o.question_id
      WHERE q.quiz_id = ?
      ORDER BY q.id, o.id
    `, [quizId]);

    // Structurer les données
    const structuredQuestions = [];
    for (const q of questions) {
      const existing = structuredQuestions.find(qq => qq.id === q.question_id);
      if (existing) {
        existing.options.push({
          id: q.option_id,
          text: q.option_text,
          ...(isTeacher && { is_correct: q.is_correct })
        });
      } else {
        structuredQuestions.push({
          id: q.question_id,
          question_text: q.question_text,
          options: [{
            id: q.option_id,
            text: q.option_text,
            ...(isTeacher && { is_correct: q.is_correct })
          }]
        });
      }
    }

    res.json({
      id: quiz.id,
      title: quiz.title,
      course_id: quiz.course_id,
      questions: structuredQuestions
    });
  } catch (error) {
    console.error('Erreur récupération quiz:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Soumettre un quiz (student)
router.post('/:quizId/submit', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Seuls les étudiants peuvent soumettre un quiz.' });
    }

    const { quizId } = req.params;
    const { answers } = req.body; // { question_id: option_id }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Les réponses sont requises.' });
    }

    // Vérifier l'inscription et récupérer les bonnes réponses
    const [quizData] = await db.query(`
      SELECT q.course_id, c.teacher_id FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      WHERE q.id = ?
    `, [quizId]);

    if (quizData.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé.' });
    }

    const [enrolled] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, quizData[0].course_id]
    );
    if (enrolled.length === 0) {
      return res.status(403).json({ message: 'Inscription requise.' });
    }

    // Récupérer les bonnes réponses
    const [correctAnswers] = await db.query(`
      SELECT q.id as question_id, o.id as correct_option_id
      FROM questions q
      JOIN options o ON q.id = o.question_id
      WHERE q.quiz_id = ? AND o.is_correct = TRUE
    `, [quizId]);

    const correctMap = {};
    for (const ca of correctAnswers) {
      correctMap[ca.question_id] = ca.correct_option_id;
    }

    // Calculer le score
    let score = 0;
    const total = Object.keys(correctMap).length;
    for (const [qId, userAnswer] of Object.entries(answers)) {
      if (correctMap[qId] && correctMap[qId] === userAnswer) {
        score++;
      }
    }

    // Enregistrer la submission
    await db.query(
      'INSERT INTO submissions (student_id, quiz_id, score, total) VALUES (?, ?, ?, ?)',
      [req.user.id, quizId, score, total]
    );

    res.json({
      message: 'Quiz soumis avec succès.',
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0
    });
  } catch (error) {
    console.error('Erreur soumission quiz:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les résultats d'un quiz (teacher ou student pour ses propres résultats)
router.get('/:quizId/results', verifyToken, async (req, res) => {
  try {
    const { quizId } = req.params;

    // Vérifier les permissions
    const [quizInfo] = await db.query('SELECT course_id, teacher_id FROM quizzes JOIN courses ON quizzes.course_id = courses.id WHERE quizzes.id = ?', [quizId]);
    if (quizInfo.length === 0) {
      return res.status(404).json({ message: 'Quiz non trouvé.' });
    }

    const isTeacher = quizInfo[0].teacher_id === req.user.id || req.user.role === 'admin';
    
    if (req.user.role === 'student' && !isTeacher) {
      // Student: voir seulement ses propres résultats
      const [myResults] = await db.query(`
        SELECT score, total, submitted_at,
          ROUND((score / total) * 100) as percentage
        FROM submissions
        WHERE quiz_id = ? AND student_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `, [quizId, req.user.id]);
      
      return res.json(myResults[0] || { message: 'Aucune soumission trouvée.' });
    }

    if (isTeacher) {
      // Teacher: voir les statistiques du quiz
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_submissions,
          AVG(score) as avg_score,
          MAX(score) as best_score,
          MIN(score) as lowest_score
        FROM submissions
        WHERE quiz_id = ?
      `, [quizId]);

      const [submissions] = await db.query(`
        SELECT 
          s.*, u.name as student_name, u.email,
          ROUND((s.score / s.total) * 100) as percentage
        FROM submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.quiz_id = ?
        ORDER BY s.submitted_at DESC
      `, [quizId]);

      res.json({ stats: stats[0], submissions });
    } else {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
  } catch (error) {
    console.error('Erreur résultats quiz:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;