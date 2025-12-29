import apiClient from './api.client';
import {getCurrentLocation} from './maps.service';

export type MentalHealthCheckResult = {
  score: number; // 0-100
  level: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' | 'CRITICAL';
  recommendations: string[];
  resources: string[];
  timestamp: number;
};

export type CounselingSession = {
  id: string;
  studentId: string;
  studentName: string;
  counselorId: string;
  counselorName: string;
  scheduledDate: number;
  duration: number; // minutes
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type SOSAlert = {
  id: string;
  userId: string;
  userName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  respondedBy?: string;
  responseTime?: number;
  createdAt: number;
  resolvedAt?: number;
};

export type IncidentReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  type: 'HARASSMENT' | 'ABUSE' | 'RAGGING' | 'SAFETY' | 'OTHER';
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  anonymous: boolean;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
};

// Mental health check
export const performMentalHealthCheck = async (
  userId: string,
  responses: {
    stress: number; // 1-5
    sleep: number; // 1-5
    mood: number; // 1-5
    energy: number; // 1-5
    social: number; // 1-5
  },
): Promise<MentalHealthCheckResult> => {
  try {
    // Calculate score (each response is 1-5, convert to 0-100 scale)
    const score = Math.round(
      ((responses.stress + responses.sleep + responses.mood + responses.energy + responses.social) / 25) * 100,
    );
    
    let level: MentalHealthCheckResult['level'] = 'EXCELLENT';
    if (score < 40) {
      level = 'CRITICAL';
    } else if (score < 60) {
      level = 'POOR';
    } else if (score < 75) {
      level = 'MODERATE';
    } else if (score < 90) {
      level = 'GOOD';
    }
    
    const recommendations: string[] = [];
    const resources: string[] = [];
    
    if (responses.stress < 3) {
      recommendations.push('Consider stress management techniques like meditation or exercise');
      resources.push('Campus counseling services');
    }
    if (responses.sleep < 3) {
      recommendations.push('Improve sleep hygiene - maintain regular sleep schedule');
      resources.push('Sleep wellness resources');
    }
    if (responses.mood < 3) {
      recommendations.push('Consider speaking with a counselor or trusted friend');
      resources.push('Mental health counseling');
    }
    if (level === 'CRITICAL' || level === 'POOR') {
      recommendations.push('Please schedule a counseling session immediately');
      resources.push('Emergency counseling hotline');
    }
    
    // Note: Backend doesn't have health checks endpoint yet
    // This would need to be added
    
    return {
      score,
      level,
      recommendations,
      resources,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error performing mental health check:', error);
    throw error;
  }
};

// Book counseling session
export const bookCounselingSession = async (
  studentId: string,
  counselorId: string,
  scheduledDate: number,
  duration: number = 60,
): Promise<string> => {
  try {
    // Note: Backend doesn't have counseling sessions endpoint yet
    // This would need to be added
    throw new Error('Counseling session booking not yet implemented in backend');
  } catch (error) {
    console.error('Error booking counseling session:', error);
    throw error;
  }
};

// Get counseling sessions
export const getCounselingSessions = async (
  userId: string,
  role: 'STUDENT' | 'COUNSELOR',
): Promise<CounselingSession[]> => {
  try {
    // Note: Backend doesn't have counseling sessions endpoint yet
    return [];
  } catch (error) {
    console.error('Error fetching counseling sessions:', error);
    throw error;
  }
};

// Create SOS alert
export const createSOSAlert = async (
  userId: string,
  message?: string,
): Promise<string> => {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      throw new Error('Location not available');
    }

    const response = await apiClient.post('/security/sos', {
      latitude: location.lat,
      longitude: location.lng,
      message,
    });
    
    return response.id;
  } catch (error: any) {
    console.error('Error creating SOS alert:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create SOS alert');
  }
};

// Get SOS alerts
export const getSOSAlerts = async (status?: 'ACTIVE' | 'RESOLVED'): Promise<SOSAlert[]> => {
  try {
    const params = status ? {status} : {};
    const data = await apiClient.get('/security/sos', params);
    
    return data.map((alert: any) => ({
      id: alert.id,
      userId: alert.userId,
      userName: alert.userName || '',
      location: {
        latitude: parseFloat(alert.latitude),
        longitude: parseFloat(alert.longitude),
      },
      message: alert.message,
      status: alert.status,
      respondedBy: alert.respondedBy,
      responseTime: alert.responseTime,
      createdAt: alert.createdAt ? new Date(alert.createdAt).getTime() : Date.now(),
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching SOS alerts:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch SOS alerts');
  }
};

// Report incident
export const reportIncident = async (
  reporterId: string,
  type: IncidentReport['type'],
  description: string,
  location?: {latitude: number; longitude: number},
  anonymous: boolean = false,
): Promise<string> => {
  try {
    // Use security incidents endpoint
    const response = await apiClient.post('/security/incidents', {
      title: `${type} Incident Report`,
      description,
      location: location ? `${location.latitude}, ${location.longitude}` : undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      severity: type === 'HARASSMENT' || type === 'ABUSE' ? 'HIGH' : 'MEDIUM',
    });
    
    return response.id;
  } catch (error: any) {
    console.error('Error reporting incident:', error);
    throw new Error(error?.response?.data?.error || 'Failed to report incident');
  }
};

// Get incident reports
export const getIncidentReports = async (
  reporterId?: string,
  status?: IncidentReport['status'],
): Promise<IncidentReport[]> => {
  try {
    const params: any = {};
    if (status) params.status = status;
    
    const data = await apiClient.get('/security/incidents', params);
    
    return data.map((incident: any) => ({
      id: incident.id,
      reporterId: incident.reportedBy,
      reporterName: incident.reporterName || '',
      type: 'OTHER', // Map from backend type if available
      description: incident.description,
      location: incident.latitude && incident.longitude ? {
        latitude: parseFloat(incident.latitude),
        longitude: parseFloat(incident.longitude),
      } : undefined,
      anonymous: false,
      status: incident.status,
      assignedTo: incident.assignedTo,
      priority: incident.severity,
      createdAt: incident.createdAt ? new Date(incident.createdAt).getTime() : Date.now(),
      updatedAt: incident.updatedAt ? new Date(incident.updatedAt).getTime() : Date.now(),
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt).getTime() : undefined,
    }));
  } catch (error: any) {
    console.error('Error fetching incident reports:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch incident reports');
  }
};
