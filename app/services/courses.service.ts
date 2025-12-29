import apiClient from './api.client';

export type Course = {
  id: string;
  code: string;
  name: string;
  description?: string;
  facultyId?: string;
  department?: string;
  credits?: number;
  semester?: string;
  academicYear?: string;
  createdAt: number;
  updatedAt: number;
};

// Get courses
export const getCourses = async (filters?: {
  facultyId?: string;
  department?: string;
}): Promise<Course[]> => {
  try {
    const params: any = {};
    if (filters?.facultyId) params.facultyId = filters.facultyId;
    if (filters?.department) params.department = filters.department;

    const data = await apiClient.get('/courses', params);
    
    return data.map((course: any) => ({
      ...course,
      createdAt: course.createdAt ? new Date(course.createdAt).getTime() : Date.now(),
      updatedAt: course.updatedAt ? new Date(course.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch courses');
  }
};

// Get course by ID
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const data = await apiClient.get(`/courses/${courseId}`);
    
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching course:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch course');
  }
};

// Get enrolled students for a course
export const getCourseStudents = async (courseId: string): Promise<any[]> => {
  try {
    const data = await apiClient.get(`/courses/${courseId}/students`);
    return data;
  } catch (error: any) {
    console.error('Error fetching course students:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch course students');
  }
};

// Create course
export const createCourse = async (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const response = await apiClient.post('/courses', course);
    return response.id;
  } catch (error: any) {
    console.error('Error creating course:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create course');
  }
};

// Enroll student in course
export const enrollStudentInCourse = async (courseId: string, studentId: string): Promise<void> => {
  try {
    await apiClient.post(`/courses/${courseId}/enroll`, {studentId});
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    throw new Error(error?.response?.data?.error || 'Failed to enroll student');
  }
};

