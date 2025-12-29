const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let stats = {};

    if (userRole === 'STUDENT') {
      // Student dashboard
      const [attendanceResult, assignmentResult, examResult] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as total, 
           COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present
           FROM attendance WHERE student_id = $1`,
          [userId]
        ),
        pool.query(
          `SELECT COUNT(*) as total,
           COUNT(CASE WHEN status = 'SUBMITTED' OR status = 'GRADED' THEN 1 END) as submitted
           FROM assignment_submissions WHERE student_id = $1`,
          [userId]
        ),
        pool.query(
          `SELECT COUNT(*) as total FROM exam_results WHERE student_id = $1`,
          [userId]
        ),
      ]);

      stats = {
        attendance: {
          total: parseInt(attendanceResult.rows[0].total),
          present: parseInt(attendanceResult.rows[0].present),
          percentage: attendanceResult.rows[0].total > 0
            ? Math.round((attendanceResult.rows[0].present / attendanceResult.rows[0].total) * 100)
            : 0,
        },
        assignments: {
          total: parseInt(assignmentResult.rows[0].total),
          submitted: parseInt(assignmentResult.rows[0].submitted),
        },
        exams: {
          total: parseInt(examResult.rows[0].total),
        },
      };
    } else if (userRole === 'FACULTY') {
      // Faculty dashboard
      const [courseResult, studentResult, assignmentResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM courses WHERE faculty_id = $1', [userId]),
        pool.query(
          `SELECT COUNT(DISTINCT ce.student_id) as total 
           FROM course_enrollments ce
           JOIN courses c ON ce.course_id = c.id
           WHERE c.faculty_id = $1`,
          [userId]
        ),
        pool.query('SELECT COUNT(*) as total FROM assignments WHERE faculty_id = $1', [userId]),
      ]);

      stats = {
        courses: parseInt(courseResult.rows[0].total),
        students: parseInt(studentResult.rows[0].total),
        assignments: parseInt(assignmentResult.rows[0].total),
      };
    } else if (userRole === 'ADMIN') {
      // Admin dashboard
      const [userResult, courseResult, attendanceResult] = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM users'),
        pool.query('SELECT COUNT(*) as total FROM courses'),
        pool.query('SELECT COUNT(*) as total FROM attendance'),
      ]);

      stats = {
        users: parseInt(userResult.rows[0].total),
        courses: parseInt(courseResult.rows[0].total),
        attendanceRecords: parseInt(attendanceResult.rows[0].total),
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({error: 'Failed to fetch dashboard stats'});
  }
});

module.exports = router;

