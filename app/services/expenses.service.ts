import apiClient from './api.client';

export type ExpenseType = 'TRAVEL' | 'MEALS' | 'ACCOMMODATION' | 'TRANSPORT' | 'SUPPLIES' | 'TRAINING' | 'OTHER';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export type ExpenseClaim = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDepartment?: string;
  claimDate: string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: number;
  rejectionReason?: string;
  paymentDate?: string;
  createdAt: number;
  updatedAt: number;
};

export const getExpenseClaims = async (filters?: {
  employeeId?: string;
  status?: ExpenseStatus;
  expenseType?: ExpenseType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const data = await apiClient.get('/hr/expenses', filters);
    return {
      claims: data.claims.map((claim: any) => ({
        ...claim,
        approvedAt: claim.approved_at ? new Date(claim.approved_at).getTime() : undefined,
        createdAt: claim.created_at ? new Date(claim.created_at).getTime() : Date.now(),
        updatedAt: claim.updated_at ? new Date(claim.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch expense claims');
  }
};

export const getExpenseClaim = async (id: string): Promise<ExpenseClaim> => {
  try {
    const data = await apiClient.get(`/hr/expenses/${id}`);
    return {
      ...data,
      approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch expense claim');
  }
};

export const createExpenseClaim = async (claim: Partial<ExpenseClaim>): Promise<ExpenseClaim> => {
  try {
    const data = await apiClient.post('/hr/expenses', claim);
    return {
      ...data,
      approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create expense claim');
  }
};

export const approveExpenseClaim = async (id: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string, paymentDate?: string): Promise<ExpenseClaim> => {
  try {
    const data = await apiClient.put(`/hr/expenses/${id}/approve`, {action, rejectionReason, paymentDate});
    return {
      ...data,
      approvedAt: data.approved_at ? new Date(data.approved_at).getTime() : undefined,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update expense claim');
  }
};

