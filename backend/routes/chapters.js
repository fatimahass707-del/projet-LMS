const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// POST : Créer un chapitre
router.post('/', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { course_id, title } = req.body;
    const teacherId = req.user.id;

    // Vérifier que le cours existe et appartient au prof (ou admin)
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [course_id]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const sql = 'INSERT INTO chapters (course_id, title) VALUES (?, ?)';
    const [result] = await db.query(sql, [course_id, title]);

    res.status(201).json({ message: 'Chapitre créé avec succès', chapterId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Lister tous les chapitres d'un cours
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const sql = 'SELECT * FROM chapters WHERE course_id = ? ORDER BY id ASC';
    const [chapters] = await db.query(sql, [courseId]);
    res.json(chapters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier un chapitre
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title } = req.body;
    const chapterId = req.params.id;
    const teacherId = req.user.id;

    const [chapter] = await db.query(
      'SELECT c.id, co.teacher_id FROM chapters c JOIN courses co ON c.course_id = co.id WHERE c.id = ?',
      [chapterId]
    );

    if (chapter.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    if (chapter[0].teacher_id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await db.query('UPDATE chapters SET title = ? WHERE id = ?', [title, chapterId]);
    res.json({ message: 'Chapitre modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer un chapitre
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const chapterId = req.params.id;
    const teacherId = req.user.id;

    const [chapter] = await db.query(
      'SELECT c.id, co.teacher_id FROM chapters c JOIN courses co ON c.course_id = co.id WHERE c.id = ?',
      [chapterId]
    );

    if (chapter.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    if (chapter[0].teacher_id !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await db.query('DELETE FROM chapters WHERE id = ?', [chapterId]);
    res.json({ message: 'Chapitre supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;