const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Récupérer les annonces des cours où l'utilisateur est inscrit (ou toutes les annonces si admin/teacher)
    let announcementsQuery = `
      SELECT a.id, a.title, a.content, a.created_at, c.title AS course_title, u.name AS author_name, 'announcement' AS type, a.course_id
      FROM announcements a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.teacher_id = u.id
    `;
    let queryParams = [];

    if (userRole === 'student') {
      announcementsQuery += `
        JOIN enrollments e ON e.course_id = c.id
        WHERE e.student_id = ?
      `;
      queryParams.push(userId);
    }
    announcementsQuery += ` ORDER BY a.created_at DESC LIMIT 15`;

    const [announcements] = await db.query(announcementsQuery, queryParams);

    // 2. Récupérer les nouvelles formations publiées récemment sur la plateforme
    const [newCourses] = await db.query(`
      SELECT c.id, c.title, c.description AS content, c.created_at, c.title AS course_title, u.name AS author_name, 'new_course' AS type, c.id AS course_id
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = 1
      ORDER BY c.created_at DESC LIMIT 15
    `);

    // Combiner et trier par date décroissante
    let allNotifications = [...announcements, ...newCourses];
    allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limiter aux 20 plus récentes
    allNotifications = allNotifications.slice(0, 20);

    res.json(allNotifications);
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notifications.' });
  }
});

module.exports = router;
