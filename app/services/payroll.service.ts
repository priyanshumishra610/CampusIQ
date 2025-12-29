import apiClient from './api.client';

export type PayrollStatus = 'PENDING' | 'PROCESSED' | 'PAID' | 'FAILED';

export type PayrollRecord = {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDepartment?: string;
  salaryStructureId?: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  bonuses: number;
  incentives: number;
  overtimePay: number;
  leaveDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  paymentDate?: string;
  paymentStatus: PayrollStatus;
  payslipUrl?: string;
  createdAt: number;
  updatedAt: number;
};

export type SalaryStructure = {
  id: string;
  name: string;
  description?: string;
  components: {
    basic: number;
    allowances: Record<string, number>;
    deductions: Record<string, number>;
  };
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export const getPayrollRecords = async (filters?: {
  employeeId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}) => {
  try {
    const data = await apiClient.get('/hr/payroll', filters);
    return {
      records: data.records.map((rec: any) => ({
        ...rec,
        createdAt: rec.created_at ? new Date(rec.created_at).getTime() : Date.now(),
        updatedAt: rec.updated_at ? new Date(rec.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch payroll records');
  }
};

export const getPayrollRecord = async (id: string): Promise<PayrollRecord> => {
  try {
    const data = await apiClient.get(`/hr/payroll/${id}`);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch payroll record');
  }
};

export const generatePayroll = async (params: {
  employeeIds?: string[];
  month: number;
  year: number;
  payPeriodStart: string;
  payPeriodEnd: string;
}): Promise<{records: PayrollRecord[]; count: number}> => {
  try {
    const data = await apiClient.post('/hr/payroll/generate', params);
    return {
      records: data.records.map((rec: any) => ({
        ...rec,
        createdAt: rec.created_at ? new Date(rec.created_at).getTime() : Date.now(),
        updatedAt: rec.updated_at ? new Date(rec.updated_at).getTime() : Date.now(),
      })),
      count: data.count,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to generate payroll');
  }
};

export const updatePayrollRecord = async (id: string, updates: Partial<PayrollRecord>): Promise<PayrollRecord> => {
  try {
    const data = await apiClient.put(`/hr/payroll/${id}`, updates);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update payroll record');
  }
};

export const getSalaryStructures = async (): Promise<SalaryStructure[]> => {
  try {
    const data = await apiClient.get('/hr/payroll/structures');
    return data.map((struct: any) => ({
      ...struct,
      createdAt: struct.created_at ? new Date(struct.created_at).getTime() : Date.now(),
      updatedAt: struct.updated_at ? new Date(struct.updated_at).getTime() : Date.now(),
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch salary structures');
  }
};

export const createSalaryStructure = async (structure: Partial<SalaryStructure>): Promise<SalaryStructure> => {
  try {
    const data = await apiClient.post('/hr/payroll/structures', structure);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create salary structure');
  }
};

