import apiClient from './api.client';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HOLIDAY';

export type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  facultyId: string;
  facultyName: string;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  markedAt: number;
  markedBy: string;
  remarks?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: number;
  updatedAt: number;
};

export type AttendanceSummary = {
  studentId: string;
  courseId: string;
  courseName: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  lastUpdated: number;
};

export type AttendanceStats = {
  overallPercentage: number;
  courseWise: AttendanceSummary[];
  monthlyTrend: {
    month: string;
    percentage: number;
  }[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

// Mark attendance for a student
export const markAttendance = async (
  studentId: string,
  courseId: string,
  status: AttendanceStatus,
  facultyId: string,
  remarks?: string,
  location?: {latitude: number; longitude: number},
): Promise<string> => {
  try {
    const response = await apiClient.post('/attendance/mark', {
      studentId,
      courseId,
      status,
      remarks,
      location,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    throw new Error(error?.response?.data?.error || 'Failed to mark attendance');
  }
};

// Mark attendance for multiple students (bulk)
export const markBulkAttendance = async (
  records: Array<{
    studentId: string;
    courseId: string;
    status: AttendanceStatus;
  }>,
  facultyId: string,
  courseId: string,
): Promise<void> => {
  try {
    await apiClient.post('/attendance/mark-bulk', {
      records,
      courseId,
    });
  } catch (error: any) {
    console.error('Error marking bulk attendance:', error);
    throw new Error(error?.response?.data?.error || 'Failed to mark bulk attendance');
  }
};

// Get attendance records for a student
export const getStudentAttendance = async (
  studentId: string,
  courseId?: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> => {
  try {
    const params: any = {};
    if (courseId) params.courseId = courseId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const data = await apiClient.get(`/attendance/student/${studentId}`, params);
    
    // Convert date strings to timestamps for markedAt, createdAt, updatedAt
    return data.map((record: any) => ({
      ...record,
      markedAt: record.markedAt ? new Date(record.markedAt).getTime() : Date.now(),
      createdAt: record.createdAt ? new Date(record.createdAt).getTime() : Date.now(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching student attendance:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch attendance');
  }
};

// Get attendance summary for a student
export const getStudentAttendanceSummary = async (
  studentId: string,
  courseId?: string,
): Promise<AttendanceSummary[]> => {
  try {
    const params = courseId ? {courseId} : {};
    const data = await apiClient.get(`/attendance/student/${studentId}/summary`, params);
    
    return data.map((summary: any) => ({
      ...summary,
      lastUpdated: summary.lastUpdated ? new Date(summary.lastUpdated).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error calculating attendance summary:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch attendance summary');
  }
};

// Get attendance statistics for a student
export const getStudentAttendanceStats = async (
  studentId: string,
): Promise<AttendanceStats> => {
  try {
    const summaries = await getStudentAttendanceSummary(studentId);
    
    // Calculate overall percentage
    const totalClasses = summaries.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = summaries.reduce(
      (sum, s) => sum + s.present + s.late + s.excused,
      0,
    );
    const overallPercentage =
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    // Calculate monthly trend (last 6 months)
    const records = await getStudentAttendance(studentId);
    const monthlyMap = new Map<string, {total: number; attended: number}>();

    records.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {total: 0, attended: 0});
      }
      const monthData = monthlyMap.get(month)!;
      monthData.total++;
      if (['PRESENT', 'LATE', 'EXCUSED'].includes(record.status)) {
        monthData.attended++;
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallPercentage < 50) {
      riskLevel = 'CRITICAL';
    } else if (overallPercentage < 65) {
      riskLevel = 'HIGH';
    } else if (overallPercentage < 75) {
      riskLevel = 'MEDIUM';
    }

    return {
      overallPercentage,
      courseWise: summaries,
      monthlyTrend,
      riskLevel,
    };
  } catch (error: any) {
    console.error('Error calculating attendance stats:', error);
    throw new Error(error?.response?.data?.error || 'Failed to calculate attendance stats');
  }
};

// Get attendance records for a course (faculty view)
export const getCourseAttendance = async (
  courseId: string,
  date?: string,
): Promise<AttendanceRecord[]> => {
  try {
    const params = date ? {date} : {};
    const data = await apiClient.get(`/attendance/course/${courseId}`, params);
    
    // Convert date strings to timestamps
    return data.map((record: any) => ({
      ...record,
      markedAt: record.markedAt ? new Date(record.markedAt).getTime() : Date.now(),
      createdAt: record.createdAt ? new Date(record.createdAt).getTime() : Date.now(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching course attendance:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch course attendance');
  }
};
