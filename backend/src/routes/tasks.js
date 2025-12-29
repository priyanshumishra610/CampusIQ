const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create task
router.post('/', authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const {title, description, assignedTo, priority, dueDate} = req.body;
    const assignedBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, status, priority, due_date, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, description, assignedTo, assignedBy, priority || 'MEDIUM', dueDate ? new Date(dueDate) : null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Task created'});
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({error: 'Failed to create task'});
  }
});

// Get tasks
router.get('/', async (req, res) => {
  try {
    const {status, assignedTo} = req.query;
    let query = `
      SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.assigned_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Users can only see tasks assigned to them unless they're admin
    if (req.user.role !== 'ADMIN') {
      query += ` AND t.assigned_to = $${paramCount++}`;
      params.push(req.user.id);
    } else if (assignedTo) {
      query += ` AND t.assigned_to = $${paramCount++}`;
      params.push(assignedTo);
    }

    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      assignedTo: row.assigned_to,
      assignedToName: row.assigned_to_name,
      assignedBy: row.assigned_by,
      assignedByName: row.assigned_by_name,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({error: 'Failed to fetch tasks'});
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const {status, priority, dueDate} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate ? new Date(dueDate) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Task updated'});
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({error: 'Failed to update task'});
  }
});

module.exports = router;

