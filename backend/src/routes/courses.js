const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Get courses
router.get('/', async (req, res) => {
  try {
    const {facultyId, department} = req.query;
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (facultyId) {
      query += ` AND faculty_id = $${paramCount++}`;
      params.push(facultyId);
    }
    if (department) {
      query += ` AND department = $${paramCount++}`;
      params.push(department);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      facultyId: row.faculty_id,
      department: row.department,
      credits: row.credits,
      semester: row.semester,
      academicYear: row.academic_year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({error: 'Failed to fetch courses'});
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Course not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      facultyId: row.faculty_id,
      department: row.department,
      credits: row.credits,
      semester: row.semester,
      academicYear: row.academic_year,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({error: 'Failed to fetch course'});
  }
});

// Get enrolled students for a course
router.get('/:id/students', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.enrollment_number, u.student_id
       FROM course_enrollments ce
       JOIN users u ON ce.student_id = u.id
       WHERE ce.course_id = $1
       ORDER BY u.name ASC`,
      [req.params.id]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      enrollmentNumber: row.enrollment_number,
      studentId: row.student_id,
    })));
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({error: 'Failed to fetch course students'});
  }
});

// Create course
router.post('/', authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const {code, name, description, facultyId, department, credits, semester, academicYear} = req.body;

    const result = await pool.query(
      `INSERT INTO courses (code, name, description, faculty_id, department, credits, semester, academic_year, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [code, name, description || null, facultyId || null, department || null, credits || null, semester || null, academicYear || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Course created'});
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({error: 'Failed to create course'});
  }
});

// Enroll student in course
router.post('/:id/enroll', authorizeRoles('ADMIN', 'FACULTY'), async (req, res) => {
  try {
    const {studentId} = req.body;

    await pool.query(
      'INSERT INTO course_enrollments (student_id, course_id, enrolled_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING',
      [studentId, req.params.id]
    );

    res.json({message: 'Student enrolled'});
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({error: 'Failed to enroll student'});
  }
});

module.exports = router;

