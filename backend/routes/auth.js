const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../db');

// Schémas de validation
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').default('student')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// INSCRIPTION
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role } = value;
    
    // Sécurité : On ne permet pas de s'inscrire en tant qu'admin via cette route 
    // sauf si c'est explicitement autorisé (ex: premier utilisateur ou via dashboard admin)
    // Pour l'instant, on force 'student' ou 'teacher'
    const finalRole = (role === 'admin') ? 'student' : role;
    
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }
   
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, finalRole]
    );
    
    res.status(201).json({ message: 'Inscription réussie', userId: result.insertId });
  } catch (error) {
    console.error('Erreur Register:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// CONNEXION
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = value;
    
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Connexion réussie',
      token,
      role: user.role,
      name: user.name,
      id: user.id
    });
  } catch (error) {
    console.error('Erreur Login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;