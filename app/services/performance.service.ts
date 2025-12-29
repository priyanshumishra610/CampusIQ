import apiClient from './api.client';

export type ReviewType = 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'PROJECT_BASED';
export type ReviewStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

export type PerformanceReview = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDepartment?: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  goals: Array<{id: string; title: string; description: string; target: string; achieved: boolean}>;
  kpis: Record<string, {target: number; achieved: number; unit: string}>;
  achievements?: string;
  areasForImprovement?: string;
  overallRating?: number;
  reviewedBy?: string;
  reviewedAt?: number;
  employeeComments?: string;
  managerComments?: string;
  createdAt: number;
  updatedAt: number;
};

export const getPerformanceReviews = async (filters?: {
  employeeId?: string;
  status?: ReviewStatus;
  reviewType?: ReviewType;
  page?: number;
  limit?: number;
}) => {
  try {
    const data = await apiClient.get('/hr/performance/reviews', filters);
    return {
      reviews: data.reviews.map((rev: any) => ({
        ...rev,
        reviewedAt: rev.reviewed_at ? new Date(rev.reviewed_at).getTime() : undefined,
        createdAt: rev.created_at ? new Date(rev.created_at).getTime() : Date.now(),
        updatedAt: rev.updated_at ? new Date(rev.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch performance reviews');
  }
};

export const getPerformanceReview = async (id: string): Promise<PerformanceReview> => {
  try {
    const data = await apiClient.get(`/hr/performance/reviews/${id}`);
    return {
      ...data,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch performance review');
  }
};

export const createPerformanceReview = async (review: Partial<PerformanceReview>): Promise<PerformanceReview> => {
  try {
    const data = await apiClient.post('/hr/performance/reviews', review);
    return {
      ...data,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create performance review');
  }
};

export const updatePerformanceReview = async (id: string, updates: Partial<PerformanceReview>): Promise<PerformanceReview> => {
  try {
    const data = await apiClient.put(`/hr/performance/reviews/${id}`, updates);
    return {
      ...data,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update performance review');
  }
};

