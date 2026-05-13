const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');
const path = require('path');
const fs = require('fs').promises;

// Upload de ressource (teacher seulement)
router.post('/', verifyToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { chapter_id, title, type, url } = req.body;
    
    // Validation
    if (!chapter_id || !title || !type || !url) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Vérifier que le chapitre existe et appartient à un cours du teacher
    const [chapters] = await db.query(`
      SELECT c.id, c.course_id, co.teacher_id 
      FROM chapters c 
      JOIN courses co ON c.course_id = co.id 
      WHERE c.id = ?
    `, [chapter_id]);

    if (chapters.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé.' });
    }

    if (chapters[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit à ce chapitre.' });
    }

    const [result] = await db.query(
      'INSERT INTO resources (chapter_id, title, type, url) VALUES (?, ?, ?, ?)',
      [chapter_id, title, type, url]
    );

    res.status(201).json({ 
      message: 'Ressource ajoutée avec succès.', 
      resource: { id: result.insertId, chapter_id, title, type, url } 
    });
  } catch (error) {
    console.error('Erreur création ressource:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les ressources d'un chapitre (étudiant ou teacher)
router.get('/chapter/:chapterId', verifyToken, async (req, res) => {
  try {
    const { chapterId } = req.params;

    // Vérifier l'accès au chapitre via les enrollments ou si c'est le teacher du cours
    const [access] = await db.query(`
      SELECT 1 FROM chapters c
      JOIN courses co ON c.course_id = co.id
      LEFT JOIN enrollments e ON e.course_id = co.id AND e.student_id = ?
      WHERE c.id = ? AND (co.teacher_id = ? OR e.id IS NOT NULL)
    `, [req.user.id, chapterId, req.user.id]);

    if (access.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé à ce chapitre.' });
    }

    const [resources] = await db.query(
      'SELECT * FROM resources WHERE chapter_id = ? ORDER BY id',
      [chapterId]
    );

    res.json(resources);
  } catch (error) {
    console.error('Erreur récupération ressources:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Supprimer une ressource (teacher seulement)
router.delete('/:id', verifyToken, requireRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la ressource appartient à un cours du teacher
    const [resources] = await db.query(`
      SELECT r.id, c.teacher_id FROM resources r
      JOIN chapters ch ON r.chapter_id = ch.id
      JOIN courses c ON ch.course_id = c.id
      WHERE r.id = ?
    `, [id]);

    if (resources.length === 0) {
      return res.status(404).json({ message: 'Ressource non trouvée.' });
    }

    if (resources[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    // Supprimer le fichier physique si c'est un upload local
    if (resources[0].url && !resources[0].url.startsWith('http')) {
      try {
        await fs.unlink(path.join(__dirname, '..', '..', resources[0].url));
      } catch (err) {
        console.warn('Fichier physique non trouvé:', err);
      }
    }

    await db.query('DELETE FROM resources WHERE id = ?', [id]);
    res.json({ message: 'Ressource supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression ressource:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;