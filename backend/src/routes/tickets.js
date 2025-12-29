const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create ticket
router.post('/', async (req, res) => {
  try {
    const {title, description, category, priority} = req.body;
    const createdBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO tickets (title, description, created_by, status, priority, category, 
       created_at, updated_at)
       VALUES ($1, $2, $3, 'OPEN', $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, description, createdBy, priority || 'MEDIUM', category || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Ticket created'});
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({error: 'Failed to create ticket'});
  }
});

// Get tickets
router.get('/', async (req, res) => {
  try {
    const {status, priority, assignedTo} = req.query;
    let query = `
      SELECT t.*, u1.name as created_by_name, u2.name as assigned_to_name
      FROM tickets t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Users can only see their own tickets unless they're support/admin
    if (!['SUPPORT', 'ADMIN'].includes(req.user.role)) {
      query += ` AND t.created_by = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND t.priority = $${paramCount++}`;
      params.push(priority);
    }
    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramCount++}`;
      params.push(assignedTo);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      status: row.status,
      priority: row.priority,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({error: 'Failed to fetch tickets'});
  }
});

// Update ticket
router.put('/:id', authorizeRoles('SUPPORT', 'ADMIN'), async (req, res) => {
  try {
    const {status, assignedTo, priority} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(assignedTo);
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
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Ticket updated'});
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({error: 'Failed to update ticket'});
  }
});

module.exports = router;

