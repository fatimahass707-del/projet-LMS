const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');

// POST : Marquer une ressource comme vue (étudiant)
router.post('/view', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const { resource_id, course_id } = req.body;
    const student_id = req.user.id;

    // Vérifier que l'étudiant est inscrit au cours
    const [enrollment] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );
    if (enrollment.length === 0) {
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à ce cours" });
    }

    // Insérer ou mettre à jour le progrès (UPSERT)
    const sql = `
      INSERT INTO progress (student_id, course_id, resource_id, viewed_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE viewed_at = NOW()
    `;
    await db.query(sql, [student_id, course_id, resource_id]);

    res.json({ message: 'Progression enregistrée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Ma progression dans un cours (étudiant)
router.get('/my-progress/:courseId', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.id;

    // Vérifier l'inscription
    const [enrollment] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    if (enrollment.length === 0) {
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à ce cours" });
    }

    // Compter le total des ressources
    const [totalResources] = await db.query(`
      SELECT COUNT(*) as total
      FROM resources r
      INNER JOIN chapters c ON r.chapter_id = c.id
      WHERE c.course_id = ?
    `, [courseId]);

    // Compter les ressources vues
    const [viewedResources] = await db.query(`
      SELECT COUNT(DISTINCT p.resource_id) as viewed
      FROM progress p
      INNER JOIN resources r ON p.resource_id = r.id
      INNER JOIN chapters c ON r.chapter_id = c.id
      WHERE p.student_id = ? AND c.course_id = ?
    `, [studentId, courseId]);

    const total = totalResources[0].total;
    const viewed = viewedResources[0].viewed;
    const percentage = total > 0 ? Math.round((viewed / total) * 100) : 0;

    res.json({
      courseId,
      totalResources: total,
      viewedResources: viewed,
      percentage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Progression détaillée d'un étudiant dans un cours (enseignant)
router.get('/student/:studentId/course/:courseId', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const courseId = req.params.courseId;
    const teacherId = req.user.id;

    // Vérifier que l'enseignant est l'auteur du cours
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Récupérer la progression détaillée par chapitre
    const sql = `
      SELECT 
        ch.id as chapter_id,
        ch.title as chapter_title,
        COUNT(r.id) as total_resources,
        COUNT(DISTINCT p.resource_id) as viewed_resources
      FROM chapters ch
      LEFT JOIN resources r ON ch.id = r.chapter_id
      LEFT JOIN progress p ON r.id = p.resource_id AND p.student_id = ?
      WHERE ch.course_id = ?
      GROUP BY ch.id, ch.title
      ORDER BY ch.order_num
    `;
    const [progress] = await db.query(sql, [studentId, courseId]);

    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Liste des progrès de tous les étudiants pour un cours (enseignant)
router.get('/course/:courseId/students', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const teacherId = req.user.id;

    // Vérifier que l'enseignant est l'auteur du cours
    const [course] = await db.query('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    if (course[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const sql = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        u.email,
        COUNT(DISTINCT p.resource_id) as resources_viewed,
        (SELECT COUNT(*) FROM resources r INNER JOIN chapters c ON r.chapter_id = c.id WHERE c.course_id = ?) as total_resources
      FROM users u
      INNER JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN progress p ON u.id = p.student_id AND p.course_id = ?
      WHERE e.course_id = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.email
    `;
    const [students] = await db.query(sql, [courseId, courseId, courseId]);

    // Calculer le pourcentage pour chaque étudiant
    const studentsWithProgress = students.map(student => ({
      ...student,
      percentage: student.total_resources > 0 
        ? Math.round((student.resources_viewed / student.total_resources) * 100) 
        : 0
    }));

    res.json(studentsWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Historique de progression d'un étudiant
router.get('/my-history', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    const sql = `
      SELECT 
        p.viewed_at,
        r.title as resource_title,
        r.type,
        c.title as course_title
      FROM progress p
      INNER JOIN resources r ON p.resource_id = r.id
      INNER JOIN chapters ch ON r.chapter_id = ch.id
      INNER JOIN courses c ON ch.course_id = c.id
      WHERE p.student_id = ?
      ORDER BY p.viewed_at DESC
      LIMIT 50
    `;
    const [history] = await db.query(sql, [studentId]);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;