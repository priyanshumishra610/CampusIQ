import apiClient from './api.client';
import socketClient from './socket.client';

export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type IncidentType =
  | 'UNAUTHORIZED_ACCESS'
  | 'THEFT'
  | 'VANDALISM'
  | 'DISTURBANCE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BREACH'
  | 'OTHER';

export type SecurityIncident = {
  id: string;
  type: IncidentType;
  description: string;
  location?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: IncidentStatus;
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: number;
  timeline?: {
    timestamp: number;
    action: string;
    performedBy: string;
    performedByName: string;
  }[];
  createdAt: number;
  updatedAt: number;
};

export type EmergencyAlert = {
  id: string;
  type: 'SOS' | 'FIRE' | 'MEDICAL' | 'SECURITY_BREACH' | 'NATURAL_DISASTER';
  location: string;
  description: string;
  triggeredBy: string;
  triggeredByName: string;
  status: 'ACTIVE' | 'RESOLVED';
  resolvedAt?: number;
  createdAt: number;
};

// Create SOS alert
export const createSOSAlert = async (
  latitude: number,
  longitude: number,
  message?: string,
): Promise<string> => {
  try {
    const response = await apiClient.post('/security/sos', {
      latitude,
      longitude,
      message,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating SOS alert:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create SOS alert');
  }
};

// Get SOS alerts
export const getSOSAlerts = async (status?: 'ACTIVE' | 'RESOLVED'): Promise<any[]> => {
  try {
    const params = status ? {status} : {};
    const data = await apiClient.get('/security/sos', params);
    return data.map((alert: any) => ({
      ...alert,
      createdAt: alert.createdAt ? new Date(alert.createdAt).getTime() : Date.now(),
      updatedAt: alert.updatedAt ? new Date(alert.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching SOS alerts:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch SOS alerts');
  }
};

// Respond to SOS alert
export const respondToSOS = async (
  alertId: string,
  responseNotes: string,
  status: 'RESOLVED' | 'CANCELLED',
): Promise<void> => {
  try {
    await apiClient.put(`/security/sos/${alertId}/respond`, {
      responseNotes,
      status,
    });
  } catch (error: any) {
    console.error('Error responding to SOS:', error);
    throw new Error(error?.response?.data?.error || 'Failed to respond to SOS alert');
  }
};

// Create security incident
export const createIncident = async (
  incident: Omit<
    SecurityIncident,
    'id' | 'status' | 'createdAt' | 'updatedAt' | 'timeline'
  >,
): Promise<string> => {
  try {
    const response = await apiClient.post('/security/incidents', {
      title: `${incident.type} - ${incident.description.substring(0, 50)}`,
      description: incident.description,
      location: incident.location,
      latitude: undefined, // Extract from location if needed
      longitude: undefined,
      severity: incident.severity,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating incident:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create incident');
  }
};

// Get security incidents
export const getIncidents = async (filters: {
  status?: IncidentStatus;
  type?: IncidentType;
  startDate?: number;
  endDate?: number;
}): Promise<SecurityIncident[]> => {
  try {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.type) params.severity = filters.type; // Map type to severity filter if needed

    const data = await apiClient.get('/security/incidents', params);
    return data.map((incident: any) => ({
      ...incident,
      type: incident.type || 'OTHER',
      createdAt: incident.createdAt ? new Date(incident.createdAt).getTime() : Date.now(),
      updatedAt: incident.updatedAt ? new Date(incident.updatedAt).getTime() : Date.now(),
    }));
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch incidents');
  }
};

// Get incident by ID
export const getIncidentById = async (incidentId: string): Promise<SecurityIncident | null> => {
  try {
    const data = await apiClient.get(`/security/incidents/${incidentId}`);
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : Date.now(),
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error('Error fetching incident:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch incident');
  }
};

// Update incident status
export const updateIncidentStatus = async (
  incidentId: string,
  status: IncidentStatus,
  resolution?: string,
  resolvedBy?: string,
): Promise<void> => {
  try {
    await apiClient.put(`/security/incidents/${incidentId}`, {
      status,
      resolution,
      resolvedBy,
    });
  } catch (error: any) {
    console.error('Error updating incident status:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update incident status');
  }
};

// Trigger emergency alert
export const triggerEmergency = async (
  emergency: Omit<EmergencyAlert, 'id' | 'status' | 'createdAt'>,
): Promise<string> => {
  try {
    const response = await apiClient.post('/security/emergency-alerts', {
      title: `${emergency.type} Alert`,
      message: emergency.description,
      alertType: emergency.type,
      severity: 'CRITICAL',
      location: emergency.location,
    });
    return response.id;
  } catch (error: any) {
    console.error('Error triggering emergency:', error);
    throw new Error(error?.response?.data?.error || 'Failed to trigger emergency');
  }
};

// Get emergency alerts
export const getEmergencyAlerts = async (status?: 'ACTIVE' | 'RESOLVED'): Promise<EmergencyAlert[]> => {
  try {
    // Note: Backend doesn't have separate endpoint for emergency alerts
    // They're part of security incidents
    return [];
  } catch (error: any) {
    console.error('Error fetching emergency alerts:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch emergency alerts');
  }
};

// Resolve emergency
export const resolveEmergency = async (alertId: string): Promise<void> => {
  try {
    await apiClient.put(`/security/incidents/${alertId}`, {
      status: 'RESOLVED',
    });
  } catch (error: any) {
    console.error('Error resolving emergency:', error);
    throw new Error(error?.response?.data?.error || 'Failed to resolve emergency');
  }
};

// Listen for SOS alerts (real-time)
export const listenForSOSAlerts = (callback: (alert: any) => void): (() => void) => {
  return socketClient.on('sos-alert', callback);
};

// Listen for geofence breaches (real-time)
export const listenForGeofenceBreaches = (callback: (breach: any) => void): (() => void) => {
  return socketClient.on('geofence-breach', callback);
};
