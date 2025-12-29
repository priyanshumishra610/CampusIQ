import apiClient from './api.client';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: {
    module?: string;
    action?: string;
  };
};

export type ChatContext = {
  userId: string;
  userRole: string;
  userName: string;
  campusId?: string;
  department?: string;
  currentModule?: string;
};

// Chat with AI assistant
export const chatWithAssistant = async (
  message: string,
  context: ChatContext,
  conversationHistory: ChatMessage[] = [],
): Promise<string> => {
  try {
    const response = await apiClient.post('/ai/chat', {
      message,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });
    return response.response || 'No response received';
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    throw new Error(error?.response?.data?.error || 'Failed to get AI response. Please try again.');
  }
};

// Get quick answers for common queries
export const getQuickAnswer = async (
  query: string,
  context: ChatContext,
): Promise<string> => {
  try {
    const response = await apiClient.post('/ai/chat', {
      message: query,
      conversationHistory: [],
    });
    return response.response || 'I apologize, but I couldn\'t process your query. Please try rephrasing or contact support.';
  } catch (error: any) {
    console.error('Error getting quick answer:', error);
    return 'I apologize, but I couldn\'t process your query. Please try rephrasing or contact support.';
  }
};

// AI Academic Mentor - specialized for academic guidance
export const getAcademicMentorAdvice = async (
  studentId: string,
  question: string,
  context?: {
    attendance?: number;
    recentGrades?: number[];
    upcomingAssignments?: number;
  },
): Promise<string> => {
  try {
    let contextText = '';
    if (context) {
      if (context.attendance !== undefined) {
        contextText += `Current attendance: ${context.attendance}%\n`;
      }
      if (context.recentGrades && context.recentGrades.length > 0) {
        const avgGrade = context.recentGrades.reduce((a, b) => a + b, 0) / context.recentGrades.length;
        contextText += `Recent average grade: ${avgGrade.toFixed(1)}%\n`;
      }
      if (context.upcomingAssignments !== undefined) {
        contextText += `Upcoming assignments: ${context.upcomingAssignments}\n`;
      }
    }
    
    const prompt = `You are an AI Academic Mentor helping a student. Provide personalized, encouraging academic advice.

Student Question: ${question}

${contextText ? `Student Context:\n${contextText}` : ''}

Provide helpful, actionable advice (3-4 sentences):`;

    const response = await apiClient.post('/ai/chat', {
      message: prompt,
      conversationHistory: [],
    });
    return response.response || 'I\'m here to help with your academic journey. Could you provide more details about what you need help with?';
  } catch (error: any) {
    console.error('Error getting academic mentor advice:', error);
    return 'I\'m here to help with your academic journey. Could you provide more details about what you need help with?';
  }
};

// AI Faculty Teaching Assistant
export const getTeachingAssistantAdvice = async (
  facultyId: string,
  question: string,
  context?: {
    courseName?: string;
    studentCount?: number;
    averageAttendance?: number;
  },
): Promise<string> => {
  try {
    let contextText = '';
    if (context) {
      if (context.courseName) {
        contextText += `Course: ${context.courseName}\n`;
      }
      if (context.studentCount !== undefined) {
        contextText += `Students: ${context.studentCount}\n`;
      }
      if (context.averageAttendance !== undefined) {
        contextText += `Average attendance: ${context.averageAttendance}%\n`;
      }
    }
    
    const prompt = `You are an AI Teaching Assistant helping a faculty member. Provide practical teaching and classroom management advice.

Faculty Question: ${question}

${contextText ? `Context:\n${contextText}` : ''}

Provide helpful, actionable advice (3-4 sentences):`;

    const response = await apiClient.post('/ai/chat', {
      message: prompt,
      conversationHistory: [],
    });
    return response.response || 'I\'m here to help with your teaching needs. Could you provide more details?';
  } catch (error: any) {
    console.error('Error getting teaching assistant advice:', error);
    return 'I\'m here to help with your teaching needs. Could you provide more details?';
  }
};

// AI Admin Copilot
export const getAdminCopilotAdvice = async (
  question: string,
  context?: {
    campusHealthScore?: number;
    pendingTasks?: number;
    activeIssues?: number;
  },
): Promise<string> => {
  try {
    let contextText = '';
    if (context) {
      if (context.campusHealthScore !== undefined) {
        contextText += `Campus Health Score: ${context.campusHealthScore}/100\n`;
      }
      if (context.pendingTasks !== undefined) {
        contextText += `Pending tasks: ${context.pendingTasks}\n`;
      }
      if (context.activeIssues !== undefined) {
        contextText += `Active issues: ${context.activeIssues}\n`;
      }
    }
    
    const prompt = `You are an AI Admin Copilot helping campus administrators. Provide strategic, data-driven advice.

Admin Question: ${question}

${contextText ? `Campus Context:\n${contextText}` : ''}

Provide helpful, actionable administrative advice (3-4 sentences):`;

    const response = await apiClient.post('/ai/chat', {
      message: prompt,
      conversationHistory: [],
    });
    return response.response || 'I\'m here to help with campus administration. Could you provide more details?';
  } catch (error: any) {
    console.error('Error getting admin copilot advice:', error);
    return 'I\'m here to help with campus administration. Could you provide more details?';
  }
};

// Generate recommendations
export const generateRecommendations = async (
  type: 'COURSE' | 'INTERNSHIP' | 'CLUB' | 'EVENT',
  context: ChatContext,
  preferences?: Record<string, any>,
): Promise<string[]> => {
  try {
    const prompt = `Generate 3-5 personalized recommendations for ${type} based on:

User: ${context.userName} (${context.userRole})
${context.department ? `Department: ${context.department}` : ''}
${preferences ? `Preferences: ${JSON.stringify(preferences)}` : ''}

Provide recommendations as a JSON array of strings, each recommendation being a brief description (one sentence).`;

    const response = await apiClient.post('/ai/chat', {
      message: prompt,
      conversationHistory: [],
    });
    
    const text = response.response || '';
    
    // Try to parse JSON, fallback to simple parsing
    try {
      const json = JSON.parse(text);
      return Array.isArray(json) ? json : [text];
    } catch {
      // If not JSON, split by lines or sentences
      return text.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return ['Recommendations are currently unavailable. Please check back later.'];
  }
};
