const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const assignmentRoutes = require('./routes/assignments');
const examRoutes = require('./routes/exams');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const eventRoutes = require('./routes/events');
const securityRoutes = require('./routes/security');
const ticketRoutes = require('./routes/tickets');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const mapsRoutes = require('./routes/maps');
const timetableRoutes = require('./routes/timetable');
const coursesRoutes = require('./routes/courses');
const hrEmployeeRoutes = require('./routes/hr/employees');
const hrRecruitmentRoutes = require('./routes/hr/recruitment');
const hrLeaveRoutes = require('./routes/hr/leave');
const hrHolidaysRoutes = require('./routes/hr/holidays').router;
const hrPayrollRoutes = require('./routes/hr/payroll');
const hrPerformanceRoutes = require('./routes/hr/performance');
const hrExpenseRoutes = require('./routes/hr/expenses');
const hrComplianceRoutes = require('./routes/hr/compliance');
const hrAttendanceRoutes = require('./routes/hr/attendance');
const {authenticateToken} = require('./middleware/auth');
const {setupSocketIO} = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Health check
app.get('/health', (req, res) => {
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/assignments', authenticateToken, assignmentRoutes);
app.use('/api/exams', authenticateToken, examRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/announcements', authenticateToken, announcementRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/security', authenticateToken, securityRoutes);
app.use('/api/tickets', authenticateToken, ticketRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/maps', authenticateToken, mapsRoutes);
app.use('/api/timetable', authenticateToken, timetableRoutes);
app.use('/api/courses', authenticateToken, coursesRoutes);
// HR Routes
app.use('/api/hr/employees', authenticateToken, hrEmployeeRoutes);
app.use('/api/hr/recruitment', authenticateToken, hrRecruitmentRoutes);
app.use('/api/hr/leave', authenticateToken, hrLeaveRoutes);
app.use('/api/hr/holidays', authenticateToken, hrHolidaysRoutes);
app.use('/api/hr/payroll', authenticateToken, hrPayrollRoutes);
app.use('/api/hr/performance', authenticateToken, hrPerformanceRoutes);
app.use('/api/hr/expenses', authenticateToken, hrExpenseRoutes);
app.use('/api/hr/compliance', authenticateToken, hrComplianceRoutes);
app.use('/api/hr/attendance', authenticateToken, hrAttendanceRoutes);

// Setup Socket.IO
setupSocketIO(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CampusIQ Backend Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = {app, server, io};

