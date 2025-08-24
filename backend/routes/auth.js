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
      if (err) throw err;
      
      if (results.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (err, result) => {
        if (err) throw err;
        
        // Token में name भी include करें
        const token = jwt.sign(
          { 
            id: result.insertId, 
            email: email,
            name: name // name add करें
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
      
      // Token में name भी include करें
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          name: user.name // name add करें
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
    
    // सीधे token से user information return करें
    res.json({
      message: 'Profile accessed successfully',
      user: {
        id: req.user.id,
        name: req.user.name, // जब register करते हैं तो name को token में include करें
        email: req.user.email
      }
    });
    
    // अगर database से fetch करना है तो:
    /*
    db.query('SELECT id, name, email FROM users WHERE id = ?', [req.user.id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        message: 'Profile accessed successfully',
        user: results[0]
      });
    });
    */
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;