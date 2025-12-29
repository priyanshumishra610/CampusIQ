const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');
const {calculateWorkingDays} = require('./holidays');

const router = express.Router();

// Helper function to send notification
async function sendNotification(io, userId, title, message, type, relatedId) {
  try {
    // Insert notification in database
    const notificationResult = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, title, message, type || null, relatedId || null]
    );

    // Emit real-time notification
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        id: notificationResult.rows[0].id,
        userId,
        title,
        message,
        type,
        relatedId,
        read: false,
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Helper function to get employee's manager
async function getEmployeeManager(employeeId) {
  try {
    const result = await pool.query(
      'SELECT reporting_manager_id FROM employees WHERE id = $1',
      [employeeId]
    );
    return result.rows[0]?.reporting_manager_id || null;
  } catch (error) {
    console.error('Error getting employee manager:', error);
    return null;
  }
}

// Helper function to determine if HR approval is required
function requiresHRApproval(leaveType, daysCount) {
  // HR approval required for: Maternity, Paternity, Unpaid, or leaves > 5 days
  return ['MATERNITY', 'PATERNITY', 'UNPAID'].includes(leaveType) || daysCount > 5;
}

// Get all leave requests with filters
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const {employeeId, status, leaveType, startDate, endDate, department, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = `SELECT lr.*, 
                        e.first_name, e.last_name, e.employee_id, e.department,
                        u1.name as approved_by_name,
                        u2.name as manager_approved_by_name,
                        u3.name as hr_approved_by_name
                 FROM leave_requests lr
                 JOIN employees e ON lr.employee_id = e.id
                 LEFT JOIN users u1 ON lr.approved_by = u1.id
                 LEFT JOIN users u2 ON lr.manager_approved_by = u2.id
                 LEFT JOIN users u3 ON lr.hr_approved_by = u3.id
                 WHERE 1=1`;
    const params = [];
    let paramCount = 0;

    // Check user permissions - employees can only see their own requests
    const userResult = await pool.query(
      'SELECT role, id FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    const user = userResult.rows[0];
    const isHR = ['HR_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(user.role);

    if (!isHR && !employeeId) {
      // Get employee ID from user
      const empResult = await pool.query(
        'SELECT id FROM employees WHERE user_id = $1',
        [req.user.id]
      );
      if (empResult.rows.length > 0) {
        paramCount++;
        query += ` AND lr.employee_id = $${paramCount}`;
        params.push(empResult.rows[0].id);
      } else {
        return res.json({requests: [], pagination: {total: 0, page: 1, limit: 20}});
      }
    } else if (employeeId) {
      paramCount++;
      query += ` AND lr.employee_id = $${paramCount}`;
      params.push(employeeId);
    }

    if (status) {
      paramCount++;
      query += ` AND lr.status = $${paramCount}`;
      params.push(status);
    }

    if (leaveType) {
      paramCount++;
      query += ` AND lr.leave_type = $${paramCount}`;
      params.push(leaveType);
    }

    if (startDate) {
      paramCount++;
      query += ` AND lr.start_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND lr.end_date <= $${paramCount}`;
      params.push(endDate);
    }

    if (department && isHR) {
      paramCount++;
      query += ` AND e.department = $${paramCount}`;
      params.push(department);
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;
    
    if (employeeId && !isHR) {
      countParamCount++;
      countQuery += ` AND lr.employee_id = $${countParamCount}`;
      countParams.push(employeeId);
    }
    if (status) {
      countParamCount++;
      countQuery += ` AND lr.status = $${countParamCount}`;
      countParams.push(status);
    }
    if (leaveType) {
      countParamCount++;
      countQuery += ` AND lr.leave_type = $${countParamCount}`;
      countParams.push(leaveType);
    }
    if (startDate) {
      countParamCount++;
      countQuery += ` AND lr.start_date >= $${countParamCount}`;
      countParams.push(startDate);
    }
    if (endDate) {
      countParamCount++;
      countQuery += ` AND lr.end_date <= $${countParamCount}`;
      countParams.push(endDate);
    }
    if (department && isHR) {
      countParamCount++;
      countQuery += ` AND e.department = $${countParamCount}`;
      countParams.push(department);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      requests: result.rows.map(row => ({
        id: row.id,
        employeeId: row.employee_id,
        employeeName: `${row.first_name} ${row.last_name}`,
        employeeDepartment: row.department,
        leaveType: row.leave_type,
        startDate: row.start_date,
        endDate: row.end_date,
        daysCount: parseFloat(row.days_count),
        reason: row.reason,
        status: row.status,
        approvedBy: row.approved_by,
        approvedByName: row.approved_by_name,
        approvedAt: row.approved_at,
        rejectionReason: row.rejection_reason,
        managerApprovalStatus: row.manager_approval_status,
        managerApprovedBy: row.manager_approved_by,
        managerApprovedByName: row.manager_approved_by_name,
        managerApprovedAt: row.manager_approved_at,
        hrApprovalStatus: row.hr_approval_status,
        hrApprovedBy: row.hr_approved_by,
        hrApprovedByName: row.hr_approved_by_name,
        hrApprovedAt: row.hr_approved_at,
        requiresHrApproval: row.requires_hr_approval,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({error: 'Failed to fetch leave requests'});
  }
});

// Get leave request by ID
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, 
              e.first_name, e.last_name, e.employee_id, e.department,
              u1.name as approved_by_name,
              u2.name as manager_approved_by_name,
              u3.name as hr_approved_by_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN users u1 ON lr.approved_by = u1.id
       LEFT JOIN users u2 ON lr.manager_approved_by = u2.id
       LEFT JOIN users u3 ON lr.hr_approved_by = u3.id
       WHERE lr.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Leave request not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: `${row.first_name} ${row.last_name}`,
      employeeDepartment: row.department,
      leaveType: row.leave_type,
      startDate: row.start_date,
      endDate: row.end_date,
      daysCount: parseFloat(row.days_count),
      reason: row.reason,
      status: row.status,
      approvedBy: row.approved_by,
      approvedByName: row.approved_by_name,
      approvedAt: row.approved_at,
      rejectionReason: row.rejection_reason,
      managerApprovalStatus: row.manager_approval_status,
      managerApprovedBy: row.manager_approved_by,
      managerApprovedByName: row.manager_approved_by_name,
      managerApprovedAt: row.manager_approved_at,
      hrApprovalStatus: row.hr_approval_status,
      hrApprovedBy: row.hr_approved_by,
      hrApprovedByName: row.hr_approved_by_name,
      hrApprovedAt: row.hr_approved_at,
      requiresHrApproval: row.requires_hr_approval,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({error: 'Failed to fetch leave request'});
  }
});

// Create leave request
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const {employeeId, leaveType, startDate, endDate, reason} = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Get employee info
    const empResult = await pool.query(
      'SELECT id, user_id, reporting_manager_id FROM employees WHERE id = $1',
      [employeeId]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({error: 'Employee not found'});
    }

    const employee = empResult.rows[0];

    // Calculate working days (excluding weekends and holidays)
    const daysCount = await calculateWorkingDays(startDate, endDate);

    if (daysCount <= 0) {
      return res.status(400).json({error: 'Invalid date range: no working days in the selected period'});
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balanceResult = await pool.query(
      `SELECT balance, total_allocated FROM leave_balances 
       WHERE employee_id = $1 AND leave_type = $2 AND year = $3`,
      [employeeId, leaveType, currentYear]
    );

    if (leaveType !== 'UNPAID') {
      if (balanceResult.rows.length === 0 || parseFloat(balanceResult.rows[0].balance || 0) < daysCount) {
        return res.status(400).json({error: 'Insufficient leave balance'});
      }
    }

    const requiresHR = requiresHRApproval(leaveType, daysCount);

    // Create leave request
    const result = await pool.query(
      `INSERT INTO leave_requests (
        employee_id, leave_type, start_date, end_date, days_count, reason,
        status, manager_approval_status, hr_approval_status, requires_hr_approval,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'PENDING', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        employeeId,
        leaveType,
        startDate,
        endDate,
        daysCount,
        reason || null,
        requiresHR ? 'PENDING' : 'APPROVED', // If no HR approval needed, manager approval only
        requiresHR,
      ]
    );

    // Update pending balance
    if (leaveType !== 'UNPAID') {
      await pool.query(
        `UPDATE leave_balances 
         SET pending = pending + $1, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
        [daysCount, employeeId, leaveType, currentYear]
      );
    }

    const io = req.app.get('io');
    const leaveRequest = result.rows[0];

    // Notify manager
    if (employee.reporting_manager_id) {
      const managerUserResult = await pool.query(
        'SELECT id FROM users WHERE id IN (SELECT user_id FROM employees WHERE id = $1)',
        [employee.reporting_manager_id]
      );
      if (managerUserResult.rows.length > 0) {
        await sendNotification(
          io,
          managerUserResult.rows[0].id,
          'New Leave Request',
          `Leave request from ${employeeId} requires your approval`,
          'LEAVE_REQUEST',
          leaveRequest.id
        );
      }
    }

    // Notify HR if required
    if (requiresHR) {
      const hrUsersResult = await pool.query(
        "SELECT id FROM users WHERE role IN ('HR_ADMIN', 'HR_MANAGER') LIMIT 5"
      );
      for (const hrUser of hrUsersResult.rows) {
        await sendNotification(
          io,
          hrUser.id,
          'New Leave Request (HR Approval Required)',
          `Leave request from ${employeeId} requires HR approval`,
          'LEAVE_REQUEST',
          leaveRequest.id
        );
      }
    }

    res.status(201).json({
      id: leaveRequest.id,
      employeeId: leaveRequest.employee_id,
      leaveType: leaveRequest.leave_type,
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      daysCount: parseFloat(leaveRequest.days_count),
      reason: leaveRequest.reason,
      status: leaveRequest.status,
      managerApprovalStatus: leaveRequest.manager_approval_status,
      hrApprovalStatus: leaveRequest.hr_approval_status,
      requiresHrApproval: leaveRequest.requires_hr_approval,
      createdAt: leaveRequest.created_at,
      updatedAt: leaveRequest.updated_at,
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({error: 'Failed to create leave request'});
  }
});

// Approve/Reject leave request (Manager or HR)
router.put('/requests/:id/approve', authenticateToken, async (req, res) => {
  try {
    const {action, rejectionReason, approvalLevel} = req.body; // action: 'APPROVE' or 'REJECT', approvalLevel: 'MANAGER' or 'HR'

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({error: 'Invalid action'});
    }

    if (!approvalLevel || !['MANAGER', 'HR'].includes(approvalLevel)) {
      return res.status(400).json({error: 'Invalid approval level'});
    }

    // Get leave request
    const requestResult = await pool.query(
      `SELECT lr.*, e.user_id as employee_user_id, e.reporting_manager_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = $1`,
      [req.params.id]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({error: 'Leave request not found'});
    }

    const request = requestResult.rows[0];
    const io = req.app.get('io');

    // Check user permissions
    const userResult = await pool.query(
      'SELECT role, id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }

    const user = userResult.rows[0];
    const isHR = ['HR_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(user.role);

    if (approvalLevel === 'MANAGER') {
      // Manager approval
      if (!isHR && request.reporting_manager_id) {
        // Verify user is the manager
        const managerUserResult = await pool.query(
          'SELECT id FROM users WHERE id IN (SELECT user_id FROM employees WHERE id = $1)',
          [request.reporting_manager_id]
        );
        if (managerUserResult.rows.length === 0 || managerUserResult.rows[0].id !== req.user.id) {
          return res.status(403).json({error: 'Unauthorized: You are not the reporting manager'});
        }
      }

      if (action === 'APPROVE') {
        if (request.requires_hr_approval) {
          // Still need HR approval
          await pool.query(
            `UPDATE leave_requests 
             SET manager_approval_status = 'APPROVED', 
                 manager_approved_by = $1, 
                 manager_approved_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [req.user.id, req.params.id]
          );
        } else {
          // Final approval
          await pool.query(
            `UPDATE leave_requests 
             SET status = 'APPROVED',
                 manager_approval_status = 'APPROVED',
                 manager_approved_by = $1,
                 manager_approved_at = CURRENT_TIMESTAMP,
                 approved_by = $1,
                 approved_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [req.user.id, req.params.id]
          );

          // Update leave balance
          if (request.leave_type !== 'UNPAID') {
            const currentYear = new Date().getFullYear();
            await pool.query(
              `UPDATE leave_balances 
               SET used = used + $1, pending = pending - $1, updated_at = CURRENT_TIMESTAMP
               WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
              [request.days_count, request.employee_id, request.leave_type, currentYear]
            );
          }
        }
      } else {
        // Reject
        await pool.query(
          `UPDATE leave_requests 
           SET status = 'REJECTED',
               manager_approval_status = 'REJECTED',
               rejection_reason = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [rejectionReason || null, req.params.id]
        );

        // Restore pending balance
        if (request.leave_type !== 'UNPAID') {
          const currentYear = new Date().getFullYear();
          await pool.query(
            `UPDATE leave_balances 
             SET pending = pending - $1, updated_at = CURRENT_TIMESTAMP
             WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
            [request.days_count, request.employee_id, request.leave_type, currentYear]
          );
        }
      }
    } else if (approvalLevel === 'HR') {
      // HR approval
      if (!isHR) {
        return res.status(403).json({error: 'Unauthorized: Only HR staff can approve at HR level'});
      }

      if (!request.requires_hr_approval) {
        return res.status(400).json({error: 'This leave request does not require HR approval'});
      }

      if (action === 'APPROVE') {
        // Check if manager already approved
        if (request.manager_approval_status !== 'APPROVED') {
          return res.status(400).json({error: 'Manager approval is required before HR approval'});
        }

        // Final approval
        await pool.query(
          `UPDATE leave_requests 
           SET status = 'APPROVED',
               hr_approval_status = 'APPROVED',
               hr_approved_by = $1,
               hr_approved_at = CURRENT_TIMESTAMP,
               approved_by = $1,
               approved_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [req.user.id, req.params.id]
        );

        // Update leave balance
        if (request.leave_type !== 'UNPAID') {
          const currentYear = new Date().getFullYear();
          await pool.query(
            `UPDATE leave_balances 
             SET used = used + $1, pending = pending - $1, updated_at = CURRENT_TIMESTAMP
             WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
            [request.days_count, request.employee_id, request.leave_type, currentYear]
          );
        }
      } else {
        // Reject
        await pool.query(
          `UPDATE leave_requests 
           SET status = 'REJECTED',
               hr_approval_status = 'REJECTED',
               rejection_reason = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [rejectionReason || null, req.params.id]
        );

        // Restore pending balance
        if (request.leave_type !== 'UNPAID') {
          const currentYear = new Date().getFullYear();
          await pool.query(
            `UPDATE leave_balances 
             SET pending = pending - $1, updated_at = CURRENT_TIMESTAMP
             WHERE employee_id = $2 AND leave_type = $3 AND year = $4`,
            [request.days_count, request.employee_id, request.leave_type, currentYear]
          );
        }
      }
    }

    // Get updated request
    const updatedResult = await pool.query(
      `SELECT lr.*, e.user_id as employee_user_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = $1`,
      [req.params.id]
    );

    const updatedRequest = updatedResult.rows[0];

    // Notify employee
    if (request.employee_user_id) {
      const statusText = action === 'APPROVE' ? 'approved' : 'rejected';
      await sendNotification(
        io,
        request.employee_user_id,
        `Leave Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        `Your leave request has been ${statusText}`,
        'LEAVE_REQUEST',
        req.params.id
      );
    }

    res.json({
      id: updatedRequest.id,
      status: updatedRequest.status,
      managerApprovalStatus: updatedRequest.manager_approval_status,
      hrApprovalStatus: updatedRequest.hr_approval_status,
      rejectionReason: updatedRequest.rejection_reason,
      updatedAt: updatedRequest.updated_at,
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({error: 'Failed to update leave request'});
  }
});

// Get leave balance for employee
router.get('/balances/:employeeId', authenticateToken, async (req, res) => {
  try {
    const {year} = req.query;
    const queryYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT lb.*, lp.yearly_allocation, lp.max_carry_forward
       FROM leave_balances lb
       LEFT JOIN leave_policies lp ON lb.leave_type = lp.leave_type
       WHERE lb.employee_id = $1 AND lb.year = $2`,
      [req.params.employeeId, queryYear]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      leaveType: row.leave_type,
      totalAllocated: parseFloat(row.total_allocated || 0),
      used: parseFloat(row.used || 0),
      pending: parseFloat(row.pending || 0),
      balance: parseFloat(row.balance || 0),
      carryForward: parseFloat(row.carry_forward || 0),
      accrued: parseFloat(row.accrued || 0),
      year: row.year,
      yearlyAllocation: row.yearly_allocation ? parseFloat(row.yearly_allocation) : null,
      maxCarryForward: row.max_carry_forward ? parseFloat(row.max_carry_forward) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({error: 'Failed to fetch leave balances'});
  }
});

// Update leave balance (HR only)
router.post('/balances', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }
    
    const userRole = userResult.rows[0].role;
    if (!['HR_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole)) {
      return res.status(403).json({error: 'Unauthorized: Only HR staff can update leave balances'});
    }

    const {employeeId, leaveType, totalAllocated, year} = req.body;

    if (!employeeId || !leaveType) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const queryYear = year || new Date().getFullYear();

    const result = await pool.query(
      `INSERT INTO leave_balances (employee_id, leave_type, total_allocated, year, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (employee_id, leave_type, year)
       DO UPDATE SET total_allocated = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [employeeId, leaveType, totalAllocated || 0, queryYear]
    );

    res.json({
      id: result.rows[0].id,
      employeeId: result.rows[0].employee_id,
      leaveType: result.rows[0].leave_type,
      totalAllocated: parseFloat(result.rows[0].total_allocated),
      used: parseFloat(result.rows[0].used || 0),
      pending: parseFloat(result.rows[0].pending || 0),
      balance: parseFloat(result.rows[0].balance || 0),
      year: result.rows[0].year,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({error: 'Failed to update leave balance'});
  }
});

// Get leave statistics (HR Dashboard)
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({error: 'User not found'});
    }
    
    const userRole = userResult.rows[0].role;
    if (!['HR_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole)) {
      return res.status(403).json({error: 'Unauthorized: Only HR staff can view statistics'});
    }

    const {department, year} = req.query;
    const queryYear = year || new Date().getFullYear();

    // Pending approvals count
    let pendingQuery = `SELECT COUNT(*) as count FROM leave_requests lr
                        JOIN employees e ON lr.employee_id = e.id
                        WHERE lr.status = 'PENDING'`;
    const pendingParams = [];
    if (department) {
      pendingQuery += ' AND e.department = $1';
      pendingParams.push(department);
    }
    const pendingResult = await pool.query(pendingQuery, pendingParams);

    // Leave by type
    let typeQuery = `SELECT leave_type, COUNT(*) as count, SUM(days_count) as total_days
                     FROM leave_requests lr
                     JOIN employees e ON lr.employee_id = e.id
                     WHERE EXTRACT(YEAR FROM lr.start_date) = $1`;
    const typeParams = [queryYear];
    if (department) {
      typeQuery += ' AND e.department = $2';
      typeParams.push(department);
    }
    typeQuery += ' GROUP BY leave_type';
    const typeResult = await pool.query(typeQuery, typeParams);

    // Leave by status
    let statusQuery = `SELECT status, COUNT(*) as count
                       FROM leave_requests lr
                       JOIN employees e ON lr.employee_id = e.id
                       WHERE EXTRACT(YEAR FROM lr.start_date) = $1`;
    const statusParams = [queryYear];
    if (department) {
      statusQuery += ' AND e.department = $2';
      statusParams.push(department);
    }
    statusQuery += ' GROUP BY status';
    const statusResult = await pool.query(statusQuery, statusParams);

    res.json({
      pendingApprovals: parseInt(pendingResult.rows[0].count),
      byType: typeResult.rows.map(row => ({
        leaveType: row.leave_type,
        count: parseInt(row.count),
        totalDays: parseFloat(row.total_days),
      })),
      byStatus: statusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({error: 'Failed to fetch leave statistics'});
  }
});

module.exports = router;
