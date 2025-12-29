const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Helper function to calculate working days between dates (excluding weekends and holidays)
async function calculateWorkingDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  // Get all holidays in the date range
  const holidaysResult = await pool.query(
    'SELECT date FROM holidays WHERE date >= $1 AND date <= $2',
    [startDate, endDate]
  );
  const holidayDates = holidaysResult.rows.map(row => row.date.toISOString().split('T')[0]);

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    
    // Exclude weekends (Saturday = 6, Sunday = 0) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(dateStr)) {
      workingDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

// Get all holidays (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {startDate, endDate, type, year} = req.query;
    
    let query = 'SELECT * FROM holidays WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
    }

    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (year) {
      paramCount++;
      query += ` AND (year = $${paramCount} OR year IS NULL)`;
      params.push(year);
    }

    query += ' ORDER BY date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      date: row.date,
      type: row.type,
      description: row.description,
      isRecurring: row.is_recurring,
      recurringMonth: row.recurring_month,
      recurringDay: row.recurring_day,
      year: row.year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({error: 'Failed to fetch holidays'});
  }
});

// Get holiday by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM holidays WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Holiday not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      date: row.date,
      type: row.type,
      description: row.description,
      isRecurring: row.is_recurring,
      recurringMonth: row.recurring_month,
      recurringDay: row.recurring_day,
      year: row.year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Error fetching holiday:', error);
    res.status(500).json({error: 'Failed to fetch holiday'});
  }
});

// Create holiday (Admin/HR only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check permissions - only HR_ADMIN, HR_MANAGER, or ADMIN can create holidays
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }
    
    const userRole = userResult.rows[0].role;
    if (!['HR_ADMIN', 'HR_MANAGER', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({error: 'Unauthorized: Only HR Admin, HR Manager, or Admin can create holidays'});
    }

    const {name, date, type, description, isRecurring, recurringMonth, recurringDay, year} = req.body;

    if (!name || !date) {
      return res.status(400).json({error: 'Name and date are required'});
    }

    const result = await pool.query(
      `INSERT INTO holidays (name, date, type, description, is_recurring, recurring_month, recurring_day, year, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        name,
        date,
        type || 'NATIONAL',
        description || null,
        isRecurring || false,
        recurringMonth || null,
        recurringDay || null,
        year || null,
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      date: result.rows[0].date,
      type: result.rows[0].type,
      description: result.rows[0].description,
      isRecurring: result.rows[0].is_recurring,
      recurringMonth: result.rows[0].recurring_month,
      recurringDay: result.rows[0].recurring_day,
      year: result.rows[0].year,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({error: 'A holiday with this name and date already exists'});
    }
    console.error('Error creating holiday:', error);
    res.status(500).json({error: 'Failed to create holiday'});
  }
});

// Update holiday (Admin/HR only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }
    
    const userRole = userResult.rows[0].role;
    if (!['HR_ADMIN', 'HR_MANAGER', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({error: 'Unauthorized: Only HR Admin, HR Manager, or Admin can update holidays'});
    }

    const {name, date, type, description, isRecurring, recurringMonth, recurringDay, year} = req.body;

    const result = await pool.query(
      `UPDATE holidays 
       SET name = COALESCE($1, name),
           date = COALESCE($2, date),
           type = COALESCE($3, type),
           description = COALESCE($4, description),
           is_recurring = COALESCE($5, is_recurring),
           recurring_month = COALESCE($6, recurring_month),
           recurring_day = COALESCE($7, recurring_day),
           year = COALESCE($8, year),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        name || null,
        date || null,
        type || null,
        description !== undefined ? description : null,
        isRecurring !== undefined ? isRecurring : null,
        recurringMonth || null,
        recurringDay || null,
        year !== undefined ? year : null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Holiday not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      date: row.date,
      type: row.type,
      description: row.description,
      isRecurring: row.is_recurring,
      recurringMonth: row.recurring_month,
      recurringDay: row.recurring_day,
      year: row.year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({error: 'Failed to update holiday'});
  }
});

// Delete holiday (Admin/HR only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }
    
    const userRole = userResult.rows[0].role;
    if (!['HR_ADMIN', 'HR_MANAGER', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({error: 'Unauthorized: Only HR Admin, HR Manager, or Admin can delete holidays'});
    }

    const result = await pool.query('DELETE FROM holidays WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Holiday not found'});
    }

    res.json({message: 'Holiday deleted successfully'});
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({error: 'Failed to delete holiday'});
  }
});

// Calculate working days (excluding weekends and holidays)
router.post('/calculate-working-days', authenticateToken, async (req, res) => {
  try {
    const {startDate, endDate} = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({error: 'startDate and endDate are required'});
    }

    const workingDays = await calculateWorkingDays(startDate, endDate);
    res.json({workingDays, startDate, endDate});
  } catch (error) {
    console.error('Error calculating working days:', error);
    res.status(500).json({error: 'Failed to calculate working days'});
  }
});

// Export helper function
module.exports = {router, calculateWorkingDays};

