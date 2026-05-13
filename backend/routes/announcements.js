const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// POST : Créer une annonce (enseignant)
router.post('/', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { course_id, title, content } = req.body;
    const teacher_id = req.user.id;

    // Vérifier que l'enseignant est l'auteur du cours
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [course_id]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacher_id) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    const sql = 'INSERT INTO announcements (course_id, teacher_id, title, content) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [course_id, teacher_id, title, content]);

    res.status(201).json({ message: 'Annonce créée avec succès', announcementId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Liste des annonces d'un cours
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const sql = `
      SELECT a.*, u.name as teacher_name
      FROM announcements a
      INNER JOIN users u ON a.teacher_id = u.id
      WHERE a.course_id = ?
      ORDER BY a.created_at DESC
    `;
    const [announcements] = await db.query(sql, [courseId]);
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir une annonce
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT a.*, u.name as teacher_name
      FROM announcements a
      INNER JOIN users u ON a.teacher_id = u.id
      WHERE a.id = ?
    `;
    const [announcements] = await db.query(sql, [req.params.id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    res.json(announcements[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier une annonce
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcementId = req.params.id;
    const teacherId = req.user.id;

    const [announcement] = await db.query(
      'SELECT teacher_id FROM announcements WHERE id = ?',
      [announcementId]
    );

    if (announcement.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    if (announcement[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de cette annonce" });
    }

    const sql = 'UPDATE announcements SET title = ?, content = ? WHERE id = ?';
    await db.query(sql, [title, content, announcementId]);

    res.json({ message: 'Annonce modifiée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer une annonce
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const announcementId = req.params.id;
    const teacherId = req.user.id;

    const [announcement] = await db.query(
      'SELECT teacher_id FROM announcements WHERE id = ?',
      [announcementId]
    );

    if (announcement.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    if (announcement[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de cette annonce" });
    }

    await db.query('DELETE FROM announcements WHERE id = ?', [announcementId]);
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;