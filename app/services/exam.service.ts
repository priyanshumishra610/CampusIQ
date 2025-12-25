/**
 * 🔐 Exam Service
 * 
 * Frontend service for calling secure Cloud Functions endpoints for exam management.
 * All critical operations go through this service instead of direct Firestore writes.
 */

import functions from '@react-native-firebase/functions';

export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT';
export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ExamConflict = {
  type: 'ROOM' | 'TIME' | 'STUDENT';
  conflictingExamId: string;
  conflictingExamTitle: string;
  message: string;
  severity: 'WARNING' | 'ERROR';
};

export type ExamStudentLink = {
  examId: string;
  studentId: string;
  studentName: string;
  seatNumber?: number;
  attendance?: 'PRESENT' | 'ABSENT' | 'LATE';
  score?: number;
  grade?: string;
};

/**
 * Create an exam securely via Cloud Function
 */
export async function secureCreateExam(params: {
  title: string;
  courseCode: string;
  courseName: string;
  examType: ExamType;
  scheduledDate: string; // ISO string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  room?: string;
  building?: string;
  capacity: number;
  instructions?: string;
  enrolledStudents: string[];
}): Promise<{success: boolean; examId: string}> {
  try {
    const createExamFunction = functions().httpsCallable('secureCreateExam');
    const result = await createExamFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'resource-exhausted') {
      throw new Error('Rate limit exceeded. Please wait before creating more exams.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to create exams.');
    }
    if (error.code === 'invalid-argument') {
      throw new Error(error.message || 'Invalid input provided.');
    }
    throw new Error(error.message || 'Failed to create exam securely');
  }
}

/**
 * Update exam securely via Cloud Function
 */
export async function secureUpdateExam(params: {
  examId: string;
  updates: Partial<{
    title: string;
    courseCode: string;
    courseName: string;
    examType: ExamType;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    room: string;
    building: string;
    capacity: number;
    instructions: string;
    enrolledStudents: string[];
    status: ExamStatus;
  }>;
}): Promise<{success: boolean}> {
  try {
    const updateExamFunction = functions().httpsCallable('secureUpdateExam');
    const result = await updateExamFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'resource-exhausted') {
      throw new Error('Rate limit exceeded. Please wait before making more changes.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update exams.');
    }
    if (error.code === 'invalid-argument') {
      throw new Error(error.message || 'Invalid input provided.');
    }
    throw new Error(error.message || 'Failed to update exam');
  }
}

/**
 * Delete exam securely via Cloud Function
 */
export async function secureDeleteExam(params: {
  examId: string;
}): Promise<{success: boolean}> {
  try {
    const deleteExamFunction = functions().httpsCallable('secureDeleteExam');
    const result = await deleteExamFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete exams.');
    }
    if (error.code === 'failed-precondition') {
      throw new Error('Cannot delete exam. It may have been published or completed.');
    }
    throw new Error(error.message || 'Failed to delete exam');
  }
}

/**
 * Publish exam results securely via Cloud Function
 */
export async function securePublishExamResults(params: {
  examId: string;
  results: ExamStudentLink[];
}): Promise<{success: boolean}> {
  try {
    const publishResultsFunction = functions().httpsCallable('securePublishExamResults');
    const result = await publishResultsFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to publish exam results.');
    }
    if (error.code === 'failed-precondition') {
      throw new Error('Cannot publish results. Exam may not be completed.');
    }
    throw new Error(error.message || 'Failed to publish exam results');
  }
}

/**
 * Detect exam conflicts using AI-powered conflict detection
 */
export async function detectExamConflicts(params: {
  examId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  room?: string;
  enrolledStudents?: string[];
}): Promise<ExamConflict[]> {
  try {
    const detectConflictsFunction = functions().httpsCallable('detectExamConflicts');
    const result = await detectConflictsFunction(params);
    return result.data.conflicts || [];
  } catch (error: any) {
    console.warn('Conflict detection failed:', error);
    // Return empty array on error - don't block exam creation
    return [];
  }
}


