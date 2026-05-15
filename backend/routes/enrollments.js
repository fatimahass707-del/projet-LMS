const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// S'inscrire à un cours (student)
router.post('/', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: 'course_id est requis.' });
    }

    // Vérifier que le cours existe
    const [courses] = await db.query(
      'SELECT id FROM courses WHERE id = ?',
      [course_id]
    );
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }

    // Vérifier si déjà inscrit
    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, course_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Vous êtes déjà inscrit à ce cours.' });
    }

    // Inscrire l'étudiant
    const [result] = await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, course_id]
    );

    res.status(201).json({
      message: 'Inscription réussie.',
      enrollment: { id: result.insertId, course_id, student_id: req.user.id }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Mes cours inscrits (student)
router.get('/mine', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const [enrollments] = await db.query(`
      SELECT 
        c.id, c.title, c.description, 
        u.name AS teacher_name,
        e.enrolled_at,
        (SELECT COUNT(*) FROM resources r JOIN chapters ch ON r.chapter_id = ch.id WHERE ch.course_id = c.id) as total_resources,
        (SELECT COUNT(*) FROM progress p WHERE p.student_id = ? AND p.course_id = c.id) as viewed_resources
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id, req.user.id]);

    const enriched = enrollments.map(e => ({
      ...e,
      progress: e.total_resources > 0 ? Math.round((e.viewed_resources / e.total_resources) * 100) : 0
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Se désinscrire d'un cours (student)
router.delete('/:courseId', verifyToken, requireRole(['student']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const [enrollment] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    if (enrollment.length === 0) {
      return res.status(404).json({ message: 'Inscription non trouvée.' });
    }

    await db.query(
      'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );

    res.json({ message: 'Désinscription réussie.' });
  } catch (error) {
    console.error('Erreur désinscription:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;