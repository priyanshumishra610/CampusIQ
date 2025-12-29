const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Get all expense claims
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {employeeId, status, expenseType, startDate, endDate, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT ec.*, e.first_name, e.last_name, e.employee_id, e.department
                 FROM expense_claims ec
                 JOIN employees e ON ec.employee_id = e.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (employeeId) {
      paramCount++;
      query += ` AND ec.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (status) {
      paramCount++;
      query += ` AND ec.status = $${paramCount}`;
      params.push(status);
    }

    if (expenseType) {
      paramCount++;
      query += ` AND ec.expense_type = $${paramCount}`;
      params.push(expenseType);
    }

    if (startDate) {
      paramCount++;
      query += ` AND ec.claim_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND ec.claim_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY ec.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      claims: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching expense claims:', error);
    res.status(500).json({error: 'Failed to fetch expense claims'});
  }
});

// Get expense claim by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ec.*, e.first_name, e.last_name, e.employee_id, e.department
       FROM expense_claims ec
       JOIN employees e ON ec.employee_id = e.id
       WHERE ec.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Expense claim not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching expense claim:', error);
    res.status(500).json({error: 'Failed to fetch expense claim'});
  }
});

// Create expense claim
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {employeeId, claimDate, expenseType, description, amount, currency, receiptUrl} = req.body;

    if (!employeeId || !claimDate || !expenseType || !description || !amount) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO expense_claims (
        employee_id, claim_date, expense_type, description, amount, currency, receipt_url,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [employeeId, claimDate, expenseType, description, amount, currency || 'INR', receiptUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense claim:', error);
    res.status(500).json({error: 'Failed to create expense claim'});
  }
});

// Approve/Reject expense claim
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const {action, rejectionReason, paymentDate} = req.body; // action: 'APPROVE' or 'REJECT'

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({error: 'Invalid action'});
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (action === 'APPROVE') {
      paramCount++;
      updates.push(`status = 'APPROVED', approved_by = $${paramCount}, approved_at = CURRENT_TIMESTAMP`);
      params.push(req.user.id);
      
      if (paymentDate) {
        paramCount++;
        updates.push(`payment_date = $${paramCount}`);
        params.push(paymentDate);
      } else {
        updates.push(`status = 'APPROVED'`);
      }
    } else {
      paramCount++;
      updates.push(`status = 'REJECTED', rejection_reason = $${paramCount}`);
      params.push(rejectionReason || null);
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE expense_claims SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Expense claim not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense claim:', error);
    res.status(500).json({error: 'Failed to update expense claim'});
  }
});

module.exports = router;

