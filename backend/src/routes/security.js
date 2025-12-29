const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Create SOS alert
router.post('/sos', async (req, res) => {
  try {
    const {latitude, longitude, message} = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO sos_alerts (user_id, latitude, longitude, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, latitude, longitude, message || null]
    );

    // Emit real-time SOS alert
    const io = req.app.get('io');
    if (io) {
      io.to('role-SECURITY').emit('sos-alert', {
        id: result.rows[0].id,
        userId,
        latitude,
        longitude,
        message,
        status: 'ACTIVE',
      });
      io.to('role-ADMIN').emit('sos-alert', {
        id: result.rows[0].id,
        userId,
        latitude,
        longitude,
        message,
        status: 'ACTIVE',
      });
    }

    res.status(201).json({id: result.rows[0].id, message: 'SOS alert created'});
  } catch (error) {
    console.error('Create SOS alert error:', error);
    res.status(500).json({error: 'Failed to create SOS alert'});
  }
});

// Get SOS alerts
router.get('/sos', authorizeRoles('SECURITY', 'ADMIN'), async (req, res) => {
  try {
    const {status} = req.query;
    let query = `
      SELECT s.*, u.name as user_name, u.phone_number
      FROM sos_alerts s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND s.status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      phoneNumber: row.phone_number,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      message: row.message,
      status: row.status,
      respondedBy: row.responded_by,
      responseNotes: row.response_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get SOS alerts error:', error);
    res.status(500).json({error: 'Failed to fetch SOS alerts'});
  }
});

// Respond to SOS alert
router.put('/sos/:id/respond', authorizeRoles('SECURITY', 'ADMIN'), async (req, res) => {
  try {
    const {responseNotes, status} = req.body;
    const respondedBy = req.user.id;

    await pool.query(
      `UPDATE sos_alerts SET responded_by = $1, response_notes = $2, status = $3, 
       updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [respondedBy, responseNotes || null, status || 'RESOLVED', req.params.id]
    );

    res.json({message: 'SOS alert responded to'});
  } catch (error) {
    console.error('Respond to SOS error:', error);
    res.status(500).json({error: 'Failed to respond to SOS alert'});
  }
});

// Create security incident
router.post('/incidents', authorizeRoles('SECURITY', 'ADMIN'), async (req, res) => {
  try {
    const {title, description, location, latitude, longitude, severity} = req.body;
    const reportedBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO security_incidents (reported_by, title, description, location, latitude, longitude, 
       severity, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [reportedBy, title, description, location || null, latitude || null, longitude || null, severity || 'MEDIUM']
    );

    res.status(201).json({id: result.rows[0].id, message: 'Security incident created'});
  } catch (error) {
    console.error('Create security incident error:', error);
    res.status(500).json({error: 'Failed to create security incident'});
  }
});

// Get security incidents
router.get('/incidents', authorizeRoles('SECURITY', 'ADMIN'), async (req, res) => {
  try {
    const {status, severity} = req.query;
    let query = `
      SELECT i.*, u.name as reporter_name
      FROM security_incidents i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }
    if (severity) {
      query += ` AND i.severity = $${paramCount++}`;
      params.push(severity);
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      reportedBy: row.reported_by,
      reporterName: row.reporter_name,
      title: row.title,
      description: row.description,
      location: row.location,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      severity: row.severity,
      status: row.status,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get security incidents error:', error);
    res.status(500).json({error: 'Failed to fetch security incidents'});
  }
});

// Create emergency alert
router.post('/emergency-alerts', authorizeRoles('SECURITY', 'ADMIN'), async (req, res) => {
  try {
    const {title, message, alertType, severity, location} = req.body;
    const createdBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO emergency_alerts (title, message, alert_type, severity, location, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id`,
      [title, message, alertType || null, severity || 'HIGH', location || null, createdBy]
    );

    // Emit to all users
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-alert', {
        id: result.rows[0].id,
        title,
        message,
        alertType,
        severity,
        location,
      });
    }

    res.status(201).json({id: result.rows[0].id, message: 'Emergency alert created'});
  } catch (error) {
    console.error('Create emergency alert error:', error);
    res.status(500).json({error: 'Failed to create emergency alert'});
  }
});

module.exports = router;

