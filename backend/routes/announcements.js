const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// POST : Créer une annonce
router.post('/', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { course_id, title, content } = req.body;
    if (!course_id || !title || !content) return res.status(400).json({ message: 'Données manquantes.' });

    const [courses] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) return res.status(404).json({ message: 'Cours non trouvé.' });
    if (courses[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    const [result] = await db.query(
      'INSERT INTO announcements (course_id, teacher_id, title, content) VALUES (?, ?, ?, ?)',
      [course_id, req.user.id, title, content]
    );
    res.status(201).json({ message: 'Annonce publiée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET : Annonces d'un cours
router.get('/', verifyToken, async (req, res) => {
  try {
    const { course_id } = req.query;
    const [announcements] = await db.query(`
      SELECT a.*, u.name as teacher_name FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      WHERE a.course_id = ? ORDER BY a.created_at DESC
    `, [course_id]);
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT : Modifier une annonce
router.put('/:id', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const [announcements] = await db.query('SELECT teacher_id FROM announcements WHERE id = ?', [id]);
    if (announcements.length === 0) return res.status(404).json({ message: 'Annonce non trouvée.' });
    if (announcements[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    await db.query('UPDATE announcements SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.json({ message: 'Annonce mise à jour.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE : Supprimer une annonce
router.delete('/:id', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const [announcements] = await db.query('SELECT teacher_id FROM announcements WHERE id = ?', [id]);
    if (announcements.length === 0) return res.status(404).json({ message: 'Annonce non trouvée.' });
    if (announcements[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;