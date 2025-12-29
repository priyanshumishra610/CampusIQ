const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Get all performance reviews
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const {employeeId, status, reviewType, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT pr.*, e.first_name, e.last_name, e.employee_id, e.department
                 FROM performance_reviews pr
                 JOIN employees e ON pr.employee_id = e.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (employeeId) {
      paramCount++;
      query += ` AND pr.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (status) {
      paramCount++;
      query += ` AND pr.status = $${paramCount}`;
      params.push(status);
    }

    if (reviewType) {
      paramCount++;
      query += ` AND pr.review_type = $${paramCount}`;
      params.push(reviewType);
    }

    query += ` ORDER BY pr.review_period_end DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    res.status(500).json({error: 'Failed to fetch performance reviews'});
  }
});

// Get performance review by ID
router.get('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, e.first_name, e.last_name, e.employee_id, e.department
       FROM performance_reviews pr
       JOIN employees e ON pr.employee_id = e.id
       WHERE pr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Performance review not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching performance review:', error);
    res.status(500).json({error: 'Failed to fetch performance review'});
  }
});

// Create performance review
router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const {
      employeeId,
      reviewPeriodStart,
      reviewPeriodEnd,
      reviewType,
      goals,
      kpis,
    } = req.body;

    if (!employeeId || !reviewPeriodStart || !reviewPeriodEnd) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO performance_reviews (
        employee_id, review_period_start, review_period_end, review_type,
        goals, kpis, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        employeeId,
        reviewPeriodStart,
        reviewPeriodEnd,
        reviewType || 'ANNUAL',
        goals ? JSON.stringify(goals) : null,
        kpis ? JSON.stringify(kpis) : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({error: 'Failed to create performance review'});
  }
});

// Update performance review
router.put('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const {
      goals,
      kpis,
      achievements,
      areasForImprovement,
      overallRating,
      employeeComments,
      managerComments,
      status,
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (goals !== undefined) {
      paramCount++;
      updates.push(`goals = $${paramCount}`);
      params.push(JSON.stringify(goals));
    }
    if (kpis !== undefined) {
      paramCount++;
      updates.push(`kpis = $${paramCount}`);
      params.push(JSON.stringify(kpis));
    }
    if (achievements !== undefined) {
      paramCount++;
      updates.push(`achievements = $${paramCount}`);
      params.push(achievements);
    }
    if (areasForImprovement !== undefined) {
      paramCount++;
      updates.push(`areas_for_improvement = $${paramCount}`);
      params.push(areasForImprovement);
    }
    if (overallRating !== undefined) {
      paramCount++;
      updates.push(`overall_rating = $${paramCount}`);
      params.push(overallRating);
    }
    if (employeeComments !== undefined) {
      paramCount++;
      updates.push(`employee_comments = $${paramCount}`);
      params.push(employeeComments);
    }
    if (managerComments !== undefined) {
      paramCount++;
      updates.push(`manager_comments = $${paramCount}`);
      params.push(managerComments);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
      
      if (status === 'COMPLETED') {
        paramCount++;
        updates.push(`reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $${paramCount}`);
        params.push(req.user.id);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE performance_reviews SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Performance review not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating performance review:', error);
    res.status(500).json({error: 'Failed to update performance review'});
  }
});

module.exports = router;

