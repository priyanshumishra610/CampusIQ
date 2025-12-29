const express = require('express');
const pool = require('../database/connection');
const {authorizeRoles} = require('../middleware/auth');

const router = express.Router();

// Get timetable
router.get('/', async (req, res) => {
  try {
    const {courseId, facultyId, dayOfWeek} = req.query;
    let query = `
      SELECT t.*, c.name as course_name, c.code as course_code, u.name as faculty_name
      FROM timetables t
      JOIN courses c ON t.course_id = c.id
      LEFT JOIN users u ON t.faculty_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (courseId) {
      query += ` AND t.course_id = $${paramCount++}`;
      params.push(courseId);
    }
    if (facultyId) {
      query += ` AND t.faculty_id = $${paramCount++}`;
      params.push(facultyId);
    }
    if (dayOfWeek !== undefined) {
      query += ` AND t.day_of_week = $${paramCount++}`;
      params.push(parseInt(dayOfWeek));
    }

    query += ' ORDER BY t.day_of_week, t.start_time';

    const result = await pool.query(query, params);
    res.json(result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      courseName: row.course_name,
      courseCode: row.course_code,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      room: row.room,
      building: row.building,
      facultyId: row.faculty_id,
      facultyName: row.faculty_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({error: 'Failed to fetch timetable'});
  }
});

// Create timetable entry
router.post('/', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {courseId, dayOfWeek, startTime, endTime, room, building, facultyId} = req.body;

    const result = await pool.query(
      `INSERT INTO timetables (course_id, day_of_week, start_time, end_time, room, building, faculty_id, 
       created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id`,
      [courseId, dayOfWeek, startTime, endTime, room || null, building || null, facultyId || req.user.id]
    );

    res.status(201).json({id: result.rows[0].id, message: 'Timetable entry created'});
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({error: 'Failed to create timetable entry'});
  }
});

// Update timetable entry
router.put('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    const {dayOfWeek, startTime, endTime, room, building} = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (dayOfWeek !== undefined) {
      updates.push(`day_of_week = $${paramCount++}`);
      values.push(dayOfWeek);
    }
    if (startTime !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(startTime);
    }
    if (endTime !== undefined) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(endTime);
    }
    if (room !== undefined) {
      updates.push(`room = $${paramCount++}`);
      values.push(room);
    }
    if (building !== undefined) {
      updates.push(`building = $${paramCount++}`);
      values.push(building);
    }

    if (updates.length === 0) {
      return res.status(400).json({error: 'No fields to update'});
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await pool.query(
      `UPDATE timetables SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    res.json({message: 'Timetable entry updated'});
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({error: 'Failed to update timetable entry'});
  }
});

// Delete timetable entry
router.delete('/:id', authorizeRoles('FACULTY', 'ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM timetables WHERE id = $1', [req.params.id]);
    res.json({message: 'Timetable entry deleted'});
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({error: 'Failed to delete timetable entry'});
  }
});

module.exports = router;

