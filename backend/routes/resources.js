const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/roleChecker');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// POST : Créer une ressource
router.post('/', verifyToken, requireRole(['teacher', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { chapter_id, title, type, url } = req.body;
    let finalUrl = url;

    if (req.file) {
      finalUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    
    if (!chapter_id || !title || !type) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const [chapters] = await db.query(`
      SELECT c.id, co.teacher_id 
      FROM chapters c 
      JOIN courses co ON c.course_id = co.id 
      WHERE c.id = ?
    `, [chapter_id]);

    if (chapters.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé.' });
    }

    if (chapters[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    const [result] = await db.query(
      'INSERT INTO resources (chapter_id, title, type, url) VALUES (?, ?, ?, ?)',
      [chapter_id, title, type, finalUrl]
    );

    res.status(201).json({ 
      message: 'Ressource ajoutée avec succès.', 
      resource: { id: result.insertId, chapter_id, title, type, url: finalUrl } 
    });
  } catch (error) {
    console.error('Erreur création ressource:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET : Ressources d'un chapitre
router.get('/chapter/:chapterId', verifyToken, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const [resources] = await db.query('SELECT * FROM resources WHERE chapter_id = ? ORDER BY id', [chapterId]);
    res.json(resources);
  } catch (error) {
    console.error('Erreur Get Resources By Chapter:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT : Modifier une ressource
router.put('/:id', verifyToken, requireRole(['teacher', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, url } = req.body;
    let finalUrl = url;

    const [resources] = await db.query(`
      SELECT r.*, c.teacher_id FROM resources r
      JOIN chapters ch ON r.chapter_id = ch.id
      JOIN courses c ON ch.course_id = c.id
      WHERE r.id = ?
    `, [id]);

    if (resources.length === 0) return res.status(404).json({ message: 'Ressource non trouvée.' });
    if (resources[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    if (req.file) {
      finalUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    await db.query(
      'UPDATE resources SET title = ?, type = ?, url = ? WHERE id = ?',
      [title, type, finalUrl, id]
    );

    res.json({ message: 'Ressource mise à jour.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// DELETE : Supprimer une ressource
router.delete('/:id', verifyToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const [resources] = await db.query(`
      SELECT r.id, r.url, c.teacher_id FROM resources r
      JOIN chapters ch ON r.chapter_id = ch.id
      JOIN courses c ON ch.course_id = c.id
      WHERE r.id = ?
    `, [id]);

    if (resources.length === 0) return res.status(404).json({ message: 'Ressource non trouvée.' });
    if (resources[0].teacher_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit.' });

    if (resources[0].url && resources[0].url.includes('/uploads/')) {
      const fileName = resources[0].url.split('/').pop();
      await fs.unlink(path.join(__dirname, '..', 'uploads', fileName)).catch(() => {});
    }

    await db.query('DELETE FROM resources WHERE id = ?', [id]);
    res.json({ message: 'Ressource supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;