import apiClient from './api.client';

export type AIProvider = 'gemini' | 'openai' | 'mock';

export type AIContext = 
  | 'campus-assistant'
  | 'academic-advisor'
  | 'teaching-assistant'
  | 'admin-copilot'
  | 'general';

export interface AIRequest {
  prompt: string;
  context?: AIContext;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  tokensUsed?: number;
  error?: string;
}

/**
 * Main AI Gateway function - routes to backend
 */
export const queryAI = async (request: AIRequest): Promise<AIResponse> => {
  try {
    const response = await apiClient.post('/ai/chat', {
      message: request.prompt,
      conversationHistory: [], // Can be passed from caller
    });
    
    return {
      text: response.response || 'No response received',
      provider: response.model || 'gemini',
    };
  } catch (error: any) {
    // Fallback to mock if backend unavailable
    if (error?.response?.status === 503) {
      return {
        text: 'AI service is currently unavailable. Please try again later.',
        provider: 'mock',
        error: 'Service unavailable',
      };
    }
    
    return {
      text: 'Unable to generate response. Please try again later.',
      provider: 'mock',
      error: error?.message || 'Unknown error',
    };
  }
};

/**
 * Convenience functions for specific contexts
 */
export const queryCampusAssistant = async (prompt: string): Promise<string> => {
  const response = await queryAI({prompt, context: 'campus-assistant'});
  return response.text;
};

export const queryAcademicAdvisor = async (prompt: string): Promise<string> => {
  const response = await queryAI({prompt, context: 'academic-advisor'});
  return response.text;
};

export const queryTeachingAssistant = async (prompt: string): Promise<string> => {
  const response = await queryAI({prompt, context: 'teaching-assistant'});
  return response.text;
};

export const queryAdminCopilot = async (prompt: string): Promise<string> => {
  const response = await queryAI({prompt, context: 'admin-copilot'});
  return response.text;
};

/**
 * Health check for AI service
 */
export const checkAIServiceHealth = async (): Promise<{
  provider: AIProvider;
  available: boolean;
  error?: string;
}> => {
  try {
    const response = await queryAI({
      prompt: 'test',
      context: 'general',
      maxTokens: 10,
    });

    return {
      provider: response.provider,
      available: !response.error,
      error: response.error,
    };
  } catch (error: any) {
    return {
      provider: 'mock',
      available: false,
      error: error.message,
    };
  }
};
