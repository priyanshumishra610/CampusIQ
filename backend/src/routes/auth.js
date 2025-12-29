const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
const {authenticateToken} = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const {email, password, name, role, adminRole, department} = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({error: 'User already exists'});
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, admin_role, department, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, email, name, role, admin_role, department, created_at`,
      [email, passwordHash, name, role, adminRole || null, department || null]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      {userId: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET,
      {expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adminRole: user.admin_role,
        department: user.department,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({error: 'Registration failed'});
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({error: 'Email and password required'});
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({error: 'Invalid credentials'});
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({error: 'Invalid credentials'});
    }

    // Generate token
    const token = jwt.sign(
      {userId: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET,
      {expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
    );

    // Return user data (excluding password)
    const {password_hash, ...userData} = user;
    
    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        adminRole: userData.admin_role,
        department: userData.department,
        campusId: userData.campus_id,
        campusName: userData.campus_name,
        studentId: userData.student_id,
        facultyId: userData.faculty_id,
        enrollmentNumber: userData.enrollment_number,
        employeeId: userData.employee_id,
        phoneNumber: userData.phone_number,
        profileImageUrl: userData.profile_image_url,
        fcmTokens: userData.fcm_tokens || [],
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({error: 'Login failed'});
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    const user = result.rows[0];
    const {password_hash, ...userData} = user;
    
    res.json({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      adminRole: userData.admin_role,
      department: userData.department,
      campusId: userData.campus_id,
      campusName: userData.campus_name,
      studentId: userData.student_id,
      facultyId: userData.faculty_id,
      enrollmentNumber: userData.enrollment_number,
      employeeId: userData.employee_id,
      phoneNumber: userData.phone_number,
      profileImageUrl: userData.profile_image_url,
      fcmTokens: userData.fcm_tokens || [],
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({error: 'Failed to fetch user'});
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, async (req, res) => {
  res.json({message: 'Logged out successfully'});
});

module.exports = router;

