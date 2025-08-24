const express = require('express');
const bcrypt = require('bcryptjs'); // यह line सही करें
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }
        
        const token = jwt.sign(
          { id: result.insertId, email },
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const user = results[0];
      
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { id: user.id, email: user.email },
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', auth, (req, res) => {
  res.json({ message: 'Profile accessed successfully', user: req.user });
});

module.exports = router;