const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// Mettre à jour la progression (marquer une ressource comme vue)
router.post('/update', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Seuls les étudiants peuvent mettre à jour leur progression.' });
    }

    const { course_id, resource_id } = req.body;
    
    if (!course_id || !resource_id) {
      return res.status(400).json({ message: 'course_id et resource_id sont requis.' });
    }

    // Vérifier que l'étudiant est inscrit au cours
    const [enrolled] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, course_id]
    );
    if (enrolled.length === 0) {
      return res.status(403).json({ message: 'Vous devez être inscrit au cours.' });
    }

    // Vérifier que la ressource appartient au cours
    const [resource] = await db.query(`
      SELECT r.id FROM resources r
      JOIN chapters c ON r.chapter_id = c.id
      WHERE r.id = ? AND c.course_id = ?
    `, [resource_id, course_id]);
    
    if (resource.length === 0) {
      return res.status(404).json({ message: 'Ressource non trouvée dans ce cours.' });
    }

    // Insérer ou mettre à jour la progression (UPSERT)
    await db.query(`
      INSERT INTO progress (student_id, course_id, resource_id, viewed_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE viewed_at = NOW()
    `, [req.user.id, course_id, resource_id]);

    res.json({ message: 'Progression mise à jour.', resource_id });
  } catch (error) {
    console.error('Erreur mise à jour progression:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer la progression d'un étudiant pour un cours
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.role === 'student' ? req.user.id : null;

    // Si student, vérifier l'inscription
    if (studentId) {
      const [enrolled] = await db.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
        [studentId, courseId]
      );
      if (enrolled.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé.' });
      }
    }

    // Calculer les statistiques de progression
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_resources,
        COUNT(DISTINCT p.resource_id) as viewed_resources,
        ROUND(COUNT(DISTINCT p.resource_id) * 100.0 / COUNT(DISTINCT r.id), 1) as percentage
      FROM chapters c
      JOIN resources r ON r.chapter_id = c.id
      LEFT JOIN progress p ON p.resource_id = r.id AND p.student_id = ?
      WHERE c.course_id = ?
    `, [studentId || req.user.id, courseId]);

    // Détails par chapitre (optionnel)
    const [chapters] = await db.query(`
      SELECT 
        ch.id as chapter_id, ch.title,
        COUNT(r.id) as resources_count,
        COUNT(p.resource_id) as viewed_count
      FROM chapters ch
      LEFT JOIN resources r ON r.chapter_id = ch.id
      LEFT JOIN progress p ON p.resource_id = r.id AND p.student_id = ?
      WHERE ch.course_id = ?
      GROUP BY ch.id
      ORDER BY ch.id ASC
    `, [studentId || req.user.id, courseId]);

    res.json({
      course_id: courseId,
      stats: stats[0] || { total_resources: 0, viewed_resources: 0, percentage: 0 },
      chapters
    });
  } catch (error) {
    console.error('Erreur récupération progression:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;