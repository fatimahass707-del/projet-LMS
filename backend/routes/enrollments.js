const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// POST : Enroll student in course
router.post('/', verifyToken, async (req, res) => {
  try {
    const { course_id } = req.body;
    const student_id = req.user.id;

    const [existing] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Déjà inscrit dans ce cours' });
    }

    const sql = `
      INSERT INTO enrollments (student_id, course_id)
      VALUES (?, ?)
    `;

    const [result] = await db.query(sql, [student_id, course_id]);

    res.status(201).json({
      message: 'Inscription réussie',
      enrollmentId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : My enrollments
router.get('/mine', verifyToken, async (req, res) => {
  try {

    const sql = `
      SELECT courses.*
      FROM enrollments
      JOIN courses ON enrollments.course_id = courses.id
      WHERE enrollments.student_id = ?
    `;

    const [courses] = await db.query(sql, [req.user.id]);

    res.json(courses);

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Cancel enrollment
router.delete('/:courseId', verifyToken, async (req, res) => {
  try {

    const courseId = req.params.courseId;

    await db.query(
      'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );

    res.json({ message: 'Inscription supprimée' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;