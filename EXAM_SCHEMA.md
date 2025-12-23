# Exam Management Module - Firestore Schema

## Collections

### `exams`

Main collection for exam schedules and metadata.

```typescript
{
  id: string; // Document ID
  title: string; // Exam title (e.g., "CS101 Midterm Exam")
  courseCode: string; // Course code (e.g., "CS101")
  courseName: string; // Full course name
  examType: 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT';
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Schedule
  scheduledDate: Timestamp; // Date of the exam
  startTime: string; // HH:mm format (e.g., "09:00")
  endTime: string; // HH:mm format (e.g., "11:00")
  duration: number; // Duration in minutes
  
  // Location
  room?: string | null; // Room number/identifier
  building?: string | null; // Building name
  capacity: number; // Maximum seating capacity
  
  // Students
  enrolledStudents: string[]; // Array of student IDs
  studentCount: number; // Count of enrolled students
  
  // Additional info
  instructions?: string | null; // Instructions for students
  
  // Metadata
  createdBy: string; // User ID of creator
  createdByName?: string; // Name of creator
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp; // When results were published
  
  // AI & Conflicts
  conflictWarnings?: Array<{
    type: 'ROOM' | 'TIME' | 'STUDENT';
    conflictingExamId: string;
    conflictingExamTitle: string;
    message: string;
    severity: 'WARNING' | 'ERROR';
  }>;
  aiSuggestions?: string; // AI-generated scheduling suggestions
}
```

### `examResults`

Collection for published exam results. Document ID matches the exam ID.

```typescript
{
  examId: string; // Reference to exam document
  results: Array<{
    examId: string;
    studentId: string;
    studentName: string;
    seatNumber?: number;
    attendance?: 'PRESENT' | 'ABSENT' | 'LATE';
    score?: number;
    grade?: string;
  }>;
  publishedBy: string; // User ID
  publishedByName: string;
  publishedAt: Timestamp;
}
```

### `auditLogs`

Audit trail entries for exam operations. Same collection as task audit logs.

```typescript
{
  action: 'exam:created' | 'exam:updated' | 'exam:deleted' | 'exam:results_published';
  performedBy: {
    id: string;
    name: string;
    role: AdminRole;
  };
  entityType: 'Exam';
  entityId: string; // Exam ID
  details?: Record<string, any>;
  timestamp: Timestamp;
}
```

## Firestore Security Rules

Example security rules for exams:

```javascript
match /exams/{examId} {
  allow read: if request.auth != null && 
    (resource == null || 
     request.auth.uid == resource.data.createdBy ||
     hasRole('DEAN') ||
     hasRole('DIRECTOR') ||
     hasRole('EXECUTIVE'));
  
  allow create: if request.auth != null && 
    hasPermission('exam:create') &&
    request.resource.data.createdBy == request.auth.uid;
  
  allow update: if request.auth != null && 
    hasPermission('exam:edit') &&
    resource.data.createdBy == request.auth.uid;
  
  allow delete: if request.auth != null && 
    hasPermission('exam:delete');
}

match /examResults/{examId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && hasPermission('exam:publish');
}
```

## Indexes Required

The following composite indexes are recommended for optimal query performance:

1. `exams` collection:
   - `scheduledDate` (ascending), `status` (ascending)
   - `createdBy` (ascending), `scheduledDate` (ascending)

2. `auditLogs` collection (if not already created):
   - `entityType` (ascending), `timestamp` (descending)
   - `entityId` (ascending), `timestamp` (descending)

## Permissions Matrix

| Role | Create | View | Edit | Delete | Publish |
|------|--------|------|------|--------|---------|
| REGISTRAR | ✅ | ✅ | ✅ | ❌ | ❌ |
| DEAN | ✅ | ✅ | ✅ | ❌ | ✅ |
| DIRECTOR | ✅ | ✅ | ✅ | ✅ | ✅ |
| EXECUTIVE | ❌ | ✅ | ❌ | ❌ | ❌ |

## Usage Examples

### Query all scheduled exams for a date range

```typescript
const startDate = admin.firestore.Timestamp.fromDate(new Date('2024-12-01'));
const endDate = admin.firestore.Timestamp.fromDate(new Date('2024-12-31'));

const exams = await db.collection('exams')
  .where('scheduledDate', '>=', startDate)
  .where('scheduledDate', '<=', endDate)
  .where('status', 'in', ['SCHEDULED', 'IN_PROGRESS'])
  .orderBy('scheduledDate', 'asc')
  .get();
```

### Check for room conflicts

```typescript
const conflictingExams = await db.collection('exams')
  .where('room', '==', 'A101')
  .where('scheduledDate', '==', examDate)
  .where('status', 'in', ['SCHEDULED', 'IN_PROGRESS'])
  .get();
```


