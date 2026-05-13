const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// Créer une annonce (teacher)
router.post('/', verifyToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { course_id, title, content } = req.body;
    
    if (!course_id || !title || !content) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Vérifier que le teacher possède le cours
    const [courses] = await db.query(
      'SELECT id FROM courses WHERE id = ? AND teacher_id = ?',
      [course_id, req.user.id]
    );
    if (courses.length === 0) {
      return res.status(403).json({ message: 'Cours non trouvé ou accès interdit.' });
    }

    const [result] = await db.query(
      'INSERT INTO announcements (course_id, teacher_id, title, content) VALUES (?, ?, ?, ?)',
      [course_id, req.user.id, title, content]
    );

    res.status(201).json({
      message: 'Annonce publiée avec succès.',
      announcement: {
        id: result.insertId,
        course_id,
        title,
        content,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur création annonce:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les annonces d'un cours (étudiant inscrit ou teacher)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { course_id } = req.query;
    
    if (!course_id) {
      return res.status(400).json({ message: 'course_id est requis.' });
    }

    // Vérifier l'accès au cours
    const [access] = await db.query(`
      SELECT 1 FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
      WHERE c.id = ? AND (c.teacher_id = ? OR e.id IS NOT NULL OR ? = 'admin')
    `, [req.user.id, course_id, req.user.id, req.user.role]);

    if (access.length === 0) {
      return res.status(403).json({ message: 'Accès refusé à ce cours.' });
    }

    const [announcements] = await db.query(`
      SELECT a.*, u.name as teacher_name
      FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      WHERE a.course_id = ?
      ORDER BY a.created_at DESC
    `, [course_id]);

    res.json(announcements);
  } catch (error) {
    console.error('Erreur récupération annonces:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Supprimer une annonce (teacher, propriétaire uniquement)
router.delete('/:id', verifyToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;

    const [announcements] = await db.query(
      'SELECT id, teacher_id FROM announcements WHERE id = ?',
      [id]
    );

    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    if (announcements[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos annonces.' });
    }

    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Annonce supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression annonce:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;