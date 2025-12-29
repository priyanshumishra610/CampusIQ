const pool = require('../database/connection');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join role-specific room
    socket.on('join-role-room', (role) => {
      socket.join(`role-${role}`);
      console.log(`User joined role room: ${role}`);
    });

    // Handle attendance updates
    socket.on('attendance-update', async (data) => {
      // Broadcast to relevant users
      io.to(`role-FACULTY`).emit('attendance-updated', data);
      io.to(`user-${data.studentId}`).emit('attendance-updated', data);
    });

    // Handle SOS alerts
    socket.on('sos-alert', async (data) => {
      // Broadcast to security and admin
      io.to('role-SECURITY').emit('sos-alert', data);
      io.to('role-ADMIN').emit('sos-alert', data);
    });

    // Handle geofence breaches
    socket.on('geofence-breach', async (data) => {
      io.to('role-SECURITY').emit('geofence-breach', data);
      io.to('role-ADMIN').emit('geofence-breach', data);
    });

    // Handle notifications
    socket.on('notification', async (data) => {
      if (data.userId) {
        io.to(`user-${data.userId}`).emit('notification', data);
      } else if (data.role) {
        io.to(`role-${data.role}`).emit('notification', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = {setupSocketIO};

