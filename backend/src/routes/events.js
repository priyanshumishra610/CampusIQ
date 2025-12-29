const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create event
router.post('/', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, startDate, endDate, location, category} = req.body;
    const organizerId = req.user.id;

    const result = await pool.query(
      `INSERT INTO events (title, description, start_date, end_date, location, organizer_id, category, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, description, new Date(startDate), endDate ? new Date(endDate) : null, location || null, organizerId, category || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Event created'});
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({error: 'Failed to create event'});
  }
});

// Get events
router.get('/', async (req, res) => {
  try {
    const {startDate, endDate} = req.query;
    let query = `
      SELECT e.*, u.name as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND e.start_date >= $${paramCount++}`;
      params.push(new Date(startDate));
    }
    if (endDate) {
      query += ` AND e.start_date <= $${paramCount++}`;
      params.push(new Date(endDate));
    }

    query += ' ORDER BY e.start_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({error: 'Failed to fetch events'});
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as organizer_name
       FROM events e
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Event not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      organizerId: row.organizer_id,
      organizerName: row.organizer_name,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({error: 'Failed to fetch event'});
  }
});

// Update event
router.put('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, startDate, endDate, location, category} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(new Date(startDate));
    }
    if (endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(endDate ? new Date(endDate) : null);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Event updated'});
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({error: 'Failed to update event'});
  }
});

// Delete event
router.delete('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({message: 'Event deleted'});
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({error: 'Failed to delete event'});
  }
});

module.exports = router;

