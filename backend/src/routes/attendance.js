const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Mark attendance (faculty only)
router.post('/mark', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {studentId, courseId, status, remarks, location} = req.body;
    const facultyId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get student and course details
    const [studentResult, courseResult] = await Promise.all([
      pool.query('SELECT name FROM users WHERE id = $1', [studentId]),
      pool.query('SELECT name, code FROM courses WHERE id = $1', [courseId]),
    ]);

    if (studentResult.rows.length === 0 || courseResult.rows.length === 0) {
      return res.status(404).json({error: 'Student or course not found'});
    }

    const studentName = studentResult.rows[0].name;
    const courseName = courseResult.rows[0].name;
    const courseCode = courseResult.rows[0].code;

    // Check if attendance already marked
    const existingResult = await pool.query(
      'SELECT id FROM attendance WHERE student_id = $1 AND course_id = $2 AND date = $3',
      [studentId, courseId, today]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE attendance SET status = $1, marked_at = CURRENT_TIMESTAMP, marked_by = $2, 
         remarks = $3, location_latitude = $4, location_longitude = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          status,
          facultyId,
          remarks || null,
          location?.latitude || null,
          location?.longitude || null,
          existingResult.rows[0].id,
        ]
      );

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('attendance-updated', {
          studentId,
          courseId,
          status,
          date: today,
        });
      }

      return res.json({id: existingResult.rows[0].id, message: 'Attendance updated'});
    }

    // Create new record
    const result = await pool.query(
      `INSERT INTO attendance (student_id, course_id, date, status, marked_at, marked_by, remarks, 
       location_latitude, location_longitude, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [
        studentId,
        courseId,
        today,
        status,
        facultyId,
        remarks || null,
        location?.latitude || null,
        location?.longitude || null,
      ]
    );

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance-updated', {
        studentId,
        courseId,
        status,
        date: today,
      });
    }

    res.status(201).json({id: result.rows[0].id, message: 'Attendance marked'});
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({error: 'Failed to mark attendance'});
  }
});

// Mark bulk attendance
router.post('/mark-bulk', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {records, courseId} = req.body;
    const facultyId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    for (const record of records) {
      const {studentId, status} = record;

      const existingResult = await pool.query(
        'SELECT id FROM attendance WHERE student_id = $1 AND course_id = $2 AND date = $3',
        [studentId, courseId, today]
      );

      if (existingResult.rows.length > 0) {
        await pool.query(
          'UPDATE attendance SET status = $1, marked_at = CURRENT_TIMESTAMP, marked_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [status, facultyId, existingResult.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO attendance (student_id, course_id, date, status, marked_at, marked_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [studentId, courseId, today, status, facultyId]
        );
      }
    }

    // Emit bulk update
    const io = req.app.get('io');
    if (io) {
      io.emit('attendance-bulk-updated', {courseId, date: today});
    }

    res.json({message: 'Bulk attendance marked successfully'});
  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({error: 'Failed to mark bulk attendance'});
  }
});

// Get student attendance
router.get('/student/:studentId', async (req, res) => {
  try {
    const {studentId} = req.params;
    const {courseId, startDate, endDate} = req.query;

    // Users can only view their own attendance unless they're admin/faculty
    if (req.user.id !== studentId && !['ADMIN', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({error: 'Access denied'});
    }

    let query = `
      SELECT a.*, u.name as student_name, c.name as course_name, c.code as course_code,
             f.name as faculty_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users f ON a.marked_by = f.id
      WHERE a.student_id = $1
    `;
    const params = [studentId];
    let paramCount = 2;

    if (courseId) {
      query += ` AND a.course_id = $${paramCount++}`;
      params.push(courseId);
    }
    if (startDate) {
      query += ` AND a.date >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND a.date <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ' ORDER BY a.date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      facultyId: row.marked_by,
      facultyName: row.faculty_name,
      date: row.date,
      status: row.status,
      markedAt: row.marked_at,
      markedBy: row.marked_by,
      remarks: row.remarks,
      location: row.location_latitude && row.location_longitude ? {
        latitude: parseFloat(row.location_latitude),
        longitude: parseFloat(row.location_longitude),
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({error: 'Failed to fetch attendance'});
  }
});

// Get course attendance (faculty view)
router.get('/course/:courseId', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {courseId} = req.params;
    const {date} = req.query;

    let query = `
      SELECT a.*, u.name as student_name, c.name as course_name, c.code as course_code,
             f.name as faculty_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users f ON a.marked_by = f.id
      WHERE a.course_id = $1
    `;
    const params = [courseId];
    let paramCount = 2;

    if (date) {
      query += ` AND a.date = $${paramCount++}`;
      params.push(date);
    }

    query += ' ORDER BY a.date DESC, u.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      facultyId: row.marked_by,
      facultyName: row.faculty_name,
      date: row.date,
      status: row.status,
      markedAt: row.marked_at,
      markedBy: row.marked_by,
      remarks: row.remarks,
      location: row.location_latitude && row.location_longitude ? {
        latitude: parseFloat(row.location_latitude),
        longitude: parseFloat(row.location_longitude),
      } : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({error: 'Failed to fetch attendance'});
  }
});

// Get attendance summary
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const {studentId} = req.params;
    const {courseId} = req.query;

    if (req.user.id !== studentId && !['ADMIN', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({error: 'Access denied'});
    }

    let query = `
      SELECT a.course_id, c.name as course_name,
             COUNT(*) as total_classes,
             COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present,
             COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent,
             COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late,
             COUNT(CASE WHEN a.status = 'EXCUSED' THEN 1 END) as excused,
             MAX(a.updated_at) as last_updated
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1
    `;
    const params = [studentId];

    if (courseId) {
      query += ' AND a.course_id = $2';
      params.push(courseId);
    }

    query += ' GROUP BY a.course_id, c.name';

    const result = await pool.query(query, params);
    const summaries = result.rows.map(row => {
      const total = parseInt(row.total_classes);
      const attended = parseInt(row.present) + parseInt(row.late) + parseInt(row.excused);
      return {
        studentId,
        courseId: row.course_id,
        courseName: row.course_name,
        totalClasses: total,
        present: parseInt(row.present),
        absent: parseInt(row.absent),
        late: parseInt(row.late),
        excused: parseInt(row.excused),
        attendancePercentage: total > 0 ? Math.round((attended / total) * 100) : 0,
        lastUpdated: row.last_updated,
      };
    });

    res.json(summaries);
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({error: 'Failed to fetch attendance summary'});
  }
});

module.exports = router;

