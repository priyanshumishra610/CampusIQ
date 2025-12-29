import apiClient from './api.client';

export type JobPostingStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEWED' | 'OFFERED' | 'REJECTED' | 'WITHDRAWN';

export type JobPosting = {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  employmentType: string;
  location?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  status: JobPostingStatus;
  postedBy: string;
  postedAt?: number;
  closingDate?: string;
  createdAt: number;
  updatedAt: number;
};

export type JobApplication = {
  id: string;
  jobPostingId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: number;
  shortlistedAt?: number;
  shortlistedBy?: string;
  interviewScheduledAt?: number;
  interviewNotes?: string;
  createdAt: number;
  updatedAt: number;
};

export const getJobPostings = async (filters?: {status?: string; department?: string; page?: number; limit?: number}) => {
  try {
    const data = await apiClient.get('/hr/recruitment/postings', filters);
    return {
      postings: data.postings.map((p: any) => ({
        ...p,
        postedAt: p.posted_at ? new Date(p.posted_at).getTime() : undefined,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
        updatedAt: p.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch job postings');
  }
};

export const getJobPosting = async (id: string): Promise<JobPosting> => {
  try {
    const data = await apiClient.get(`/hr/recruitment/postings/${id}`);
    return {
      ...data,
      postedAt: data.posted_at ? new Date(data.posted_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch job posting');
  }
};

export const createJobPosting = async (posting: Partial<JobPosting>): Promise<JobPosting> => {
  try {
    const data = await apiClient.post('/hr/recruitment/postings', posting);
    return {
      ...data,
      postedAt: data.posted_at ? new Date(data.posted_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create job posting');
  }
};

export const updateJobPosting = async (id: string, updates: Partial<JobPosting>): Promise<JobPosting> => {
  try {
    const data = await apiClient.put(`/hr/recruitment/postings/${id}`, updates);
    return {
      ...data,
      postedAt: data.posted_at ? new Date(data.posted_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update job posting');
  }
};

export const getApplications = async (jobPostingId: string): Promise<JobApplication[]> => {
  try {
    const data = await apiClient.get(`/hr/recruitment/postings/${jobPostingId}/applications`);
    return data.map((app: any) => ({
      ...app,
      appliedAt: app.applied_at ? new Date(app.applied_at).getTime() : Date.now(),
      shortlistedAt: app.shortlisted_at ? new Date(app.shortlisted_at).getTime() : undefined,
      interviewScheduledAt: app.interview_scheduled_at ? new Date(app.interview_scheduled_at).getTime() : undefined,
      createdAt: app.created_at ? new Date(app.created_at).getTime() : Date.now(),
      updatedAt: app.updated_at ? new Date(app.updated_at).getTime() : Date.now(),
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch applications');
  }
};

export const createApplication = async (application: Partial<JobApplication>): Promise<JobApplication> => {
  try {
    const data = await apiClient.post('/hr/recruitment/applications', application);
    return {
      ...data,
      appliedAt: data.applied_at ? new Date(data.applied_at).getTime() : Date.now(),
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create application');
  }
};

export const updateApplication = async (id: string, updates: Partial<JobApplication>): Promise<JobApplication> => {
  try {
    const data = await apiClient.put(`/hr/recruitment/applications/${id}`, updates);
    return {
      ...data,
      appliedAt: data.applied_at ? new Date(data.applied_at).getTime() : Date.now(),
      shortlistedAt: data.shortlisted_at ? new Date(data.shortlisted_at).getTime() : undefined,
      interviewScheduledAt: data.interview_scheduled_at ? new Date(data.interview_scheduled_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update application');
  }
};

