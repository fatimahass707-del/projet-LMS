const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// Schémas de validation
const courseSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('', null)
});

// POST : Créer un cours
router.post('/', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { title, description } = value;
    const teacherId = req.user.id;
    const sql = 'INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [title, description, teacherId]);
    res.status(201).json({ message: 'Cours créé avec succès', courseId: result.insertId });
  } catch (error) {
    console.error('Erreur Create Course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Lister tous les cours
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT courses.*, users.name AS teacher_name 
      FROM courses 
      JOIN users ON courses.teacher_id = users.id
      ORDER BY courses.created_at DESC
    `;
    const [courses] = await db.query(sql);
    res.json(courses);
  } catch (error) {
    console.error('Erreur List Courses:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Mes cours (enseignant) — DOIT être avant /:id
router.get('/mine', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT courses.*, COUNT(enrollments.id) AS students_count
       FROM courses
       LEFT JOIN enrollments ON courses.id = enrollments.course_id
       WHERE courses.teacher_id = ?
       GROUP BY courses.id
       ORDER BY courses.created_at DESC`,
      [req.user.id]
    );
    res.json(courses);
  } catch (error) {
    console.error('Erreur My Courses:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Rechercher des cours
router.get('/search/query', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = `%${query}%`;
    const sql = `
      SELECT courses.id, courses.title, courses.description, courses.created_at, users.name AS teacher_name, users.id AS teacher_id
      FROM courses 
      JOIN users ON courses.teacher_id = users.id
      WHERE courses.title LIKE ? OR courses.description LIKE ? OR users.name LIKE ?
      ORDER BY courses.created_at DESC
      LIMIT 20
    `;
    const [courses] = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
    res.json(courses);
  } catch (error) {
    console.error('Erreur Search Courses:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir un cours par ID
router.get('/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM courses WHERE id = ?';
    const [courses] = await db.query(sql, [req.params.id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    res.json(courses[0]);
  } catch (error) {
    console.error('Erreur Get Course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier un cours
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { title, description } = value;
    const courseId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    // Autoriser si l'utilisateur est le créateur OU un admin
    if (course[0].teacher_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    const updateSql = 'UPDATE courses SET title = ?, description = ? WHERE id = ?';
    await db.query(updateSql, [title, description, courseId]);
    res.json({ message: 'Cours modifié avec succès' });
  } catch (error) {
    console.error('Erreur Update Course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer un cours
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }

    // Autoriser si l'utilisateur est le créateur OU un admin
    if (course[0].teacher_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    await db.query('DELETE FROM courses WHERE id = ?', [courseId]);
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    console.error('Erreur Delete Course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Liste des étudiants d'un cours avec leur progression et statut des examens (enseignant)
router.get('/:id/students', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier propriétaire
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) return res.status(404).json({ message: 'Cours non trouvé' });
    if (course[0].teacher_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Tous les quiz de ce cours
    const [courseQuizzes] = await db.query('SELECT id, title FROM quizzes WHERE course_id = ?', [courseId]);

    // Récupérer les étudiants, leur progression et leur score moyen aux quiz
    const [students] = await db.query(`
      SELECT 
        u.id, u.name, u.email,
        (SELECT COUNT(*) FROM progress p WHERE p.student_id = u.id AND p.course_id = ?) as viewed_resources,
        (SELECT COUNT(*) FROM resources r JOIN chapters ch ON r.chapter_id = ch.id WHERE ch.course_id = ?) as total_resources,
        (SELECT AVG(IF(total > 0, (score / total) * 100, 0)) FROM submissions s JOIN quizzes q ON s.quiz_id = q.id WHERE s.student_id = u.id AND q.course_id = ?) as avg_quiz_score
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
    `, [courseId, courseId, courseId, courseId]);

    const result = [];
    for (const s of students) {
      // Récupérer les soumissions pour cet étudiant
      const [subs] = await db.query(`
        SELECT q.id as quiz_id, q.title as quiz_title, s.score, s.total, IF(s.total > 0, ROUND((s.score / s.total) * 100), 0) as percent
        FROM submissions s
        JOIN quizzes q ON s.quiz_id = q.id
        WHERE s.student_id = ? AND q.course_id = ?
      `, [s.id, courseId]);

      const examDetails = courseQuizzes.map(cq => {
        const sub = subs.find(item => item.quiz_id === cq.id);
        if (sub) {
          const passed = sub.percent >= 50; // Seuil de réussite à 50%
          return {
            id: cq.id,
            title: cq.title,
            passed: passed,
            score: sub.score,
            total: sub.total,
            percent: Number(sub.percent),
            status: passed ? 'réussi' : 'échoué'
          };
        } else {
          return {
            id: cq.id,
            title: cq.title,
            passed: false,
            score: 0,
            total: 0,
            percent: 0,
            status: 'non_passé'
          };
        }
      });

      const passedCount = examDetails.filter(e => e.status === 'réussi').length;
      const failedCount = examDetails.filter(e => e.status === 'échoué').length;
      const totalExams = courseQuizzes.length;

      result.push({
        ...s,
        progress: s.total_resources > 0 ? Math.round((s.viewed_resources / s.total_resources) * 100) : 0,
        avg_quiz_score: s.avg_quiz_score ? Math.round(s.avg_quiz_score) : null,
        examDetails,
        passedCount,
        failedCount,
        totalExams
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erreur list students:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
