const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/profile - Obtenir le profil actuel
router.get('/', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/profile - Mettre à jour le nom/email
router.put('/', verifyToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
    res.json({ message: 'Profil mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/profile/password - Changer le mot de passe
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Mot de passe modifié' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
