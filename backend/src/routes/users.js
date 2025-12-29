const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const {role, department} = req.query;
    let query = 'SELECT id, email, name, role, admin_role, department, campus_id, campus_name, student_id, faculty_id, enrollment_number, employee_id, phone_number, profile_image_url, created_at, updated_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }

    if (department) {
      query += ` AND department = $${paramCount++}`;
      params.push(department);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({error: 'Failed to fetch users'});
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    // Users can only view their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({error: 'Access denied'});
    }

    const result = await pool.query(
      'SELECT id, email, name, role, admin_role, department, campus_id, campus_name, student_id, faculty_id, enrollment_number, employee_id, phone_number, profile_image_url, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({error: 'Failed to fetch user'});
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({error: 'Access denied'});
    }

    const {name, phoneNumber, profileImageUrl, department} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramCount++}`);
      values.push(phoneNumber);
    }
    if (profileImageUrl !== undefined) {
      updates.push(`profile_image_url = $${paramCount++}`);
      values.push(profileImageUrl);
    }
    if (department !== undefined && req.user.role === 'ADMIN') {
      updates.push(`department = $${paramCount++}`);
      values.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role, admin_role, department, campus_id, campus_name, student_id, faculty_id, enrollment_number, employee_id, phone_number, profile_image_url, created_at, updated_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({error: 'Failed to update user'});
  }
});

// Register FCM token
router.post('/:id/fcm-token', async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({error: 'Access denied'});
    }

    const {token} = req.body;
    if (!token) {
      return res.status(400).json({error: 'Token required'});
    }

    // Get current tokens
    const userResult = await pool.query('SELECT fcm_tokens FROM users WHERE id = $1', [req.params.id]);
    const currentTokens = userResult.rows[0]?.fcm_tokens || [];

    // Add token if not already present
    if (!currentTokens.includes(token)) {
      const updatedTokens = [...currentTokens, token];
      await pool.query('UPDATE users SET fcm_tokens = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        updatedTokens,
        req.params.id,
      ]);
    }

    res.json({message: 'Token registered successfully'});
  } catch (error) {
    console.error('Register FCM token error:', error);
    res.status(500).json({error: 'Failed to register token'});
  }
});

module.exports = router;

