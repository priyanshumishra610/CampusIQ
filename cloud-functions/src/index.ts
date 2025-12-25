/**
 * 🔐 CampusIQ Security Middleware - Cloud Functions
 * 
 * Zero-trust architecture: All critical operations go through server-side validation.
 * 
 * Security Features:
 * - Role-based authorization
 * - Rate limiting per user
 * - Abuse detection
 * - Immutable audit logging
 * - Intrusion signal logging
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type AdminRole = 'REGISTRAR' | 'DEAN' | 'DIRECTOR' | 'EXECUTIVE';
type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface UserProfile {
  id: string;
  role: 'USER' | 'ADMIN';
  adminRole?: AdminRole;
  email: string;
  name: string;
}

interface SecurityEvent {
  userId: string;
  userEmail: string;
  role: string;
  adminRole?: AdminRole;
  action: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
}

interface RateLimitRecord {
  userId: string;
  actionCounts: Record<string, number>;
  lastReset: admin.firestore.Timestamp;
  violations: number;
}

// ============================================================================
// RATE LIMITING & ABUSE DETECTION
// ============================================================================

const RATE_LIMITS = {
  'task:create': { max: 10, windowMinutes: 60 },      // 10 tasks per hour
  'task:update': { max: 30, windowMinutes: 60 },     // 30 updates per hour
  'task:status_change': { max: 20, windowMinutes: 60 }, // 20 status changes per hour
  'task:comment': { max: 50, windowMinutes: 60 },     // 50 comments per hour
  'location:ping': { max: 60, windowMinutes: 60 },    // 60 location pings per hour (1 per minute)
};

const BURST_LIMITS = {
  'task:create': { max: 3, windowSeconds: 60 },      // Max 3 tasks in 60 seconds
  'task:update': { max: 10, windowSeconds: 60 },     // Max 10 updates in 60 seconds
};

/**
 * Check rate limits for a user action
 */
async function checkRateLimit(
  userId: string,
  action: string,
  isBurst: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = isBurst ? BURST_LIMITS : RATE_LIMITS;
  const limit = limits[action as keyof typeof limits];
  
  if (!limit) {
    return { allowed: true }; // No limit defined
  }

  const now = admin.firestore.Timestamp.now();
  const windowStart = isBurst
    ? admin.firestore.Timestamp.fromMillis(now.toMillis() - limit.windowSeconds * 1000)
    : admin.firestore.Timestamp.fromMillis(now.toMillis() - limit.windowMinutes * 60 * 1000);

  // Get or create rate limit record
  const rateLimitRef = db.collection('rateLimits').doc(userId);
  const rateLimitDoc = await rateLimitRef.get();
  
  let record: RateLimitRecord;
  if (!rateLimitDoc.exists) {
    record = {
      userId,
      actionCounts: {},
      lastReset: now,
      violations: 0,
    };
  } else {
    record = rateLimitDoc.data() as RateLimitRecord;
    
    // Reset counts if window has passed
    if (record.lastReset.toMillis() < windowStart.toMillis()) {
      record.actionCounts = {};
      record.lastReset = now;
    }
  }

  const currentCount = record.actionCounts[action] || 0;
  
  if (currentCount >= limit.max) {
    // Log violation
    record.violations = (record.violations || 0) + 1;
    await rateLimitRef.set(record, { merge: true });
    
    await logSecurityEvent({
      userId,
      action: `rate_limit:${action}`,
      reason: `Exceeded ${isBurst ? 'burst' : 'rate'} limit: ${currentCount}/${limit.max}`,
      severity: record.violations > 3 ? 'HIGH' : 'MEDIUM',
      metadata: { action, count: currentCount, limit: limit.max, isBurst },
    });

    return {
      allowed: false,
      reason: `Rate limit exceeded: ${currentCount}/${limit.max} ${isBurst ? 'in burst window' : 'per hour'}`,
    };
  }

  // Increment count
  record.actionCounts[action] = currentCount + 1;
  await rateLimitRef.set(record, { merge: true });

  return { allowed: true };
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

/**
 * Log security events for intrusion detection
 */
async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: admin.firestore.Timestamp.now(),
  };

  await db.collection('securityEvents').add(securityEvent);
  
  // Log to console for monitoring
  console.warn('[SECURITY EVENT]', {
    userId: event.userId,
    action: event.action,
    reason: event.reason,
    severity: event.severity,
  });
}

// ============================================================================
// USER PROFILE VALIDATION
// ============================================================================

/**
 * Get and validate user profile
 */
async function getUserProfile(uid: string): Promise<{ profile: UserProfile | null; error?: string }> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return { profile: null, error: 'User profile not found' };
    }

    const data = userDoc.data()!;
    const profile: UserProfile = {
      id: uid,
      role: data.role || 'USER',
      adminRole: data.adminRole,
      email: data.email || '',
      name: data.name || '',
    };

    // Validate admin role
    if (profile.role === 'ADMIN' && !profile.adminRole) {
      await logSecurityEvent({
        userId: uid,
        userEmail: profile.email,
        role: profile.role,
        action: 'role:validation_failed',
        reason: 'Admin user missing adminRole',
        severity: 'HIGH',
      });
      return { profile: null, error: 'Invalid admin role configuration' };
    }

    return { profile };
  } catch (error: any) {
    return { profile: null, error: error.message };
  }
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  REGISTRAR: ['task:create', 'task:view', 'exam:create', 'exam:view', 'exam:edit', 'exam:schedule'],
  DEAN: ['task:create', 'task:view', 'task:close', 'task:escalate', 'exam:create', 'exam:view', 'exam:edit', 'exam:schedule', 'exam:publish'],
  DIRECTOR: ['task:create', 'task:view', 'task:close', 'task:escalate', 'task:assign', 'task:delete', 'exam:create', 'exam:view', 'exam:edit', 'exam:delete', 'exam:schedule', 'exam:publish'],
  EXECUTIVE: ['task:view', 'exam:view'], // Read-only
};

function hasPermission(adminRole: AdminRole | undefined, permission: string): boolean {
  if (!adminRole) return false;
  return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
}

// ============================================================================
// CLOUD FUNCTIONS - TASK OPERATIONS
// ============================================================================

/**
 * Secure task creation endpoint
 * Validates: role, rate limits, input sanitization
 * Optional: Device fingerprinting for abuse detection
 */
export const secureCreateTask = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  
  // Optional: Device fingerprinting (lightweight)
  // Note: IP and user-agent available via request object in HTTP functions
  // For callable functions, we can extract from request if available
  const deviceFingerprint = {
    timestamp: Date.now(),
    // IP and user-agent would be available in HTTP context
    // For callable functions, this is a placeholder for future enhancement
  };

  // Rate limiting
  const rateLimitCheck = await checkRateLimit(userId, 'task:create');
  if (!rateLimitCheck.allowed) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
  }

  // Burst protection
  const burstCheck = await checkRateLimit(userId, 'task:create', true);
  if (!burstCheck.allowed) {
    await logSecurityEvent({
      userId,
      userEmail: context.auth.token.email || 'unknown',
      role: 'UNKNOWN',
      action: 'task:create:burst_detected',
      reason: burstCheck.reason!,
      severity: 'HIGH',
      metadata: {
        deviceFingerprint: {
          timestamp: Date.now(),
        },
      },
    });
    throw new functions.https.HttpsError('resource-exhausted', 'Too many requests. Please slow down.');
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Optional: Honeypot check - detect probing of fake permission fields
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data()!;
  if (data.honeypotField !== undefined) {
    // Someone tried to access a fake permission field
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'honeypot:permission_probe',
      reason: 'User attempted to access fake permission field',
      severity: 'HIGH',
      metadata: { honeypotField: data.honeypotField, deviceFingerprint },
    });
    // Don't reveal this is a honeypot - just fail silently
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request');
  }

  // Permission check
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'task:create')) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'task:create:permission_denied',
      reason: `User ${profile.adminRole || 'USER'} attempted to create task without permission`,
      severity: 'MEDIUM',
      metadata: { deviceFingerprint },
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create tasks');
  }

  // Input validation
  const { title, description, location, imageBase64 } = data;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Title is required');
  }
  
  if (title.length > 200) {
    throw new functions.https.HttpsError('invalid-argument', 'Title too long (max 200 characters)');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Description is required');
  }
  
  if (description.length > 5000) {
    throw new functions.https.HttpsError('invalid-argument', 'Description too long (max 5000 characters)');
  }

  // Sanitize location if provided
  let sanitizedLocation = null;
  if (location) {
    if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid location format');
    }
    // Validate coordinates are reasonable
    if (Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid coordinates');
    }
    sanitizedLocation = { lat: location.lat, lng: location.lng };
  }

  // Create task (status and priority will be set by AI service or defaults)
  const taskData = {
    title: title.trim(),
    description: description.trim(),
    category: data.category || 'General', // Will be set by AI if available
    priority: data.priority || 'MEDIUM', // Will be set by AI if available
    status: 'NEW' as TaskStatus,
    createdBy: userId,
    createdByName: profile.name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    location: sanitizedLocation,
    imageBase64: imageBase64 || null,
  };

  const taskRef = await db.collection('issues').add(taskData);

  // Create audit log (server-side only)
  await db.collection('auditLogs').add({
    action: 'task:created',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Task',
    entityId: taskRef.id,
    details: {
      title: taskData.title,
      category: taskData.category,
      priority: taskData.priority,
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, taskId: taskRef.id };
});

/**
 * Secure task status update endpoint
 * Validates: role, status transitions, rate limits
 */
export const secureUpdateTaskStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { taskId, newStatus } = data;

  if (!taskId || !newStatus) {
    throw new functions.https.HttpsError('invalid-argument', 'taskId and newStatus are required');
  }

  // Rate limiting
  const rateLimitCheck = await checkRateLimit(userId, 'task:status_change');
  if (!rateLimitCheck.allowed) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Permission check
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'task:close')) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'task:status_change:permission_denied',
      reason: `User ${profile.adminRole || 'USER'} attempted status change without permission`,
      severity: 'MEDIUM',
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to change task status');
  }

  // Get task
  const taskDoc = await db.collection('issues').doc(taskId).get();
  if (!taskDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Task not found');
  }

  const task = taskDoc.data()!;
  const currentStatus = task.status as TaskStatus;

  // Validate status transition
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    NEW: ['IN_PROGRESS', 'ESCALATED'],
    IN_PROGRESS: ['RESOLVED', 'ESCALATED'],
    RESOLVED: [], // Terminal state
    ESCALATED: ['IN_PROGRESS', 'RESOLVED'],
  };

  if (!validTransitions[currentStatus]?.includes(newStatus as TaskStatus)) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'task:status_change:invalid_transition',
      reason: `Invalid status transition: ${currentStatus} -> ${newStatus}`,
      severity: 'MEDIUM',
      metadata: { taskId, currentStatus, attemptedStatus: newStatus },
    });
    throw new functions.https.HttpsError('invalid-argument', `Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  // Role-specific restrictions
  if (profile.adminRole === 'REGISTRAR' && newStatus !== currentStatus) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'task:status_change:role_violation',
      reason: 'REGISTRAR role cannot change task status',
      severity: 'HIGH',
      metadata: { taskId, attemptedStatus: newStatus },
    });
    throw new functions.https.HttpsError('permission-denied', 'REGISTRAR role cannot change task status');
  }

  // Update task
  const updateData: any = {
    status: newStatus,
  };

  if (newStatus === 'RESOLVED') {
    updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await db.collection('issues').doc(taskId).update(updateData);

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'task:status_changed',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Task',
    entityId: taskId,
    previousValue: currentStatus,
    newValue: newStatus,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Secure task comment addition
 */
export const secureAddTaskComment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { taskId, text } = data;

  if (!taskId || !text) {
    throw new functions.https.HttpsError('invalid-argument', 'taskId and text are required');
  }

  // Rate limiting
  const rateLimitCheck = await checkRateLimit(userId, 'task:comment');
  if (!rateLimitCheck.allowed) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Only admins can comment
  if (profile.role !== 'ADMIN') {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      action: 'task:comment:permission_denied',
      reason: 'Non-admin user attempted to add comment',
      severity: 'MEDIUM',
    });
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can add comments');
  }

  // Validate comment text
  const sanitizedText = text.trim();
  if (sanitizedText.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Comment text cannot be empty');
  }
  if (sanitizedText.length > 2000) {
    throw new functions.https.HttpsError('invalid-argument', 'Comment too long (max 2000 characters)');
  }

  // Check task exists
  const taskDoc = await db.collection('issues').doc(taskId).get();
  if (!taskDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Task not found');
  }

  // Add comment
  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: sanitizedText,
    authorId: userId,
    authorName: profile.name,
    authorRole: profile.adminRole!,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('issues').doc(taskId).update({
    comments: admin.firestore.FieldValue.arrayUnion(comment),
  });

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'task:comment_added',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Task',
    entityId: taskId,
    details: { commentPreview: sanitizedText.slice(0, 100) },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, commentId: comment.id };
});

// ============================================================================
// CLOUD FUNCTIONS - EXAM OPERATIONS
// ============================================================================

type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT';
type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface ExamConflict {
  type: 'ROOM' | 'TIME' | 'STUDENT';
  conflictingExamId: string;
  conflictingExamTitle: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
}

/**
 * Secure exam creation endpoint
 */
export const secureCreateExam = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  // Rate limiting
  const rateLimitCheck = await checkRateLimit(userId, 'task:create'); // Reuse task:create limit
  if (!rateLimitCheck.allowed) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Permission check
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'exam:create')) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'exam:create:permission_denied',
      reason: `User ${profile.adminRole || 'USER'} attempted to create exam without permission`,
      severity: 'MEDIUM',
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to create exams');
  }

  // Input validation
  const { title, courseCode, courseName, examType, scheduledDate, startTime, endTime, duration, room, building, capacity, instructions, enrolledStudents } = data;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Title is required');
  }
  if (!courseCode || typeof courseCode !== 'string' || courseCode.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Course code is required');
  }
  if (!courseName || typeof courseName !== 'string' || courseName.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Course name is required');
  }
  if (!examType || !['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PROJECT'].includes(examType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid exam type is required');
  }
  if (!scheduledDate || !startTime || !endTime || !duration || !capacity) {
    throw new functions.https.HttpsError('invalid-argument', 'Date, time, duration, and capacity are required');
  }

  // Parse and validate date
  const examDate = admin.firestore.Timestamp.fromDate(new Date(scheduledDate));
  if (isNaN(examDate.toMillis())) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid date format');
  }

  // Create exam
  const examData = {
    title: title.trim(),
    courseCode: courseCode.trim(),
    courseName: courseName.trim(),
    examType: examType as ExamType,
    status: 'DRAFT' as ExamStatus,
    scheduledDate: examDate,
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    duration: parseInt(duration, 10),
    room: room?.trim() || null,
    building: building?.trim() || null,
    capacity: parseInt(capacity, 10),
    enrolledStudents: Array.isArray(enrolledStudents) ? enrolledStudents : [],
    studentCount: Array.isArray(enrolledStudents) ? enrolledStudents.length : 0,
    instructions: instructions?.trim() || null,
    createdBy: userId,
    createdByName: profile.name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const examRef = await db.collection('exams').add(examData);

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'exam:created',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Exam',
    entityId: examRef.id,
    details: {
      title: examData.title,
      courseCode: examData.courseCode,
      examType: examData.examType,
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, examId: examRef.id };
});

/**
 * Secure exam update endpoint
 */
export const secureUpdateExam = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { examId, updates } = data;

  if (!examId || !updates) {
    throw new functions.https.HttpsError('invalid-argument', 'examId and updates are required');
  }

  // Rate limiting
  const rateLimitCheck = await checkRateLimit(userId, 'task:update');
  if (!rateLimitCheck.allowed) {
    throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Permission check
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'exam:edit')) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'exam:update:permission_denied',
      reason: `User ${profile.adminRole || 'USER'} attempted to update exam without permission`,
      severity: 'MEDIUM',
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to update exams');
  }

  // Get exam
  const examDoc = await db.collection('exams').doc(examId).get();
  if (!examDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Exam not found');
  }

  const exam = examDoc.data()!;

  // Validate status transitions
  if (updates.status) {
    const currentStatus = exam.status as ExamStatus;
    const newStatus = updates.status as ExamStatus;

    if (currentStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot change status of completed exam');
    }
    if (currentStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot change status of cancelled exam');
    }
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (updates.title) updateData.title = updates.title.trim();
  if (updates.courseCode) updateData.courseCode = updates.courseCode.trim();
  if (updates.courseName) updateData.courseName = updates.courseName.trim();
  if (updates.examType) updateData.examType = updates.examType;
  if (updates.scheduledDate) {
    updateData.scheduledDate = admin.firestore.Timestamp.fromDate(new Date(updates.scheduledDate));
  }
  if (updates.startTime) updateData.startTime = updates.startTime.trim();
  if (updates.endTime) updateData.endTime = updates.endTime.trim();
  if (updates.duration) updateData.duration = parseInt(updates.duration, 10);
  if (updates.room !== undefined) updateData.room = updates.room?.trim() || null;
  if (updates.building !== undefined) updateData.building = updates.building?.trim() || null;
  if (updates.capacity) updateData.capacity = parseInt(updates.capacity, 10);
  if (updates.instructions !== undefined) updateData.instructions = updates.instructions?.trim() || null;
  if (updates.enrolledStudents) {
    updateData.enrolledStudents = Array.isArray(updates.enrolledStudents) ? updates.enrolledStudents : [];
    updateData.studentCount = updateData.enrolledStudents.length;
  }
  if (updates.status) updateData.status = updates.status;

  await db.collection('exams').doc(examId).update(updateData);

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'exam:updated',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Exam',
    entityId: examId,
    details: updateData,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Secure exam deletion endpoint
 */
export const secureDeleteExam = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { examId } = data;

  if (!examId) {
    throw new functions.https.HttpsError('invalid-argument', 'examId is required');
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Permission check - only DIRECTOR can delete
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'exam:delete')) {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'exam:delete:permission_denied',
      reason: `User ${profile.adminRole || 'USER'} attempted to delete exam without permission`,
      severity: 'HIGH',
    });
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to delete exams');
  }

  // Get exam
  const examDoc = await db.collection('exams').doc(examId).get();
  if (!examDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Exam not found');
  }

  const exam = examDoc.data()!;

  // Prevent deletion of completed or published exams
  if (exam.status === 'COMPLETED' || exam.status === 'IN_PROGRESS') {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot delete completed or in-progress exams');
  }

  await db.collection('exams').doc(examId).delete();

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'exam:deleted',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Exam',
    entityId: examId,
    details: { title: exam.title, courseCode: exam.courseCode },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Publish exam results securely
 */
export const securePublishExamResults = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { examId, results } = data;

  if (!examId || !results) {
    throw new functions.https.HttpsError('invalid-argument', 'examId and results are required');
  }

  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }

  // Permission check
  if (profile.role !== 'ADMIN' || !hasPermission(profile.adminRole, 'exam:publish')) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions to publish exam results');
  }

  // Get exam
  const examDoc = await db.collection('exams').doc(examId).get();
  if (!examDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Exam not found');
  }

  // Update exam status to COMPLETED and add published timestamp
  await db.collection('exams').doc(examId).update({
    status: 'COMPLETED',
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Store results in a separate collection
  const resultsRef = db.collection('examResults').doc(examId);
  await resultsRef.set({
    examId,
    results: Array.isArray(results) ? results : [],
    publishedBy: userId,
    publishedByName: profile.name,
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create audit log
  await db.collection('auditLogs').add({
    action: 'exam:results_published',
    performedBy: {
      id: userId,
      name: profile.name,
      role: profile.adminRole!,
    },
    entityType: 'Exam',
    entityId: examId,
    details: { resultCount: Array.isArray(results) ? results.length : 0 },
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * AI-powered exam conflict detection
 */
export const detectExamConflicts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { examId, scheduledDate, startTime, endTime, room, enrolledStudents } = data;

  if (!scheduledDate || !startTime || !endTime) {
    throw new functions.https.HttpsError('invalid-argument', 'Date and times are required');
  }

  const conflicts: ExamConflict[] = [];
  const examDate = admin.firestore.Timestamp.fromDate(new Date(scheduledDate));

  // Parse times
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Query for potential conflicts
  const dateStr = new Date(scheduledDate).toISOString().split('T')[0];
  const dayStart = admin.firestore.Timestamp.fromDate(new Date(dateStr + 'T00:00:00Z'));
  const dayEnd = admin.firestore.Timestamp.fromDate(new Date(dateStr + 'T23:59:59Z'));

  const query = db.collection('exams')
    .where('scheduledDate', '>=', dayStart)
    .where('scheduledDate', '<=', dayEnd)
    .where('status', 'in', ['DRAFT', 'SCHEDULED', 'IN_PROGRESS']);

  const conflictingExams = await query.get();

  for (const doc of conflictingExams.docs) {
    // Skip the current exam if checking for updates
    if (examId && doc.id === examId) continue;

    const otherExam = doc.data();
    const otherDate = otherExam.scheduledDate.toDate();
    const otherDateStr = otherDate.toISOString().split('T')[0];

    // Check if same day
    if (otherDateStr !== dateStr) continue;

    // Check time overlap
    const [otherStartHour, otherStartMin] = otherExam.startTime.split(':').map(Number);
    const [otherEndHour, otherEndMin] = otherExam.endTime.split(':').map(Number);
    const otherStartMinutes = otherStartHour * 60 + otherStartMin;
    const otherEndMinutes = otherEndHour * 60 + otherEndMin;

    const timeOverlap = !(endMinutes <= otherStartMinutes || startMinutes >= otherEndMinutes);

    // Room conflict
    if (room && otherExam.room && room === otherExam.room && timeOverlap) {
      conflicts.push({
        type: 'ROOM',
        conflictingExamId: doc.id,
        conflictingExamTitle: otherExam.title,
        message: `Room ${room} is already booked for ${otherExam.title} at this time`,
        severity: 'ERROR',
      });
    }

    // Student conflict
    if (enrolledStudents && Array.isArray(enrolledStudents) && otherExam.enrolledStudents && timeOverlap) {
      const studentOverlap = enrolledStudents.filter((sid: string) => 
        otherExam.enrolledStudents.includes(sid)
      );
      if (studentOverlap.length > 0) {
        conflicts.push({
          type: 'STUDENT',
          conflictingExamId: doc.id,
          conflictingExamTitle: otherExam.title,
          message: `${studentOverlap.length} student(s) are enrolled in both exams at the same time`,
          severity: 'ERROR',
        });
      }
    }
  }

  return { conflicts };
});

// ============================================================================
// SECURITY MONITORING
// ============================================================================

/**
 * Monitor security events and alert on thresholds
 * This runs periodically to detect patterns
 */
export const monitorSecurityEvents = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 60 * 60 * 1000
    );

    // Count high-severity events in last hour
    const highSeverityEvents = await db
      .collection('securityEvents')
      .where('severity', 'in', ['HIGH', 'CRITICAL'])
      .where('timestamp', '>=', oneHourAgo)
      .get();

    if (highSeverityEvents.size > 10) {
      // Alert: Too many high-severity events
      console.error('[SECURITY ALERT]', {
        message: 'High number of security events detected',
        count: highSeverityEvents.size,
        timeWindow: '1 hour',
      });
      
      // In production, send notification to admins
      // await notifySecurityTeam({ eventCount: highSeverityEvents.size });
    }

    // Check for users with excessive violations
    const rateLimitDocs = await db.collection('rateLimits').get();
    for (const doc of rateLimitDocs.docs) {
      const data = doc.data() as RateLimitRecord;
      if (data.violations > 5) {
        console.warn('[SECURITY WARNING]', {
          userId: data.userId,
          violations: data.violations,
          message: 'User has excessive rate limit violations',
        });
      }
    }
  });

// ============================================================================
// CROWD INTELLIGENCE & HEATMAP FEATURE
// ============================================================================

/**
 * Geohash encoding for spatial indexing
 * Simple implementation for privacy-preserving location aggregation
 */
function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  const BITS = [16, 8, 4, 2, 1];
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  
  let latMin = -90.0, latMax = 90.0;
  let lngMin = -180.0, lngMax = 180.0;
  let bit = 0;
  let ch = 0;
  let geohash = '';
  let even = true;
  
  while (geohash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        ch |= BITS[bit];
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= BITS[bit];
        latMin = mid;
      } else {
        latMax = mid;
      }
    }
    
    even = !even;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  
  return geohash;
}

/**
 * Calculate center of geohash cell (for heatmap rendering)
 */
function geohashToCenter(geohash: string): { lat: number; lng: number } {
  const BITS = [16, 8, 4, 2, 1];
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  
  let latMin = -90.0, latMax = 90.0;
  let lngMin = -180.0, lngMax = 180.0;
  let even = true;
  
  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) break;
    
    for (let i = 0; i < 5; i++) {
      const bit = (idx >> (4 - i)) & 1;
      
      if (even) {
        const mid = (lngMin + lngMax) / 2;
        if (bit) {
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (bit) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      even = !even;
    }
  }
  
  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  };
}

interface LocationPing {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: admin.firestore.Timestamp;
  geohash: string;
  anonymized: boolean;
}

interface HeatmapCell {
  geohash: string;
  lat: number;
  lng: number;
  count: number;
  lastUpdated: admin.firestore.Timestamp;
  timeWindow: string; // '15min' | '1hr' | 'today'
}

/**
 * Secure location ping endpoint
 * 
 * Privacy-first design:
 * - No PII stored
 * - Coarse location only (geohash precision ~150m)
 * - Rate-limited per device/user
 * - Aggregated immediately
 */
export const submitLocationPing = functions.https.onCall(async (data, context) => {
  // Authentication optional - allow anonymous pings for privacy
  // But we still track rate limits if authenticated
  
  const { lat, lng, accuracy } = data;
  
  // Input validation
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'Latitude and longitude are required');
  }
  
  // Validate coordinates are reasonable
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid coordinates');
  }
  
  // Rate limiting (if authenticated)
  const userId = context.auth?.uid || 'anonymous';
  if (context.auth) {
    const rateLimitCheck = await checkRateLimit(userId, 'location:ping');
    if (!rateLimitCheck.allowed) {
      throw new functions.https.HttpsError('resource-exhausted', rateLimitCheck.reason!);
    }
  }
  
  // Generate geohash (precision 7 = ~150m accuracy, privacy-preserving)
  const geohash = encodeGeohash(lat, lng, 7);
  const center = geohashToCenter(geohash);
  
  // Create anonymized location ping
  const ping: LocationPing = {
    lat: center.lat, // Use geohash center, not exact location
    lng: center.lng,
    accuracy: accuracy || null,
    timestamp: admin.firestore.Timestamp.now(),
    geohash,
    anonymized: true,
  };
  
  // Store raw ping (will be aggregated and deleted)
  const pingRef = await db.collection('locationPings').add(ping);
  
  // Trigger aggregation function via Pub/Sub
  // Note: The aggregateLocationPings function will be triggered automatically
  // when messages are published to the 'location-pings' topic
  // For now, we rely on the batch aggregation job (runs every 5 minutes)
  // In production, you can enable real-time aggregation by publishing to Pub/Sub:
  /*
  const pubsub = admin.pubsub();
  const topic = pubsub.topic('location-pings');
  await topic.publishMessage({
    json: {
      pingId: pingRef.id,
      geohash,
      lat: center.lat,
      lng: center.lng,
      timestamp: ping.timestamp.toMillis(),
    },
  });
  */
  
  return { success: true, geohash };
});

/**
 * Aggregate location pings into heatmap cells
 * Triggered by Pub/Sub messages from location pings
 */
export const aggregateLocationPings = functions.pubsub
  .topic('location-pings')
  .onPublish(async (message) => {
    const data = message.json;
    const { geohash, lat, lng, timestamp } = data;
    
    const now = admin.firestore.Timestamp.fromMillis(timestamp);
    const fifteenMinAgo = admin.firestore.Timestamp.fromMillis(timestamp - 15 * 60 * 1000);
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(timestamp - 60 * 60 * 1000);
    const todayStart = admin.firestore.Timestamp.fromMillis(
      new Date(timestamp).setHours(0, 0, 0, 0)
    );
    
    // Aggregate for different time windows
    const timeWindows = [
      { key: '15min', start: fifteenMinAgo },
      { key: '1hr', start: oneHourAgo },
      { key: 'today', start: todayStart },
    ];
    
    for (const window of timeWindows) {
      // Count pings in this geohash cell within time window
      const pingsSnapshot = await db
        .collection('locationPings')
        .where('geohash', '==', geohash)
        .where('timestamp', '>=', window.start)
        .where('timestamp', '<=', now)
        .get();
      
      const count = pingsSnapshot.size;
      
      // Minimum threshold: only store if >= 3 devices (privacy)
      if (count >= 3) {
        const cellId = `${geohash}_${window.key}`;
        const cellRef = db.collection('heatmapCells').doc(cellId);
        
        await cellRef.set({
          geohash,
          lat,
          lng,
          count,
          lastUpdated: now,
          timeWindow: window.key,
        }, { merge: true });
      }
    }
    
    // Cleanup: Delete old pings (older than 24 hours)
    const oneDayAgo = admin.firestore.Timestamp.fromMillis(timestamp - 24 * 60 * 60 * 1000);
    const oldPings = await db
      .collection('locationPings')
      .where('timestamp', '<', oneDayAgo)
      .limit(500)
      .get();
    
    const deletePromises = oldPings.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
  });

/**
 * Batch aggregation job (runs every 5 minutes via Cloud Scheduler)
 * Processes all recent pings and updates heatmap cells
 */
export const batchAggregateHeatmap = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const fifteenMinAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 15 * 60 * 1000);
    const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);
    const todayStart = admin.firestore.Timestamp.fromMillis(
      new Date().setHours(0, 0, 0, 0)
    );
    
    // Get all recent pings
    const recentPings = await db
      .collection('locationPings')
      .where('timestamp', '>=', fifteenMinAgo)
      .get();
    
    // Group by geohash
    const geohashGroups: Record<string, LocationPing[]> = {};
    
    recentPings.docs.forEach(doc => {
      const ping = doc.data() as LocationPing;
      if (!geohashGroups[ping.geohash]) {
        geohashGroups[ping.geohash] = [];
      }
      geohashGroups[ping.geohash].push(ping);
    });
    
    // Aggregate each geohash group
    const timeWindows = [
      { key: '15min', start: fifteenMinAgo },
      { key: '1hr', start: oneHourAgo },
      { key: 'today', start: todayStart },
    ];
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const [geohash, pings] of Object.entries(geohashGroups)) {
      if (pings.length === 0) continue;
      
      const center = geohashToCenter(geohash);
      
      for (const window of timeWindows) {
        const windowPings = pings.filter(
          p => p.timestamp.toMillis() >= window.start.toMillis()
        );
        
        const count = windowPings.length;
        
        // Minimum threshold: only store if >= 3 devices
        if (count >= 3) {
          const cellId = `${geohash}_${window.key}`;
          const cellRef = db.collection('heatmapCells').doc(cellId);
          
          batch.set(cellRef, {
            geohash,
            lat: center.lat,
            lng: center.lng,
            count,
            lastUpdated: now,
            timeWindow: window.key,
          }, { merge: true });
          
          batchCount++;
          
          // Firestore batch limit is 500
          if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`[HEATMAP] Aggregated ${Object.keys(geohashGroups).length} geohash cells`);
  });

/**
 * Get heatmap data for admin dashboard
 * Returns aggregated heatmap cells for specified time window
 */
export const getHeatmapData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userId = context.auth.uid;
  const { timeWindow = '15min' } = data;
  
  // Validate time window
  if (!['15min', '1hr', 'today'].includes(timeWindow)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid time window');
  }
  
  // Get user profile
  const { profile, error: profileError } = await getUserProfile(userId);
  if (!profile || profileError) {
    throw new functions.https.HttpsError('not-found', profileError || 'User profile not found');
  }
  
  // Permission check: Only admins can view heatmap
  if (profile.role !== 'ADMIN') {
    await logSecurityEvent({
      userId,
      userEmail: profile.email,
      role: profile.role,
      adminRole: profile.adminRole,
      action: 'heatmap:view:permission_denied',
      reason: 'Non-admin user attempted to view heatmap',
      severity: 'MEDIUM',
    });
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can view heatmap data');
  }
  
  // Get heatmap cells for specified time window
  const cellsSnapshot = await db
    .collection('heatmapCells')
    .where('timeWindow', '==', timeWindow)
    .where('lastUpdated', '>=', admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000))
    .get();
  
  const cells: HeatmapCell[] = cellsSnapshot.docs.map(doc => ({
    geohash: doc.data().geohash,
    lat: doc.data().lat,
    lng: doc.data().lng,
    count: doc.data().count,
    lastUpdated: doc.data().lastUpdated,
    timeWindow: doc.data().timeWindow,
  }));
  
  return { cells, count: cells.length };
});

