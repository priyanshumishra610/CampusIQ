const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Get map locations
router.get('/locations', async (req, res) => {
  try {
    const {category} = req.query;
    let query = 'SELECT * FROM map_locations WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      category: row.category,
      floor: row.floor,
      roomNumber: row.room_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get map locations error:', error);
    res.status(500).json({error: 'Failed to fetch map locations'});
  }
});

// Create map location
router.post('/locations', authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const {name, description, latitude, longitude, category, floor, roomNumber} = req.body;

    const result = await pool.query(
      `INSERT INTO map_locations (name, description, latitude, longitude, category, floor, room_number, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [name, description, latitude, longitude, category || null, floor || null, roomNumber || null]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Map location created'});
  } catch (error) {
    console.error('Create map location error:', error);
    res.status(500).json({error: 'Failed to create map location'});
  }
});

// Get geofence zones
router.get('/geofences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM geofence_zones ORDER BY name ASC');
    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      centerLatitude: parseFloat(row.center_latitude),
      centerLongitude: parseFloat(row.center_longitude),
      radiusMeters: row.radius_meters,
      campusId: row.campus_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get geofence zones error:', error);
    res.status(500).json({error: 'Failed to fetch geofence zones'});
  }
});

module.exports = router;

