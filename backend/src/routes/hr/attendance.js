const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Mark employee attendance
router.post('/mark', authenticateToken, async (req, res) => {
  try {
    const {employeeId, date, checkInTime, checkOutTime, status, location, remarks} = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Calculate work hours if both check-in and check-out are provided
    let workHours = null;
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(checkInTime);
      const checkOut = new Date(checkOutTime);
      workHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert to hours
    }

    const result = await pool.query(
      `INSERT INTO employee_attendance (
        employee_id, date, check_in_time, check_out_time, status, work_hours,
        location_latitude, location_longitude, remarks, marked_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (employee_id, date)
      DO UPDATE SET
        check_in_time = COALESCE(EXCLUDED.check_in_time, employee_attendance.check_in_time),
        check_out_time = COALESCE(EXCLUDED.check_out_time, employee_attendance.check_out_time),
        status = COALESCE(EXCLUDED.status, employee_attendance.status),
        work_hours = COALESCE(EXCLUDED.work_hours, employee_attendance.work_hours),
        location_latitude = COALESCE(EXCLUDED.location_latitude, employee_attendance.location_latitude),
        location_longitude = COALESCE(EXCLUDED.location_longitude, employee_attendance.location_longitude),
        remarks = COALESCE(EXCLUDED.remarks, employee_attendance.remarks),
        marked_by = COALESCE(EXCLUDED.marked_by, employee_attendance.marked_by),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        employeeId,
        date,
        checkInTime || null,
        checkOutTime || null,
        status || 'PRESENT',
        workHours,
        location?.latitude || null,
        location?.longitude || null,
        remarks || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({error: 'Failed to mark attendance'});
  }
});

// Get employee attendance
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const {startDate, endDate, page = 1, limit = 30} = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM employee_attendance WHERE employee_id = $1';
    const params = [req.params.employeeId];
    let paramCount = 1;

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

    query += ` ORDER BY date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      attendance: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({error: 'Failed to fetch attendance'});
  }
});

// Get attendance summary
router.get('/employee/:employeeId/summary', authenticateToken, async (req, res) => {
  try {
    const {startDate, endDate} = req.query;
    
    let query = `SELECT 
      COUNT(*) FILTER (WHERE status = 'PRESENT') as present_days,
      COUNT(*) FILTER (WHERE status = 'ABSENT') as absent_days,
      COUNT(*) FILTER (WHERE status = 'LATE') as late_days,
      COUNT(*) FILTER (WHERE status = 'HALF_DAY') as half_days,
      COUNT(*) FILTER (WHERE status = 'HOLIDAY') as holidays,
      COUNT(*) FILTER (WHERE status = 'LEAVE') as leave_days,
      SUM(work_hours) as total_work_hours
      FROM employee_attendance
      WHERE employee_id = $1`;
    
    const params = [req.params.employeeId];
    let paramCount = 1;

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

    const result = await pool.query(query, params);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({error: 'Failed to fetch attendance summary'});
  }
});

module.exports = router;

