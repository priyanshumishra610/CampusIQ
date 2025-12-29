const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Get all payroll records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {employeeId, month, year, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT pr.*, e.first_name, e.last_name, e.employee_id, e.department
                 FROM payroll_records pr
                 JOIN employees e ON pr.employee_id = e.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    if (employeeId) {
      paramCount++;
      query += ` AND pr.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (month) {
      paramCount++;
      query += ` AND pr.month = $${paramCount}`;
      params.push(month);
    }

    if (year) {
      paramCount++;
      query += ` AND pr.year = $${paramCount}`;
      params.push(year);
    }

    query += ` ORDER BY pr.year DESC, pr.month DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      records: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({error: 'Failed to fetch payroll records'});
  }
});

// Get payroll record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pr.*, e.first_name, e.last_name, e.employee_id, e.department
       FROM payroll_records pr
       JOIN employees e ON pr.employee_id = e.id
       WHERE pr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Payroll record not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({error: 'Failed to fetch payroll record'});
  }
});

// Generate payroll
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {employeeIds, month, year, payPeriodStart, payPeriodEnd} = req.body;

    if (!month || !year || !payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const employees = employeeIds 
      ? await pool.query('SELECT * FROM employees WHERE id = ANY($1)', [employeeIds])
      : await pool.query('SELECT * FROM employees WHERE status = $1', ['ACTIVE']);

    const generatedRecords = [];

    for (const employee of employees.rows) {
      // Check if payroll already exists
      const existing = await pool.query(
        'SELECT id FROM payroll_records WHERE employee_id = $1 AND month = $2 AND year = $3',
        [employee.id, month, year]
      );

      if (existing.rows.length > 0) {
        continue; // Skip if already generated
      }

      // Get salary structure
      const salaryStructure = employee.salary_structure_id
        ? await pool.query('SELECT * FROM salary_structures WHERE id = $1', [employee.salary_structure_id])
        : null;

      const basicSalary = salaryStructure?.rows[0]?.components?.basic || 0;
      const allowances = salaryStructure?.rows[0]?.components?.allowances || {};
      const deductions = salaryStructure?.rows[0]?.components?.deductions || {};

      // Calculate attendance-based deductions
      const attendanceResult = await pool.query(
        `SELECT COUNT(*) as absent_days 
         FROM employee_attendance 
         WHERE employee_id = $1 AND date >= $2 AND date <= $3 AND status = 'ABSENT'`,
        [employee.id, payPeriodStart, payPeriodEnd]
      );

      const absentDays = parseInt(attendanceResult.rows[0]?.absent_days || 0);
      const dailyRate = basicSalary / 30;
      const leaveDeductions = absentDays * dailyRate;

      const result = await pool.query(
        `INSERT INTO payroll_records (
          employee_id, salary_structure_id, pay_period_start, pay_period_end,
          month, year, basic_salary, allowances, deductions, leave_deductions,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          employee.id,
          employee.salary_structure_id || null,
          payPeriodStart,
          payPeriodEnd,
          month,
          year,
          basicSalary,
          JSON.stringify(allowances),
          JSON.stringify(deductions),
          leaveDeductions,
          req.user.id,
        ]
      );

      generatedRecords.push(result.rows[0]);
    }

    res.status(201).json({records: generatedRecords, count: generatedRecords.length});
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({error: 'Failed to generate payroll'});
  }
});

// Update payroll record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {basicSalary, allowances, deductions, bonuses, incentives, overtimePay, paymentStatus, paymentDate} = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (basicSalary !== undefined) {
      paramCount++;
      updates.push(`basic_salary = $${paramCount}`);
      params.push(basicSalary);
    }
    if (allowances !== undefined) {
      paramCount++;
      updates.push(`allowances = $${paramCount}`);
      params.push(JSON.stringify(allowances));
    }
    if (deductions !== undefined) {
      paramCount++;
      updates.push(`deductions = $${paramCount}`);
      params.push(JSON.stringify(deductions));
    }
    if (bonuses !== undefined) {
      paramCount++;
      updates.push(`bonuses = $${paramCount}`);
      params.push(bonuses);
    }
    if (incentives !== undefined) {
      paramCount++;
      updates.push(`incentives = $${paramCount}`);
      params.push(incentives);
    }
    if (overtimePay !== undefined) {
      paramCount++;
      updates.push(`overtime_pay = $${paramCount}`);
      params.push(overtimePay);
    }
    if (paymentStatus !== undefined) {
      paramCount++;
      updates.push(`payment_status = $${paramCount}`);
      params.push(paymentStatus);
    }
    if (paymentDate !== undefined) {
      paramCount++;
      updates.push(`payment_date = $${paramCount}`);
      params.push(paymentDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE payroll_records SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Payroll record not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({error: 'Failed to update payroll record'});
  }
});

// Get salary structures
router.get('/structures', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salary_structures WHERE is_active = TRUE ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    res.status(500).json({error: 'Failed to fetch salary structures'});
  }
});

// Create salary structure
router.post('/structures', authenticateToken, async (req, res) => {
  try {
    const {name, description, components} = req.body;

    if (!name || !components) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO salary_structures (name, description, components, created_at, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name, description || null, JSON.stringify(components)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating salary structure:', error);
    res.status(500).json({error: 'Failed to create salary structure'});
  }
});

module.exports = router;

