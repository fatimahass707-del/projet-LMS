const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');

// Protéger toutes les routes admin
router.use(verifyToken, requireRole(['admin']));

// GET /api/admin/stats - Statistiques globales
router.get('/stats', async (req, res) => {
  try {
    const [usersCount] = await db.query('SELECT COUNT(*) as total FROM users');
    const [coursesCount] = await db.query('SELECT COUNT(*) as total FROM courses');
    const [enrollmentsCount] = await db.query('SELECT COUNT(*) as total FROM enrollments');
    const [teachersCount] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = "teacher"');
    const [quizResults] = await db.query('SELECT AVG(IF(total > 0, (score / total) * 100, 0)) as avg_score FROM submissions');

    res.json({
      totalUsers: usersCount[0].total,
      totalCourses: coursesCount[0].total,
      totalEnrollments: enrollmentsCount[0].total,
      totalTeachers: teachersCount[0].total,
      avgQuizScore: Math.round(quizResults[0].avg_score || 0)
    });
  } catch (error) {
    console.error('Erreur stats admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/admin/users - Liste tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Erreur users admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/admin/users - Créer un utilisateur
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    console.error('Erreur creation user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/admin/users/:id - Modifier un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;
    await db.query(
      'UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?',
      [name, email, role, status, id]
    );
    res.json({ message: 'Utilisateur mis à jour.' });
  } catch (error) {
    console.error('Erreur update user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/admin/users/:id/reset-password - Réinitialiser le mot de passe
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
    res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Impossible de supprimer votre propre compte.' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error('Erreur suppression user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/admin/courses - Liste tous les cours
router.get('/courses', async (req, res) => {
  try {
    const [courses] = await db.query(`
      SELECT c.*, u.name as teacher_name 
      FROM courses c 
      JOIN users u ON c.teacher_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json(courses);
  } catch (error) {
    console.error('Erreur courses admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/admin/courses/:id - Modifier un cours (Admin)
router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, teacher_id, is_published } = req.body;
    await db.query(
      'UPDATE courses SET title = ?, description = ?, teacher_id = ?, is_published = ? WHERE id = ?',
      [title, description, teacher_id, is_published, id]
    );
    res.json({ message: 'Cours mis à jour.' });
  } catch (error) {
    console.error('Erreur update course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/admin/courses/:id - Supprimer un cours
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Cours supprimé.' });
  } catch (error) {
    console.error('Erreur suppression course:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/admin/enrollments - Toutes les inscriptions
router.get('/enrollments', async (req, res) => {
  try {
    const [enrollments] = await db.query(`
      SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      ORDER BY e.enrolled_at DESC
    `);
    res.json(enrollments);
  } catch (error) {
    console.error('Erreur enrollments admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/admin/enrollments - Inscrire un étudiant
router.post('/enrollments', async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    await db.query('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [student_id, course_id]);
    res.json({ message: 'Étudiant inscrit au cours.' });
  } catch (error) {
    console.error('Erreur inscription admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/admin/enrollments/:student_id/:course_id - Désinscrire un étudiant
router.delete('/enrollments/:student_id/:course_id', async (req, res) => {
  try {
    const { student_id, course_id } = req.params;
    await db.query('DELETE FROM enrollments WHERE student_id = ? AND course_id = ?', [student_id, course_id]);
    res.json({ message: 'Étudiant désinscrit.' });
  } catch (error) {
    console.error('Erreur désinscription admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
