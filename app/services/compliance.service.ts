import apiClient from './api.client';

export type HRPolicy = {
  id: string;
  title: string;
  category?: string;
  content: string;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  requiresAcknowledgment: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

export type PolicyAcknowledgment = {
  id: string;
  policyId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  acknowledgedAt: number;
  ipAddress?: string;
};

export const getHRPolicies = async (filters?: {category?: string; page?: number; limit?: number}) => {
  try {
    const data = await apiClient.get('/hr/compliance/policies', filters);
    return {
      policies: data.policies.map((pol: any) => ({
        ...pol,
        createdAt: pol.created_at ? new Date(pol.created_at).getTime() : Date.now(),
        updatedAt: pol.updated_at ? new Date(pol.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch policies');
  }
};

export const getHRPolicy = async (id: string): Promise<HRPolicy> => {
  try {
    const data = await apiClient.get(`/hr/compliance/policies/${id}`);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch policy');
  }
};

export const createHRPolicy = async (policy: Partial<HRPolicy>): Promise<HRPolicy> => {
  try {
    const data = await apiClient.post('/hr/compliance/policies', policy);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create policy');
  }
};

export const updateHRPolicy = async (id: string, updates: Partial<HRPolicy>): Promise<HRPolicy> => {
  try {
    const data = await apiClient.put(`/hr/compliance/policies/${id}`, updates);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update policy');
  }
};

export const getPolicyAcknowledgments = async (policyId: string): Promise<PolicyAcknowledgment[]> => {
  try {
    const data = await apiClient.get(`/hr/compliance/policies/${policyId}/acknowledgments`);
    return data.map((ack: any) => ({
      ...ack,
      acknowledgedAt: ack.acknowledged_at ? new Date(ack.acknowledged_at).getTime() : Date.now(),
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch acknowledgments');
  }
};

export const acknowledgePolicy = async (policyId: string, employeeId: string): Promise<PolicyAcknowledgment> => {
  try {
    const data = await apiClient.post(`/hr/compliance/policies/${policyId}/acknowledge`, {employeeId});
    return {
      ...data,
      acknowledgedAt: data.acknowledged_at ? new Date(data.acknowledged_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to acknowledge policy');
  }
};

export const getPendingAcknowledgments = async (employeeId: string): Promise<HRPolicy[]> => {
  try {
    const data = await apiClient.get(`/hr/compliance/acknowledgments/pending/${employeeId}`);
    return data.map((pol: any) => ({
      ...pol,
      createdAt: pol.created_at ? new Date(pol.created_at).getTime() : Date.now(),
      updatedAt: pol.updated_at ? new Date(pol.updated_at).getTime() : Date.now(),
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch pending acknowledgments');
  }
};

