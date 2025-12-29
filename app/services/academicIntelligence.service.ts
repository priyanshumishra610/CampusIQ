import apiClient from './api.client';
import {
  getStudentAttendanceStats,
  AttendanceStats,
} from './attendance.service';
import {
  getStudentAssignmentSummary,
} from './assignment.service';

export type StudentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type StudentRiskProfile = {
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  overallRisk: StudentRiskLevel;
  dropoutRisk: number; // 0-100
  academicRisk: number; // 0-100
  attendanceRisk: number; // 0-100
  performanceRisk: number; // 0-100
  riskFactors: string[];
  recommendations: string[];
  lastAnalyzed: number;
};

export type SubjectDifficultyAnalysis = {
  courseId: string;
  courseName: string;
  courseCode: string;
  averageScore: number;
  passRate: number;
  difficultyScore: number; // 0-100, higher = more difficult
  studentCount: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  insights: string[];
};

export type ClassEngagementMetrics = {
  courseId: string;
  courseName: string;
  averageAttendance: number;
  assignmentCompletionRate: number;
  averageSubmissionTime: number; // hours before deadline
  participationScore: number; // 0-100
  engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  insights: string[];
};

export type LearningBehaviorInsights = {
  studentId: string;
  studyPattern: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'MIXED';
  preferredSubjects: string[];
  strugglingSubjects: string[];
  studyConsistency: number; // 0-100
  assignmentTiming: 'EARLY' | 'ON_TIME' | 'LATE';
  recommendations: string[];
};

// Analyze student risk profile
export const analyzeStudentRisk = async (studentId: string): Promise<StudentRiskProfile> => {
  try {
    // Get attendance stats
    const attendanceStats = await getStudentAttendanceStats(studentId);
    
    // Get assignment summary
    const assignmentSummary = await getStudentAssignmentSummary(studentId);
    
    // Get exam results
    try {
      // Get all exams and their results for the student
      // Note: This would need backend support for student exam results
      const examScores: number[] = [];
      
      // For now, calculate based on available data
      const averageExamScore = 0; // Would need exam results endpoint
      
      // Calculate risk scores
      const attendanceRisk = 100 - attendanceStats.overallPercentage;
      const performanceRisk = 100 - averageExamScore;
      const assignmentRisk = assignmentSummary.total > 0
        ? (assignmentSummary.overdue / assignmentSummary.total) * 100
        : 0;
      
      const academicRisk = (performanceRisk + assignmentRisk) / 2;
      
      // Dropout risk calculation (weighted)
      const dropoutRisk = (
        attendanceRisk * 0.3 +
        performanceRisk * 0.4 +
        assignmentRisk * 0.2 +
        (attendanceStats.riskLevel === 'CRITICAL' ? 50 : 0) * 0.1
      );
      
      // Determine overall risk
      let overallRisk: StudentRiskLevel = 'LOW';
      if (dropoutRisk >= 70) {
        overallRisk = 'CRITICAL';
      } else if (dropoutRisk >= 50) {
        overallRisk = 'HIGH';
      } else if (dropoutRisk >= 30) {
        overallRisk = 'MEDIUM';
      }
      
      // Identify risk factors
      const riskFactors: string[] = [];
      if (attendanceStats.overallPercentage < 75) {
        riskFactors.push(`Low attendance (${attendanceStats.overallPercentage}%)`);
      }
      if (averageExamScore < 50 && averageExamScore > 0) {
        riskFactors.push(`Poor exam performance (${averageExamScore.toFixed(1)}% average)`);
      }
      if (assignmentSummary.overdue > 0) {
        riskFactors.push(`${assignmentSummary.overdue} overdue assignments`);
      }
      if (attendanceStats.riskLevel === 'CRITICAL' || attendanceStats.riskLevel === 'HIGH') {
        riskFactors.push('Critical attendance risk');
      }
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (attendanceRisk > 30) {
        recommendations.push('Improve class attendance - consider meeting with academic advisor');
      }
      if (performanceRisk > 40) {
        recommendations.push('Seek additional academic support and tutoring');
      }
      if (assignmentSummary.overdue > 0) {
        recommendations.push('Complete pending assignments to improve grades');
      }
      if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') {
        recommendations.push('Schedule meeting with faculty advisor immediately');
      }
      
      // Get student details
      const studentData = await apiClient.get(`/users/${studentId}`);
      
      return {
        studentId,
        studentName: studentData?.name || '',
        enrollmentNumber: studentData?.enrollmentNumber,
        overallRisk,
        dropoutRisk: Math.round(dropoutRisk),
        academicRisk: Math.round(academicRisk),
        attendanceRisk: Math.round(attendanceRisk),
        performanceRisk: Math.round(performanceRisk),
        riskFactors,
        recommendations,
        lastAnalyzed: Date.now(),
      };
    } catch (error) {
      console.error('Error analyzing student risk:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error analyzing student risk:', error);
    throw error;
  }
};

// Analyze subject difficulty
export const analyzeSubjectDifficulty = async (courseId: string): Promise<SubjectDifficultyAnalysis> => {
  try {
    // Get course details
    const courseData = await apiClient.get(`/courses/${courseId}`);
    
    // Get exam results for this course
    try {
      const examResults = await apiClient.get(`/exams/course/${courseId}/results`);
      
      const scores: number[] = [];
      examResults.forEach((result: any) => {
        if (result.marksObtained && result.maxMarks) {
          scores.push((result.marksObtained / result.maxMarks) * 100);
        }
      });
      
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      
      const passRate = scores.length > 0
        ? (scores.filter(s => s >= 50).length / scores.length) * 100
        : 0;
      
      const difficultyScore = 100 - averageScore;
      
      return {
        courseId,
        courseName: courseData?.name || '',
        courseCode: courseData?.code || '',
        averageScore: Math.round(averageScore),
        passRate: Math.round(passRate),
        difficultyScore: Math.round(difficultyScore),
        studentCount: scores.length,
        trend: 'STABLE', // Would need historical data
        insights: [
          difficultyScore > 70 ? 'High difficulty - consider additional support' : '',
          passRate < 60 ? 'Low pass rate - review teaching methods' : '',
        ].filter(Boolean),
      };
    } catch (error) {
      // Return default if exam results not available
      return {
        courseId,
        courseName: courseData?.name || '',
        courseCode: courseData?.code || '',
        averageScore: 0,
        passRate: 0,
        difficultyScore: 0,
        studentCount: 0,
        trend: 'STABLE',
        insights: [],
      };
    }
  } catch (error) {
    console.error('Error analyzing subject difficulty:', error);
    throw error;
  }
};

// Analyze class engagement
export const analyzeClassEngagement = async (courseId: string): Promise<ClassEngagementMetrics> => {
  try {
    // Get course attendance
    const attendanceRecords = await apiClient.get(`/attendance/course/${courseId}`);
    
    // Calculate average attendance
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r: any) => r.status === 'PRESENT').length;
    const averageAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
    
    // Get assignments
    const assignments = await apiClient.get(`/assignments/course/${courseId}`);
    
    // Calculate assignment completion
    let totalSubmissions = 0;
    let totalAssignments = assignments.length;
    
    for (const assignment of assignments) {
      const submissions = await apiClient.get(`/assignments/${assignment.id}/submissions`);
      totalSubmissions += submissions.length;
    }
    
    const assignmentCompletionRate = totalAssignments > 0
      ? (totalSubmissions / (totalAssignments * 10)) * 100 // Assuming 10 students per course
      : 0;
    
    const participationScore = (averageAttendance * 0.6 + assignmentCompletionRate * 0.4);
    
    let engagementLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (participationScore >= 75) {
      engagementLevel = 'HIGH';
    } else if (participationScore < 50) {
      engagementLevel = 'LOW';
    }
    
    return {
      courseId,
      courseName: assignments[0]?.courseName || '',
      averageAttendance: Math.round(averageAttendance),
      assignmentCompletionRate: Math.round(assignmentCompletionRate),
      averageSubmissionTime: 24, // Would need submission timing data
      participationScore: Math.round(participationScore),
      engagementLevel,
      insights: [
        averageAttendance < 70 ? 'Low attendance - consider engagement strategies' : '',
        assignmentCompletionRate < 60 ? 'Low assignment completion - review difficulty' : '',
      ].filter(Boolean),
    };
  } catch (error) {
    console.error('Error analyzing class engagement:', error);
    throw error;
  }
};

// Analyze learning behavior
export const analyzeLearningBehavior = async (studentId: string): Promise<LearningBehaviorInsights> => {
  try {
    // Get student assignments
    const assignments = await apiClient.get(`/assignments/student/${studentId}`);
    
    // Analyze submission timing
    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    
    for (const assignment of assignments) {
      const submission = await apiClient.get(`/assignments/${assignment.id}/submission`, {studentId});
      if (submission) {
        const submittedAt = submission.submittedAt ? new Date(submission.submittedAt).getTime() : 0;
        const dueDate = assignment.dueDate;
        const hoursBeforeDeadline = (dueDate - submittedAt) / (1000 * 60 * 60);
        
        if (hoursBeforeDeadline > 24) {
          earlyCount++;
        } else if (hoursBeforeDeadline > 0) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      }
    }
    
    const total = earlyCount + onTimeCount + lateCount;
    let assignmentTiming: 'EARLY' | 'ON_TIME' | 'LATE' = 'ON_TIME';
    if (earlyCount > onTimeCount && earlyCount > lateCount) {
      assignmentTiming = 'EARLY';
    } else if (lateCount > onTimeCount && lateCount > earlyCount) {
      assignmentTiming = 'LATE';
    }
    
    const studyConsistency = total > 0
      ? ((earlyCount + onTimeCount) / total) * 100
      : 0;
    
    return {
      studentId,
      studyPattern: 'MIXED', // Would need more data
      preferredSubjects: [], // Would need grade analysis
      strugglingSubjects: [], // Would need grade analysis
      studyConsistency: Math.round(studyConsistency),
      assignmentTiming,
      recommendations: [
        assignmentTiming === 'LATE' ? 'Submit assignments earlier to avoid late penalties' : '',
        studyConsistency < 70 ? 'Improve study consistency for better performance' : '',
      ].filter(Boolean),
    };
  } catch (error) {
    console.error('Error analyzing learning behavior:', error);
    throw error;
  }
};
