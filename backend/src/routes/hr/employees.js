const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken, checkPermission} = require('../../middleware/auth');

const router = express.Router();

// Get all employees with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {department, status, search, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT e.*, u.email, u.profile_image_url as user_profile_image FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
    }

    if (status) {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR e.employee_id ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM employees e WHERE 1=1' + 
      (department ? ` AND e.department = '${department}'` : '') +
      (status ? ` AND e.status = '${status}'` : '') +
      (search ? ` AND (e.first_name ILIKE '%${search}%' OR e.last_name ILIKE '%${search}%' OR e.employee_id ILIKE '%${search}%' OR e.email ILIKE '%${search}%')` : '')
    );

    res.json({
      employees: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({error: 'Failed to fetch employees'});
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.email, u.profile_image_url as user_profile_image,
       rm.first_name as manager_first_name, rm.last_name as manager_last_name
       FROM employees e 
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN employees rm ON e.reporting_manager_id = rm.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Employee not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({error: 'Failed to fetch employee'});
  }
});

// Create employee
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      employeeId,
      userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      dateOfJoining,
      department,
      designation,
      employmentType,
      reportingManagerId,
      workLocation,
      salaryStructureId,
      emergencyContact,
      address,
    } = req.body;

    if (!employeeId || !firstName || !lastName || !email || !dateOfJoining) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO employees (
        employee_id, user_id, first_name, last_name, email, phone_number,
        date_of_birth, date_of_joining, department, designation, employment_type,
        reporting_manager_id, work_location, salary_structure_id, emergency_contact, address,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        employeeId,
        userId || null,
        firstName,
        lastName,
        email,
        phoneNumber || null,
        dateOfBirth || null,
        dateOfJoining,
        department || null,
        designation || null,
        employmentType || 'FULL_TIME',
        reportingManagerId || null,
        workLocation || null,
        salaryStructureId || null,
        emergencyContact ? JSON.stringify(emergencyContact) : null,
        address || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({error: 'Employee ID or email already exists'});
    }
    res.status(500).json({error: 'Failed to create employee'});
  }
});

// Update employee
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      department,
      designation,
      employmentType,
      status,
      reportingManagerId,
      workLocation,
      salaryStructureId,
      emergencyContact,
      address,
      documents,
    } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (firstName !== undefined) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      params.push(firstName);
    }
    if (lastName !== undefined) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      params.push(lastName);
    }
    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }
    if (phoneNumber !== undefined) {
      paramCount++;
      updates.push(`phone_number = $${paramCount}`);
      params.push(phoneNumber);
    }
    if (dateOfBirth !== undefined) {
      paramCount++;
      updates.push(`date_of_birth = $${paramCount}`);
      params.push(dateOfBirth);
    }
    if (department !== undefined) {
      paramCount++;
      updates.push(`department = $${paramCount}`);
      params.push(department);
    }
    if (designation !== undefined) {
      paramCount++;
      updates.push(`designation = $${paramCount}`);
      params.push(designation);
    }
    if (employmentType !== undefined) {
      paramCount++;
      updates.push(`employment_type = $${paramCount}`);
      params.push(employmentType);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }
    if (reportingManagerId !== undefined) {
      paramCount++;
      updates.push(`reporting_manager_id = $${paramCount}`);
      params.push(reportingManagerId);
    }
    if (workLocation !== undefined) {
      paramCount++;
      updates.push(`work_location = $${paramCount}`);
      params.push(workLocation);
    }
    if (salaryStructureId !== undefined) {
      paramCount++;
      updates.push(`salary_structure_id = $${paramCount}`);
      params.push(salaryStructureId);
    }
    if (emergencyContact !== undefined) {
      paramCount++;
      updates.push(`emergency_contact = $${paramCount}`);
      params.push(JSON.stringify(emergencyContact));
    }
    if (address !== undefined) {
      paramCount++;
      updates.push(`address = $${paramCount}`);
      params.push(address);
    }
    if (documents !== undefined) {
      paramCount++;
      updates.push(`documents = $${paramCount}`);
      params.push(JSON.stringify(documents));
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Employee not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({error: 'Failed to update employee'});
  }
});

// Delete employee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Employee not found'});
    }

    res.json({message: 'Employee deleted successfully'});
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({error: 'Failed to delete employee'});
  }
});

// Get employee hierarchy
router.get('/:id/hierarchy', authenticateToken, async (req, res) => {
  try {
    const employeeResult = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({error: 'Employee not found'});
    }

    const employee = employeeResult.rows[0];
    const hierarchy = {
      employee: employee,
      manager: null,
      directReports: [],
    };

    // Get manager
    if (employee.reporting_manager_id) {
      const managerResult = await pool.query('SELECT * FROM employees WHERE id = $1', [employee.reporting_manager_id]);
      if (managerResult.rows.length > 0) {
        hierarchy.manager = managerResult.rows[0];
      }
    }

    // Get direct reports
    const reportsResult = await pool.query('SELECT * FROM employees WHERE reporting_manager_id = $1', [req.params.id]);
    hierarchy.directReports = reportsResult.rows;

    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching employee hierarchy:', error);
    res.status(500).json({error: 'Failed to fetch employee hierarchy'});
  }
});

module.exports = router;

