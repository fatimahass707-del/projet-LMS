const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// POST : Créer un chapitre dans un cours
router.post('/:courseId/chapters', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, order_num } = req.body;
    const courseId = req.params.courseId;
    const teacherId = req.user.id;

    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    const sql = 'INSERT INTO chapters (course_id, title, order_num) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [courseId, title, order_num || 1]);

    res.status(201).json({ message: 'Chapitre créé avec succès', chapterId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Lister tous les chapitres d'un cours
router.get('/:courseId/chapters', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const sql = 'SELECT * FROM chapters WHERE course_id = ? ORDER BY order_num ASC';
    const [chapters] = await db.query(sql, [courseId]);
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir un chapitre par ID
router.get('/chapters/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM chapters WHERE id = ?';
    const [chapters] = await db.query(sql, [req.params.id]);

    if (chapters.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    res.json(chapters[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier un chapitre
router.put('/chapters/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, order_num } = req.body;
    const chapterId = req.params.id;
    const teacherId = req.user.id;

    const [chapter] = await db.query(
      'SELECT c.id, c.course_id, co.teacher_id FROM chapters c JOIN courses co ON c.course_id = co.id WHERE c.id = ?',
      [chapterId]
    );

    if (chapter.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    if (chapter[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce chapitre" });
    }

    const sql = 'UPDATE chapters SET title = ?, order_num = ? WHERE id = ?';
    await db.query(sql, [title, order_num, chapterId]);

    res.json({ message: 'Chapitre modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer un chapitre
router.delete('/chapters/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const chapterId = req.params.id;
    const teacherId = req.user.id;

    const [chapter] = await db.query(
      'SELECT c.id, c.course_id, co.teacher_id FROM chapters c JOIN courses co ON c.course_id = co.id WHERE c.id = ?',
      [chapterId]
    );

    if (chapter.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    if (chapter[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce chapitre" });
    }

    await db.query('DELETE FROM chapters WHERE id = ?', [chapterId]);
    res.json({ message: 'Chapitre supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;