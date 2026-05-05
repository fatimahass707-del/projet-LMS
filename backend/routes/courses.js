const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// POST : Créer un cours
router.post('/', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, description } = req.body;
    const teacherId = req.user.id;
    const sql = 'INSERT INTO courses (title, description, teacher_id) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [title, description, teacherId]);
    res.status(201).json({ message: 'Cours créé avec succès', courseId: result.insertId });
  } catch (error) {
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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier un cours
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, description } = req.body;
    const courseId = req.params.id;
    const teacherId = req.user.id;

    const checkSql = 'SELECT teacher_id FROM courses WHERE id = ?';
    const [course] = await db.query(checkSql, [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    const updateSql = 'UPDATE courses SET title = ?, description = ? WHERE id = ?';
    await db.query(updateSql, [title, description, courseId]);
    res.json({ message: 'Cours modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer un cours
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;

    const checkSql = 'SELECT teacher_id FROM courses WHERE id = ?';
    const [course] = await db.query(checkSql, [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce cours" });
    }

    await db.query('DELETE FROM courses WHERE id = ?', [courseId]);
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;