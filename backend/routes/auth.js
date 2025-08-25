const express = require('express');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      
      if (results.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (err, result) => {
        if (err) throw err;
        const token = jwt.sign(
          { 
            id: result.insertId, 
            email: email,
            name: name
          },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: result.insertId, name, email }
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', auth, (req, res) => {
  try {
    console.log('User from token:', req.user);
    
    res.json({
      message: 'Profile accessed successfully',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;