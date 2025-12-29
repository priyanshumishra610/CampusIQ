const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create announcement
router.post('/', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, content, targetRoles, targetCourses, priority} = req.body;
    const authorId = req.user.id;

    const result = await pool.query(
      `INSERT INTO announcements (title, content, author_id, target_roles, target_courses, priority, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, content, authorId, targetRoles || [], targetCourses || [], priority || 'NORMAL']
    );

    // Create notifications for target users
    let userQuery = 'SELECT id FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (targetRoles && targetRoles.length > 0) {
      userQuery += ` AND role = ANY($${paramCount++})`;
      params.push(targetRoles);
    }

    const usersResult = await pool.query(userQuery, params);
    const notificationPromises = usersResult.rows.map(user =>
      pool.query(
        `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
         VALUES ($1, $2, $3, 'ANNOUNCEMENT', $4, CURRENT_TIMESTAMP)`,
        [user.id, title, content, result.rows[0].id]
      )
    );

    await Promise.all(notificationPromises);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement-created', {
        id: result.rows[0].id,
        title,
        content,
        priority,
      });
    }

    res.status(201).json({id: result.rows[0].id, message: 'Announcement created'});
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({error: 'Failed to create announcement'});
  }
});

// Get announcements
router.get('/', async (req, res) => {
  try {
    const {role} = req.query;
    let query = `
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND ($${paramCount++} = ANY(a.target_roles) OR array_length(a.target_roles, 1) IS NULL)`;
      params.push(role);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      authorName: row.author_name,
      targetRoles: row.target_roles || [],
      targetCourses: row.target_courses || [],
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({error: 'Failed to fetch announcements'});
  }
});

// Get announcement by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as author_name
       FROM announcements a
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Announcement not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      authorName: row.author_name,
      targetRoles: row.target_roles || [],
      targetCourses: row.target_courses || [],
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({error: 'Failed to fetch announcement'});
  }
});

// Update announcement
router.put('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, content, targetRoles, targetCourses, priority} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (targetRoles !== undefined) {
      updates.push(`target_roles = $${paramCount++}`);
      values.push(targetRoles);
    }
    if (targetCourses !== undefined) {
      updates.push(`target_courses = $${paramCount++}`);
      values.push(targetCourses);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Announcement updated'});
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({error: 'Failed to update announcement'});
  }
});

// Delete announcement
router.delete('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({message: 'Announcement deleted'});
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({error: 'Failed to delete announcement'});
  }
});

module.exports = router;

