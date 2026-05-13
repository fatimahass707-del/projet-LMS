const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const checkRole = require('../middleware/roleChecker');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.mp4', '.avi', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// POST : Ajouter une ressource (enseignant)
router.post('/', verifyToken, checkRole(['teacher', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { chapter_id, title, type, url } = req.body;
    const teacherId = req.user.id;

    // Vérifier que l'enseignant est l'auteur du chapitre
    const [chapter] = await db.query(
      'SELECT c.teacher_id FROM chapters ch JOIN courses c ON ch.course_id = c.id WHERE ch.id = ?',
      [chapter_id]
    );

    if (chapter.length === 0) {
      return res.status(404).json({ message: 'Chapitre non trouvé' });
    }
    if (chapter[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de ce chapitre" });
    }

    let resourceUrl = url;
    if (req.file) {
      resourceUrl = `/uploads/${req.file.filename}`;
    }

    const sql = 'INSERT INTO resources (chapter_id, title, type, url) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [chapter_id, title, type, resourceUrl]);

    res.status(201).json({ message: 'Ressource ajoutée avec succès', resourceId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Liste des ressources d'un chapitre
router.get('/chapter/:chapterId', async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const sql = 'SELECT * FROM resources WHERE chapter_id = ? ORDER BY created_at DESC';
    const [resources] = await db.query(sql, [chapterId]);
    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET : Voir une ressource
router.get('/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM resources WHERE id = ?';
    const [resources] = await db.query(sql, [req.params.id]);
    
    if (resources.length === 0) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }
    res.json(resources[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT : Modifier une ressource
router.put('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, type, url } = req.body;
    const resourceId = req.params.id;
    const teacherId = req.user.id;

    const [resource] = await db.query(
      'SELECT ch.id, c.teacher_id FROM resources r JOIN chapters ch ON r.chapter_id = ch.id JOIN courses c ON ch.course_id = c.id WHERE r.id = ?',
      [resourceId]
    );

    if (resource.length === 0) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }
    if (resource[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de cette ressource" });
    }

    const sql = 'UPDATE resources SET title = ?, type = ?, url = ? WHERE id = ?';
    await db.query(sql, [title, type, url, resourceId]);

    res.json({ message: 'Ressource modifiée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE : Supprimer une ressource
router.delete('/:id', verifyToken, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const resourceId = req.params.id;
    const teacherId = req.user.id;

    const [resource] = await db.query(
      'SELECT ch.id, c.teacher_id, r.url FROM resources r JOIN chapters ch ON r.chapter_id = ch.id JOIN courses c ON ch.course_id = c.id WHERE r.id = ?',
      [resourceId]
    );

    if (resource.length === 0) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }
    if (resource[0].teacher_id !== teacherId) {
      return res.status(403).json({ message: "Accès refusé : vous n'êtes pas l'auteur de cette ressource" });
    }

    // Supprimer le fichier physique si c'est un fichier uploadé
    if (resource[0].url && resource[0].url.startsWith('/uploads/')) {
      const filePath = '.' + resource[0].url;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await db.query('DELETE FROM resources WHERE id = ?', [resourceId]);
    res.json({ message: 'Ressource supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;