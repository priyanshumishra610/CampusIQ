# Backend Migration Guide

## Overview

CampusIQ has been migrated from Firebase to a Node.js + PostgreSQL backend. This document explains the migration, API endpoints, and setup instructions.

## Architecture

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT-based
- **API**: RESTful endpoints

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb campusiq

   # Run migrations
   npm run migrate

   # Seed test data (optional)
   npm run seed
   ```

5. **Start server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

### Docker Setup

1. **Using Docker Compose**:
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **The setup includes**:
   - PostgreSQL database
   - Backend API server
   - Automatic migrations

### Frontend Configuration

1. **Update API URL**:
   - Set `API_BASE_URL` in your environment or `.env` file
   - Default: `http://localhost:3000/api`
   - For production: `https://your-api-domain.com/api`

2. **Install dependencies**:
   ```bash
   npm install
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/fcm-token` - Register FCM token

### Attendance

- `POST /api/attendance/mark` - Mark attendance (faculty)
- `POST /api/attendance/mark-bulk` - Mark bulk attendance
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/course/:courseId` - Get course attendance
- `GET /api/attendance/student/:studentId/summary` - Get attendance summary

### Assignments

- `POST /api/assignments` - Create assignment (faculty)
- `POST /api/assignments/:id/publish` - Publish assignment
- `GET /api/assignments/course/:courseId` - Get course assignments
- `GET /api/assignments/student/:studentId` - Get student assignments
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments/:id/submit` - Submit assignment (student)
- `GET /api/assignments/:id/submission` - Get submission
- `GET /api/assignments/:id/submissions` - Get all submissions (faculty)
- `POST /api/assignments/submissions/:id/grade` - Grade submission
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Exams

- `POST /api/exams` - Create exam
- `GET /api/exams/course/:courseId` - Get course exams
- `GET /api/exams/:id` - Get exam by ID
- `GET /api/exams/:id/results` - Get exam results
- `POST /api/exams/:id/results` - Submit exam results
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

### Announcements

- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - Get announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Events

- `POST /api/events` - Create event
- `GET /api/events` - Get events
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Security

- `POST /api/security/sos` - Create SOS alert
- `GET /api/security/sos` - Get SOS alerts (security/admin)
- `PUT /api/security/sos/:id/respond` - Respond to SOS
- `POST /api/security/incidents` - Create security incident
- `GET /api/security/incidents` - Get security incidents
- `POST /api/security/emergency-alerts` - Create emergency alert

### AI

- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/chat-history` - Get chat history

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

### Maps

- `GET /api/maps/locations` - Get map locations
- `POST /api/maps/locations` - Create map location (admin)
- `GET /api/maps/geofences` - Get geofence zones

### Timetable

- `GET /api/timetable` - Get timetable
- `POST /api/timetable` - Create timetable entry
- `PUT /api/timetable/:id` - Update timetable entry
- `DELETE /api/timetable/:id` - Delete timetable entry

### Tickets

- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get tickets
- `PUT /api/tickets/:id` - Update ticket

### Tasks

- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get tasks
- `PUT /api/tasks/:id` - Update task

## Real-time Updates (Socket.IO)

The backend uses Socket.IO for real-time updates. Connect to the server and join rooms:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join user-specific room
socket.emit('join-user-room', userId);

// Join role-specific room
socket.emit('join-role-room', 'FACULTY');

// Listen for events
socket.on('attendance-updated', (data) => {
  // Handle attendance update
});

socket.on('sos-alert', (data) => {
  // Handle SOS alert
});

socket.on('notification', (data) => {
  // Handle notification
});
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the login/register endpoints and stored in AsyncStorage.

## Database Schema

See `backend/src/database/schema.sql` for the complete database schema.

## Migration Notes

### Removed Firebase Dependencies

- `@react-native-firebase/app`
- `@react-native-firebase/auth`
- `@react-native-firebase/firestore`
- `@react-native-firebase/functions`
- `@react-native-firebase/messaging`

### Added Dependencies

- `axios` - HTTP client
- `socket.io-client` - Real-time communication

### Service Changes

All service files have been updated to use the new API client instead of Firebase:

- `app/services/api.client.ts` - New API client
- `app/redux/slices/authSlice.ts` - Updated to use API
- All other services updated to use API endpoints

## Testing

Test users are created by the seed script:

- `admin@campusiq.edu` / `password123` (ADMIN)
- `faculty@campusiq.edu` / `password123` (FACULTY)
- `student@campusiq.edu` / `password123` (STUDENT)
- `support@campusiq.edu` / `password123` (SUPPORT)
- `security@campusiq.edu` / `password123` (SECURITY)

## Production Deployment

1. Set environment variables in production
2. Use a production PostgreSQL database
3. Configure CORS for your frontend domain
4. Use HTTPS for API endpoints
5. Set secure JWT secret
6. Configure proper database backups

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb campusiq`

### API Connection Issues

- Verify backend is running on correct port
- Check `API_BASE_URL` in frontend
- Verify CORS settings

### Authentication Issues

- Check JWT token is being sent in headers
- Verify token hasn't expired
- Check JWT_SECRET matches between environments

