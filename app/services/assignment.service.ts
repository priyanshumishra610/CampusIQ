import apiClient from './api.client';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export type Assignment = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  facultyId: string;
  facultyName: string;
  dueDate: number; // timestamp
  maxMarks: number;
  status: AssignmentStatus;
  attachments?: string[]; // URLs or file paths
  rubric?: {
    criteria: string;
    maxPoints: number;
  }[];
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  content: string;
  attachments?: string[]; // URLs or file paths
  status: SubmissionStatus;
  submittedAt?: number;
  gradedAt?: number;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: string;
  createdAt: number;
  updatedAt: number;
};

// Create assignment (faculty)
export const createAssignment = async (
  assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
): Promise<string> => {
  try {
    const response = await apiClient.post('/assignments', {
      ...assignment,
      dueDate: new Date(assignment.dueDate).toISOString(),
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create assignment');
  }
};

// Publish assignment
export const publishAssignment = async (assignmentId: string): Promise<void> => {
  try {
    await apiClient.post(`/assignments/${assignmentId}/publish`);
  } catch (error: any) {
    console.error('Error publishing assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to publish assignment');
  }
};

// Get assignments for a course
export const getCourseAssignments = async (
  courseId: string,
  status?: AssignmentStatus,
): Promise<Assignment[]> => {
  try {
    const params = status ? {status} : {};
    const data = await apiClient.get(`/assignments/course/${courseId}`, params);
    
    return data.map((assignment: any) => ({
      ...assignment,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).getTime() : Date.now(),
      createdAt: assignment.createdAt ? new Date(assignment.createdAt).getTime() : Date.now(),
      updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt).getTime() : Date.now(),
      publishedAt: assignment.publishedAt ? new Date(assignment.publishedAt).getTime() : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching course assignments:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch assignments');
  }
};

// Get assignments for a student
export const getStudentAssignments = async (
  studentId: string,
  courseId?: string,
): Promise<Assignment[]> => {
  try {
    const params = courseId ? {courseId} : {};
    const data = await apiClient.get(`/assignments/student/${studentId}`, params);
    
    return data.map((assignment: any) => ({
      ...assignment,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).getTime() : Date.now(),
      createdAt: assignment.createdAt ? new Date(assignment.createdAt).getTime() : Date.now(),
      updatedAt: assignment.updatedAt ? new Date(assignment.updatedAt).getTime() : Date.now(),
      publishedAt: assignment.publishedAt ? new Date(assignment.publishedAt).getTime() : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching student assignments:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch assignments');
  }
};

// Get assignment by ID
export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  try {
    const data = await apiClient.get(`/assignments/${assignmentId}`);
    
    return {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).getTime() : Date.now(),
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
      publishedAt: data.publishedAt ? new Date(data.publishedAt).getTime() : undefined,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch assignment');
  }
};

// Submit assignment (student)
export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  content: string,
  attachments?: string[],
): Promise<string> => {
  try {
    const response = await apiClient.post(`/assignments/${assignmentId}/submit`, {
      content,
      attachments,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to submit assignment');
  }
};

// Get submission for a student
export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string,
): Promise<AssignmentSubmission | null> => {
  try {
    const data = await apiClient.get(`/assignments/${assignmentId}/submission`, {studentId});
    
    if (!data) return null;
    
    return {
      ...data,
      submittedAt: data.submittedAt ? new Date(data.submittedAt).getTime() : undefined,
      gradedAt: data.gradedAt ? new Date(data.gradedAt).getTime() : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching submission:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch submission');
  }
};

// Get all submissions for an assignment (faculty)
export const getAssignmentSubmissions = async (
  assignmentId: string,
): Promise<AssignmentSubmission[]> => {
  try {
    const data = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    
    return data.map((submission: any) => ({
      ...submission,
      submittedAt: submission.submittedAt ? new Date(submission.submittedAt).getTime() : undefined,
      gradedAt: submission.gradedAt ? new Date(submission.gradedAt).getTime() : undefined,
      createdAt: submission.createdAt ? new Date(submission.createdAt).getTime() : Date.now(),
      updatedAt: submission.updatedAt ? new Date(submission.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching assignment submissions:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch submissions');
  }
};

// Grade assignment submission (faculty)
export const gradeSubmission = async (
  submissionId: string,
  marksObtained: number,
  feedback: string,
  gradedBy: string,
): Promise<void> => {
  try {
    await apiClient.post(`/assignments/submissions/${submissionId}/grade`, {
      marksObtained,
      feedback,
    });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    throw new Error(error?.response?.data?.error || 'Failed to grade submission');
  }
};

// Get student's assignment summary
export const getStudentAssignmentSummary = async (
  studentId: string,
): Promise<{
  total: number;
  submitted: number;
  pending: number;
  graded: number;
  overdue: number;
}> => {
  try {
    const assignments = await getStudentAssignments(studentId);
    const now = Date.now();

    let submitted = 0;
    let graded = 0;
    let overdue = 0;

    for (const assignment of assignments) {
      const submission = await getStudentSubmission(assignment.id, studentId);
      
      if (submission) {
        submitted++;
        if (submission.status === 'GRADED') {
          graded++;
        }
      } else if (now > assignment.dueDate) {
        overdue++;
      }
    }

    return {
      total: assignments.length,
      submitted,
      pending: assignments.length - submitted,
      graded,
      overdue,
    };
  } catch (error: any) {
    console.error('Error calculating assignment summary:', error);
    throw new Error(error?.response?.data?.error || 'Failed to calculate assignment summary');
  }
};

// Update assignment
export const updateAssignment = async (
  assignmentId: string,
  updates: Partial<Assignment>,
): Promise<void> => {
  try {
    const updateData: any = {...updates};
    if (updates.dueDate) {
      updateData.dueDate = new Date(updates.dueDate).toISOString();
    }
    await apiClient.put(`/assignments/${assignmentId}`, updateData);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update assignment');
  }
};

// Delete assignment
export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  try {
    await apiClient.delete(`/assignments/${assignmentId}`);
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete assignment');
  }
};
