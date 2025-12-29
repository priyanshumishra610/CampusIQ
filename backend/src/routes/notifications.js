const express = require('express');
const pool = require('../database/connection');

const router = express.Router();

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const {read} = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramCount = 2;

    if (read !== undefined) {
      query += ` AND read = $${paramCount++}`;
      params.push(read === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      relatedId: row.related_id,
      read: row.read,
      createdAt: row.created_at,
    })));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({error: 'Failed to fetch notifications'});
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({message: 'Notification marked as read'});
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({error: 'Failed to mark notification as read'});
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [req.user.id]
    );
    res.json({message: 'All notifications marked as read'});
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({error: 'Failed to mark all notifications as read'});
  }
});

// Create notification (internal use - can be called by other services)
router.post('/', async (req, res) => {
  try {
    const {userId, title, message, type, relatedId} = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, title, message, type || null, relatedId || null]
    );

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        id: result.rows[0].id,
        userId,
        title,
        message,
        type,
        relatedId,
        read: false,
      });
    }

    res.status(201).json({id: result.rows[0].id, message: 'Notification created'});
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({error: 'Failed to create notification'});
  }
});

module.exports = router;

