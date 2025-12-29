const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create exam
router.post('/', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, courseId, examDate, durationMinutes, maxMarks, venue, instructions} = req.body;
    const facultyId = req.user.id;

    const result = await pool.query(
      `INSERT INTO exams (title, description, course_id, faculty_id, exam_date, duration_minutes, 
       max_marks, venue, instructions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, description, courseId, facultyId, new Date(examDate), durationMinutes, maxMarks, venue || null, instructions || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Exam created'});
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({error: 'Failed to create exam'});
  }
});

// Get exams for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name as course_name, c.code as course_code, u.name as faculty_name
       FROM exams e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON e.faculty_id = u.id
       WHERE e.course_id = $1
       ORDER BY e.exam_date DESC`,
      [req.params.courseId]
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
      examDate: row.exam_date,
      durationMinutes: row.duration_minutes,
      maxMarks: row.max_marks,
      venue: row.venue,
      instructions: row.instructions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({error: 'Failed to fetch exams'});
  }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name as course_name, c.code as course_code, u.name as faculty_name
       FROM exams e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON e.faculty_id = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Exam not found'});
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
      examDate: row.exam_date,
      durationMinutes: row.duration_minutes,
      maxMarks: row.max_marks,
      venue: row.venue,
      instructions: row.instructions,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({error: 'Failed to fetch exam'});
  }
});

// Get exam results
router.get('/:id/results', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, u.name as student_name, u.enrollment_number
       FROM exam_results er
       JOIN users u ON er.student_id = u.id
       WHERE er.exam_id = $1
       ORDER BY er.marks_obtained DESC NULLS LAST`,
      [req.params.id]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      examId: row.exam_id,
      studentId: row.student_id,
      studentName: row.student_name,
      enrollmentNumber: row.enrollment_number,
      marksObtained: row.marks_obtained,
      grade: row.grade,
      remarks: row.remarks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({error: 'Failed to fetch exam results'});
  }
});

// Submit exam results
router.post('/:id/results', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {results} = req.body; // Array of {studentId, marksObtained, grade, remarks}

    for (const result of results) {
      const existingResult = await pool.query(
        'SELECT id FROM exam_results WHERE exam_id = $1 AND student_id = $2',
        [req.params.id, result.studentId]
      );

      if (existingResult.rows.length > 0) {
        await pool.query(
          `UPDATE exam_results SET marks_obtained = $1, grade = $2, remarks = $3, 
           updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
          [result.marksObtained, result.grade || null, result.remarks || null, existingResult.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [req.params.id, result.studentId, result.marksObtained, result.grade || null, result.remarks || null]
        );
      }
    }

    res.json({message: 'Exam results submitted'});
  } catch (error) {
    console.error('Submit exam results error:', error);
    res.status(500).json({error: 'Failed to submit exam results'});
  }
});

// Update exam
router.put('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, examDate, durationMinutes, maxMarks, venue, instructions} = req.body;
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
    if (examDate !== undefined) {
      updates.push(`exam_date = $${paramCount++}`);
      values.push(new Date(examDate));
    }
    if (durationMinutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(durationMinutes);
    }
    if (maxMarks !== undefined) {
      updates.push(`max_marks = $${paramCount++}`);
      values.push(maxMarks);
    }
    if (venue !== undefined) {
      updates.push(`venue = $${paramCount++}`);
      values.push(venue);
    }
    if (instructions !== undefined) {
      updates.push(`instructions = $${paramCount++}`);
      values.push(instructions);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE exams SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Exam updated'});
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({error: 'Failed to update exam'});
  }
});

// Delete exam
router.delete('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM exam_results WHERE exam_id = $1', [req.params.id]);
    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({message: 'Exam deleted'});
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({error: 'Failed to delete exam'});
  }
});

module.exports = router;

