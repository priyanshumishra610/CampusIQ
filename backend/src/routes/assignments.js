const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create assignment (faculty)
router.post('/', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, courseId, dueDate, maxMarks, attachments, rubric} = req.body;
    const facultyId = req.user.id;

    // Get course details
    const courseResult = await pool.query('SELECT name, code FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({error: 'Course not found'});
    }

    const courseName = courseResult.rows[0].name;
    const courseCode = courseResult.rows[0].code;

    const result = await pool.query(
      `INSERT INTO assignments (title, description, course_id, faculty_id, due_date, max_marks, 
       status, attachments, rubric, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, description, courseId, facultyId, new Date(dueDate), maxMarks, attachments || [], rubric || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Assignment created'});
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({error: 'Failed to create assignment'});
  }
});

// Publish assignment
router.post('/:id/publish', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE assignments SET status = $1, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['PUBLISHED', req.params.id]
    );
    res.json({message: 'Assignment published'});
  } catch (error) {
    console.error('Publish assignment error:', error);
    res.status(500).json({error: 'Failed to publish assignment'});
  }
});

// Get assignments for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const {courseId} = req.params;
    const {status} = req.query;

    let query = `
      SELECT a.*, c.name as course_name, c.code as course_code, u.name as faculty_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.faculty_id = u.id
      WHERE a.course_id = $1
    `;
    const params = [courseId];
    let paramCount = 2;

    if (status) {
      query += ` AND a.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY a.due_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      dueDate: row.due_date,
      maxMarks: row.max_marks,
      status: row.status,
      attachments: row.attachments || [],
      rubric: row.rubric,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    })));
  } catch (error) {
    console.error('Get course assignments error:', error);
    res.status(500).json({error: 'Failed to fetch assignments'});
  }
});

// Get student assignments
router.get('/student/:studentId', async (req, res) => {
  try {
    const {studentId} = req.params;
    const {courseId} = req.query;

    if (req.user.id !== studentId && !['ADMIN', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({error: 'Access denied'});
    }

    // Get enrolled courses
    let enrolledQuery = 'SELECT course_id FROM course_enrollments WHERE student_id = $1';
    const enrolledParams = [studentId];
    if (courseId) {
      enrolledQuery += ' AND course_id = $2';
      enrolledParams.push(courseId);
    }

    const enrolledResult = await pool.query(enrolledQuery, enrolledParams);
    const courseIds = enrolledResult.rows.map(row => row.course_id);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT a.*, c.name as course_name, c.code as course_code, u.name as faculty_name
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.faculty_id = u.id
       WHERE a.course_id = ANY($1) AND a.status = 'PUBLISHED'
       ORDER BY a.due_date ASC`,
      [courseIds]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      dueDate: row.due_date,
      maxMarks: row.max_marks,
      status: row.status,
      attachments: row.attachments || [],
      rubric: row.rubric,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    })));
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({error: 'Failed to fetch assignments'});
  }
});

// Get assignment by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name as course_name, c.code as course_code, u.name as faculty_name
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       LEFT JOIN users u ON a.faculty_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Assignment not found'});
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      description: row.description,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      dueDate: row.due_date,
      maxMarks: row.max_marks,
      status: row.status,
      attachments: row.attachments || [],
      rubric: row.rubric,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({error: 'Failed to fetch assignment'});
  }
});

// Submit assignment (student)
router.post('/:id/submit', authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const {id} = req.params;
    const {content, attachments} = req.body;
    const studentId = req.user.id;

    // Get assignment
    const assignmentResult = await pool.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({error: 'Assignment not found'});
    }

    const assignment = assignmentResult.rows[0];
    const now = new Date();
    const isLate = now > new Date(assignment.due_date);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    // Get student details
    const studentResult = await pool.query('SELECT name, enrollment_number FROM users WHERE id = $1', [studentId]);
    const studentName = studentResult.rows[0].name;
    const enrollmentNumber = studentResult.rows[0].enrollment_number;

    // Check if already submitted
    const existingResult = await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2',
      [id, studentId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE assignment_submissions SET content = $1, attachments = $2, status = $3, 
         submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [content, attachments || [], status, existingResult.rows[0].id]
      );
      return res.json({id: existingResult.rows[0].id, message: 'Submission updated'});
    }

    // Create new submission
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, content, attachments, status, 
       submitted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [id, studentId, content, attachments || [], status]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Assignment submitted'});
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({error: 'Failed to submit assignment'});
  }
});

// Get submission
router.get('/:id/submission', async (req, res) => {
  try {
    const {id} = req.params;
    const studentId = req.user.role === 'STUDENT' ? req.user.id : req.query.studentId;

    if (!studentId) {
      return res.status(400).json({error: 'Student ID required'});
    }

    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.enrollment_number
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [id, studentId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      assignmentId: row.assignment_id,
      studentId: row.student_id,
      studentName: row.student_name,
      enrollmentNumber: row.enrollment_number,
      content: row.content,
      attachments: row.attachments || [],
      status: row.status,
      submittedAt: row.submitted_at,
      gradedAt: row.graded_at,
      marksObtained: row.marks_obtained,
      feedback: row.feedback,
      gradedBy: row.graded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({error: 'Failed to fetch submission'});
  }
});

// Get all submissions for an assignment (faculty)
router.get('/:id/submissions', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as student_name, u.enrollment_number
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC`,
      [req.params.id]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      assignmentId: row.assignment_id,
      studentId: row.student_id,
      studentName: row.student_name,
      enrollmentNumber: row.enrollment_number,
      content: row.content,
      attachments: row.attachments || [],
      status: row.status,
      submittedAt: row.submitted_at,
      gradedAt: row.graded_at,
      marksObtained: row.marks_obtained,
      feedback: row.feedback,
      gradedBy: row.graded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({error: 'Failed to fetch submissions'});
  }
});

// Grade submission (faculty)
router.post('/submissions/:id/grade', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {marksObtained, feedback} = req.body;
    const gradedBy = req.user.id;

    // Get submission and assignment
    const submissionResult = await pool.query(
      'SELECT * FROM assignment_submissions WHERE id = $1',
      [req.params.id]
    );
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({error: 'Submission not found'});
    }

    const assignmentResult = await pool.query(
      'SELECT max_marks FROM assignments WHERE id = $1',
      [submissionResult.rows[0].assignment_id]
    );

    if (marksObtained > assignmentResult.rows[0].max_marks) {
      return res.status(400).json({error: 'Marks cannot exceed maximum marks'});
    }

    await pool.query(
      `UPDATE assignment_submissions SET marks_obtained = $1, feedback = $2, graded_by = $3, 
       status = 'GRADED', graded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [marksObtained, feedback, gradedBy, req.params.id]
    );

    res.json({message: 'Submission graded'});
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({error: 'Failed to grade submission'});
  }
});

// Update assignment
router.put('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, dueDate, maxMarks, attachments, rubric} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(new Date(dueDate));
    }
    if (maxMarks !== undefined) {
      updates.push(`max_marks = $${paramCount++}`);
      values.push(maxMarks);
    }
    if (attachments !== undefined) {
      updates.push(`attachments = $${paramCount++}`);
      values.push(attachments);
    }
    if (rubric !== undefined) {
      updates.push(`rubric = $${paramCount++}`);
      values.push(rubric);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE assignments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Assignment updated'});
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({error: 'Failed to update assignment'});
  }
});

// Delete assignment
router.delete('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    // Delete submissions first
    await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = $1', [req.params.id]);
    // Delete assignment
    await pool.query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    res.json({message: 'Assignment deleted'});
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({error: 'Failed to delete assignment'});
  }
});

module.exports = router;

