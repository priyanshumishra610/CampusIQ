import apiClient from './api.client';

export type LeaveType = 'PL' | 'SL' | 'CL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'COMPENSATORY' | 'BEREAVEMENT' | 'OTHER';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalLevel = 'MANAGER' | 'HR';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDepartment?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
  status: LeaveRequestStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  managerApprovalStatus: ApprovalStatus;
  managerApprovedBy?: string;
  managerApprovedByName?: string;
  managerApprovedAt?: string;
  hrApprovalStatus: ApprovalStatus;
  hrApprovedBy?: string;
  hrApprovedByName?: string;
  hrApprovedAt?: string;
  requiresHrApproval: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeaveBalance = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  totalAllocated: number;
  used: number;
  pending: number;
  balance: number;
  carryForward: number;
  accrued: number;
  year: number;
  yearlyAllocation?: number;
  maxCarryForward?: number;
  createdAt: string;
  updatedAt: string;
};

export type LeaveStatistics = {
  pendingApprovals: number;
  byType: Array<{
    leaveType: LeaveType;
    count: number;
    totalDays: number;
  }>;
  byStatus: Array<{
    status: LeaveRequestStatus;
    count: number;
  }>;
};

export const getLeaveRequests = async (filters?: {
  employeeId?: string;
  status?: LeaveRequestStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  department?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const data = await apiClient.get('/hr/leave/requests', filters);
    return {
      requests: data.requests.map((req: any) => ({
        ...req,
        createdAt: req.created_at || req.createdAt,
        updatedAt: req.updated_at || req.updatedAt,
        approvedAt: req.approved_at || req.approvedAt,
        managerApprovedAt: req.manager_approved_at || req.managerApprovedAt,
        hrApprovedAt: req.hr_approved_at || req.hrApprovedAt,
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch leave requests');
  }
};

export const getLeaveRequest = async (id: string): Promise<LeaveRequest> => {
  try {
    const data = await apiClient.get(`/hr/leave/requests/${id}`);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      approvedAt: data.approved_at || data.approvedAt,
      managerApprovedAt: data.manager_approved_at || data.managerApprovedAt,
      hrApprovedAt: data.hr_approved_at || data.hrApprovedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch leave request');
  }
};

export const createLeaveRequest = async (request: {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<LeaveRequest> => {
  try {
    const data = await apiClient.post('/hr/leave/requests', request);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      approvedAt: data.approved_at || data.approvedAt,
      managerApprovedAt: data.manager_approved_at || data.managerApprovedAt,
      hrApprovedAt: data.hr_approved_at || data.hrApprovedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create leave request');
  }
};

export const approveLeaveRequest = async (
  id: string,
  action: 'APPROVE' | 'REJECT',
  approvalLevel: ApprovalLevel,
  rejectionReason?: string
): Promise<LeaveRequest> => {
  try {
    const data = await apiClient.put(`/hr/leave/requests/${id}/approve`, {
      action,
      approvalLevel,
      rejectionReason,
    });
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      approvedAt: data.approved_at || data.approvedAt,
      managerApprovedAt: data.manager_approved_at || data.managerApprovedAt,
      hrApprovedAt: data.hr_approved_at || data.hrApprovedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update leave request');
  }
};

export const getLeaveBalances = async (employeeId: string, year?: number): Promise<LeaveBalance[]> => {
  try {
    const data = await apiClient.get(`/hr/leave/balances/${employeeId}`, year ? {year} : {});
    return data.map((bal: any) => ({
      ...bal,
      createdAt: bal.created_at || bal.createdAt,
      updatedAt: bal.updated_at || bal.updatedAt,
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch leave balances');
  }
};

export const updateLeaveBalance = async (balance: Partial<LeaveBalance>): Promise<LeaveBalance> => {
  try {
    const data = await apiClient.post('/hr/leave/balances', balance);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update leave balance');
  }
};

export const getLeaveStatistics = async (filters?: {
  department?: string;
  year?: number;
}): Promise<LeaveStatistics> => {
  try {
    const data = await apiClient.get('/hr/leave/statistics', filters);
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch leave statistics');
  }
};

// Leave type display names
export const getLeaveTypeDisplayName = (type: LeaveType): string => {
  const names: Record<LeaveType, string> = {
    PL: 'Paid Leave',
    SL: 'Sick Leave',
    CL: 'Casual Leave',
    MATERNITY: 'Maternity Leave',
    PATERNITY: 'Paternity Leave',
    UNPAID: 'Unpaid Leave',
    COMPENSATORY: 'Compensatory Leave',
    BEREAVEMENT: 'Bereavement Leave',
    OTHER: 'Other',
  };
  return names[type] || type;
};

