import apiClient from './api.client';

export type EmployeeStatus = 'ACTIVE' | 'ONBOARDING' | 'OFFBOARDING' | 'INACTIVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export type Employee = {
  id: string;
  employeeId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  dateOfJoining: string;
  department?: string;
  designation?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  reportingManagerId?: string;
  reportingManager?: {
    firstName: string;
    lastName: string;
  };
  workLocation?: string;
  salaryStructureId?: string;
  profileImageUrl?: string;
  documents?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  address?: string;
  createdAt: number;
  updatedAt: number;
};

export type EmployeeFilters = {
  department?: string;
  status?: EmployeeStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export type EmployeeHierarchy = {
  employee: Employee;
  manager: Employee | null;
  directReports: Employee[];
};

// Get all employees
export const getEmployees = async (filters?: EmployeeFilters): Promise<{
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  try {
    const data = await apiClient.get('/hr/employees', filters);
    return {
      employees: data.employees.map((emp: any) => ({
        ...emp,
        createdAt: emp.created_at ? new Date(emp.created_at).getTime() : Date.now(),
        updatedAt: emp.updated_at ? new Date(emp.updated_at).getTime() : Date.now(),
      })),
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch employees');
  }
};

// Get employee by ID
export const getEmployee = async (id: string): Promise<Employee> => {
  try {
    const data = await apiClient.get(`/hr/employees/${id}`);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    console.error('Error fetching employee:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch employee');
  }
};

// Create employee
export const createEmployee = async (employee: Partial<Employee>): Promise<Employee> => {
  try {
    const data = await apiClient.post('/hr/employees', {
      employeeId: employee.employeeId,
      userId: employee.userId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      dateOfBirth: employee.dateOfBirth,
      dateOfJoining: employee.dateOfJoining,
      department: employee.department,
      designation: employee.designation,
      employmentType: employee.employmentType,
      reportingManagerId: employee.reportingManagerId,
      workLocation: employee.workLocation,
      salaryStructureId: employee.salaryStructureId,
      emergencyContact: employee.emergencyContact,
      address: employee.address,
    });
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create employee');
  }
};

// Update employee
export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  try {
    const data = await apiClient.put(`/hr/employees/${id}`, updates);
    return {
      ...data,
      createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
    };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update employee');
  }
};

// Delete employee
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/hr/employees/${id}`);
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete employee');
  }
};

// Get employee hierarchy
export const getEmployeeHierarchy = async (id: string): Promise<EmployeeHierarchy> => {
  try {
    const data = await apiClient.get(`/hr/employees/${id}/hierarchy`);
    return {
      employee: {
        ...data.employee,
        createdAt: data.employee.created_at ? new Date(data.employee.created_at).getTime() : Date.now(),
        updatedAt: data.employee.updated_at ? new Date(data.employee.updated_at).getTime() : Date.now(),
      },
      manager: data.manager ? {
        ...data.manager,
        createdAt: data.manager.created_at ? new Date(data.manager.created_at).getTime() : Date.now(),
        updatedAt: data.manager.updated_at ? new Date(data.manager.updated_at).getTime() : Date.now(),
      } : null,
      directReports: data.directReports.map((emp: any) => ({
        ...emp,
        createdAt: emp.created_at ? new Date(emp.created_at).getTime() : Date.now(),
        updatedAt: emp.updated_at ? new Date(emp.updated_at).getTime() : Date.now(),
      })),
    };
  } catch (error: any) {
    console.error('Error fetching employee hierarchy:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch employee hierarchy');
  }
};

