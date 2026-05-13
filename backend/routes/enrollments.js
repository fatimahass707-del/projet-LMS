const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// S'inscrire à un cours (student)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Seuls les étudiants peuvent s\'inscrire.' });
    }

    const { course_id } = req.body;
    if (!course_id) {
      return res.status(400).json({ message: 'course_id est requis.' });
    }

    // Vérifier que le cours existe
    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }

    // Éviter l'auto-inscription d'un teacher à son propre cours (optionnel)
    if (courses[0].teacher_id === req.user.id) {
      return res.status(400).json({ message: 'Vous êtes déjà l\'enseignant de ce cours.' });
    }

    // Inscrire l'étudiant
    await db.query(
      'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, course_id]
    );

    res.status(201).json({ message: 'Inscription réussie.', course_id });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer mes inscriptions (student)
router.get('/mine', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Accès réservé aux étudiants.' });
    }

    const [enrollments] = await db.query(`
      SELECT 
        e.enrolled_at,
        c.id, c.title, c.description,
        u.name as teacher_name,
        (SELECT COUNT(*) FROM chapters WHERE course_id = c.id) as total_chapters
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);

    res.json(enrollments);
  } catch (error) {
    console.error('Erreur récupération inscriptions:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les étudiants inscrits à un cours (teacher)
router.get('/course/:courseId/students', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Vérifier que le requester est le teacher du cours
    const [courses] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }
    if (courses[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    const [students] = await db.query(`
      SELECT 
        u.id, u.name, u.email, e.enrolled_at,
        (SELECT COUNT(*) FROM progress p 
         JOIN resources r ON p.resource_id = r.id 
         JOIN chapters ch ON r.chapter_id = ch.id 
         WHERE p.student_id = u.id AND ch.course_id = ?) as resources_viewed
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
      ORDER BY u.name
    `, [courseId, courseId]);

    res.json(students);
  } catch (error) {
    console.error('Erreur récupération étudiants:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;