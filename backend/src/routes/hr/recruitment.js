const express = require('express');
const pool = require('../../database/connection');
const {authenticateToken} = require('../../middleware/auth');

const router = express.Router();

// Get all job postings
router.get('/postings', authenticateToken, async (req, res) => {
  try {
    const {status, department, page = 1, limit = 20} = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM job_postings WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(department);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM job_postings');
    
    res.json({
      postings: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    res.status(500).json({error: 'Failed to fetch job postings'});
  }
});

// Get job posting by ID
router.get('/postings/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM job_postings WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Job posting not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job posting:', error);
    res.status(500).json({error: 'Failed to fetch job posting'});
  }
});

// Create job posting
router.post('/postings', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      department,
      description,
      requirements,
      responsibilities,
      employmentType,
      location,
      salaryRangeMin,
      salaryRangeMax,
      closingDate,
    } = req.body;

    if (!title || !department || !description) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO job_postings (
        title, department, description, requirements, responsibilities,
        employment_type, location, salary_range_min, salary_range_max,
        closing_date, posted_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        title,
        department,
        description,
        requirements || [],
        responsibilities || [],
        employmentType || 'FULL_TIME',
        location || null,
        salaryRangeMin || null,
        salaryRangeMax || null,
        closingDate || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({error: 'Failed to create job posting'});
  }
});

// Update job posting
router.put('/postings/:id', authenticateToken, async (req, res) => {
  try {
    const updates = [];
    const params = [];
    let paramCount = 0;

    Object.keys(req.body).forEach(key => {
      if (key !== 'id') {
        paramCount++;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = $${paramCount}`);
        params.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE job_postings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Job posting not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({error: 'Failed to update job posting'});
  }
});

// Get applications for a job posting
router.get('/postings/:id/applications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM job_applications WHERE job_posting_id = $1 ORDER BY applied_at DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({error: 'Failed to fetch applications'});
  }
});

// Create job application
router.post('/applications', authenticateToken, async (req, res) => {
  try {
    const {jobPostingId, candidateName, candidateEmail, candidatePhone, resumeUrl, coverLetter} = req.body;

    if (!jobPostingId || !candidateName || !candidateEmail) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    const result = await pool.query(
      `INSERT INTO job_applications (
        job_posting_id, candidate_name, candidate_email, candidate_phone,
        resume_url, cover_letter, applied_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [jobPostingId, candidateName, candidateEmail, candidatePhone || null, resumeUrl || null, coverLetter || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({error: 'Failed to create application'});
  }
});

// Update application status
router.put('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const {status, interviewScheduledAt, interviewNotes} = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
      
      if (status === 'SHORTLISTED') {
        paramCount++;
        updates.push(`shortlisted_at = CURRENT_TIMESTAMP, shortlisted_by = $${paramCount}`);
        params.push(req.user.id);
      }
    }

    if (interviewScheduledAt) {
      paramCount++;
      updates.push(`interview_scheduled_at = $${paramCount}`);
      params.push(interviewScheduledAt);
    }

    if (interviewNotes) {
      paramCount++;
      updates.push(`interview_notes = $${paramCount}`);
      params.push(interviewNotes);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    paramCount++;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE job_applications SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Application not found'});
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({error: 'Failed to update application'});
  }
});

module.exports = router;

