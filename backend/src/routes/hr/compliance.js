const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Get all HR policies
router.get('/policies', authenticateToken, async (req, res) => {
  try {
    const {category, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM hr_policies WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    query += ` ORDER BY effective_date DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM hr_policies');
    
    res.json({
      policies: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({error: 'Failed to fetch policies'});
  }
});

// Get policy by ID
router.get('/policies/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hr_policies WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Policy not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({error: 'Failed to fetch policy'});
  }
});

// Create policy
router.post('/policies', authenticateToken, async (req, res) => {
  try {
    const {title, category, content, version, effectiveDate, expiryDate, requiresAcknowledgment} = req.body;

    if (!title || !content || !effectiveDate) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO hr_policies (
        title, category, content, version, effective_date, expiry_date,
        requires_acknowledgment, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        title,
        category || null,
        content,
        version || '1.0',
        effectiveDate,
        expiryDate || null,
        requiresAcknowledgment || false,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({error: 'Failed to create policy'});
  }
});

// Update policy
router.put('/policies/:id', authenticateToken, async (req, res) => {
  try {
    const {title, category, content, version, effectiveDate, expiryDate, requiresAcknowledgment} = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }
    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }
    if (content !== undefined) {
      paramCount++;
      updates.push(`content = $${paramCount}`);
      params.push(content);
    }
    if (version !== undefined) {
      paramCount++;
      updates.push(`version = $${paramCount}`);
      params.push(version);
    }
    if (effectiveDate !== undefined) {
      paramCount++;
      updates.push(`effective_date = $${paramCount}`);
      params.push(effectiveDate);
    }
    if (expiryDate !== undefined) {
      paramCount++;
      updates.push(`expiry_date = $${paramCount}`);
      params.push(expiryDate);
    }
    if (requiresAcknowledgment !== undefined) {
      paramCount++;
      updates.push(`requires_acknowledgment = $${paramCount}`);
      params.push(requiresAcknowledgment);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE hr_policies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Policy not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({error: 'Failed to update policy'});
  }
});

// Get policy acknowledgments
router.get('/policies/:id/acknowledgments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pa.*, e.first_name, e.last_name, e.employee_id, e.email
       FROM policy_acknowledgments pa
       JOIN employees e ON pa.employee_id = e.id
       WHERE pa.policy_id = $1
       ORDER BY pa.acknowledged_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching acknowledgments:', error);
    res.status(500).json({error: 'Failed to fetch acknowledgments'});
  }
});

// Acknowledge policy
router.post('/policies/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const {employeeId} = req.body;

    if (!employeeId) {
      return res.status(400).json({error: 'Employee ID required'});
    }

    const result = await pool.query(
      `INSERT INTO policy_acknowledgments (policy_id, employee_id, acknowledged_at, ip_address)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (policy_id, employee_id) DO NOTHING
       RETURNING *`,
      [req.params.id, employeeId, req.ip]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({error: 'Policy already acknowledged'});
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    res.status(500).json({error: 'Failed to acknowledge policy'});
  }
});

// Get employee's pending acknowledgments
router.get('/acknowledgments/pending/:employeeId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*
       FROM hr_policies p
       WHERE p.requires_acknowledgment = TRUE
       AND p.effective_date <= CURRENT_DATE
       AND (p.expiry_date IS NULL OR p.expiry_date >= CURRENT_DATE)
       AND NOT EXISTS (
         SELECT 1 FROM policy_acknowledgments pa
         WHERE pa.policy_id = p.id AND pa.employee_id = $1
       )
       ORDER BY p.effective_date DESC`,
      [req.params.employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending acknowledgments:', error);
    res.status(500).json({error: 'Failed to fetch pending acknowledgments'});
  }
});

module.exports = router;

