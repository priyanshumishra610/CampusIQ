import apiClient from './api.client';

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

export type Exam = {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  facultyId: string;
  facultyName: string;
  examDate: number; // timestamp
  durationMinutes: number;
  maxMarks: number;
  venue?: string;
  instructions?: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * Create an exam
 */
export async function secureCreateExam(params: {
  title: string;
  courseId: string;
  examDate: string; // ISO string
  durationMinutes: number;
  maxMarks: number;
  venue?: string;
  instructions?: string;
  description?: string;
}): Promise<{success: boolean; examId: string}> {
  try {
    const response = await apiClient.post('/exams', params);
    return {success: true, examId: response.id};
  } catch (error: any) {
    if (error?.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before creating more exams.');
    }
    if (error?.response?.status === 403) {
      throw new Error('You do not have permission to create exams.');
    }
    throw new Error(error?.response?.data?.error || 'Failed to create exam');
  }
}

/**
 * Update exam
 */
export async function secureUpdateExam(params: {
  examId: string;
  updates: Partial<{
    title: string;
    description: string;
    examDate: string;
    durationMinutes: number;
    maxMarks: number;
    venue: string;
    instructions: string;
  }>;
}): Promise<{success: boolean}> {
  try {
    await apiClient.put(`/exams/${params.examId}`, params.updates);
    return {success: true};
  } catch (error: any) {
    if (error?.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please wait before making more changes.');
    }
    if (error?.response?.status === 403) {
      throw new Error('You do not have permission to update exams.');
    }
    throw new Error(error?.response?.data?.error || 'Failed to update exam');
  }
}

/**
 * Delete exam
 */
export async function secureDeleteExam(params: {
  examId: string;
}): Promise<{success: boolean}> {
  try {
    await apiClient.delete(`/exams/${params.examId}`);
    return {success: true};
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error('You do not have permission to delete exams.');
    }
    if (error?.response?.status === 412) {
      throw new Error('Cannot delete exam. It may have been published or completed.');
    }
    throw new Error(error?.response?.data?.error || 'Failed to delete exam');
  }
}

/**
 * Publish exam results
 */
export async function securePublishExamResults(params: {
  examId: string;
  results: ExamStudentLink[];
}): Promise<{success: boolean}> {
  try {
    await apiClient.post(`/exams/${params.examId}/results`, {
      results: params.results.map(r => ({
        studentId: r.studentId,
        marksObtained: r.score,
        grade: r.grade,
      })),
    });
    return {success: true};
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error('You do not have permission to publish exam results.');
    }
    if (error?.response?.status === 412) {
      throw new Error('Cannot publish results. Exam may not be completed.');
    }
    throw new Error(error?.response?.data?.error || 'Failed to publish exam results');
  }
}

/**
 * Get exams for a course
 */
export const getCourseExams = async (courseId: string): Promise<Exam[]> => {
  try {
    const data = await apiClient.get(`/exams/course/${courseId}`);
    return data.map((exam: any) => ({
      ...exam,
      examDate: exam.examDate ? new Date(exam.examDate).getTime() : Date.now(),
      createdAt: exam.createdAt ? new Date(exam.createdAt).getTime() : Date.now(),
      updatedAt: exam.updatedAt ? new Date(exam.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching exams:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch exams');
  }
};

/**
 * Get exam by ID
 */
export const getExamById = async (examId: string): Promise<Exam | null> => {
  try {
    const data = await apiClient.get(`/exams/${examId}`);
    return {
      ...data,
      examDate: data.examDate ? new Date(data.examDate).getTime() : Date.now(),
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching exam:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch exam');
  }
};

/**
 * Get exam results
 */
export const getExamResults = async (examId: string): Promise<ExamStudentLink[]> => {
  try {
    const data = await apiClient.get(`/exams/${examId}/results`);
    return data.map((result: any) => ({
      examId: result.examId,
      studentId: result.studentId,
      studentName: result.studentName,
      score: result.marksObtained,
      grade: result.grade,
    }));
  } catch (error: any) {
    console.error('Error fetching exam results:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch exam results');
  }
};

/**
 * Detect exam conflicts (client-side check - backend can also validate)
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
    // This would ideally be done on the backend, but for now return empty
    // Backend can validate conflicts when creating/updating exams
    return [];
  } catch (error: any) {
    console.warn('Conflict detection failed:', error);
    return [];
  }
}
