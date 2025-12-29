import apiClient from './api.client';

export type HolidayType = 'NATIONAL' | 'STATE' | 'RELIGIOUS' | 'FESTIVAL' | 'GOVERNMENT';

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description?: string;
  isRecurring: boolean;
  recurringMonth?: number;
  recurringDay?: number;
  year?: number;
  createdAt: string;
  updatedAt: string;
};

export const getHolidays = async (filters?: {
  startDate?: string;
  endDate?: string;
  type?: HolidayType;
  year?: number;
}): Promise<Holiday[]> => {
  try {
    const data = await apiClient.get('/hr/holidays', filters);
    return data.map((holiday: any) => ({
      ...holiday,
      createdAt: holiday.created_at || holiday.createdAt,
      updatedAt: holiday.updated_at || holiday.updatedAt,
    }));
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch holidays');
  }
};

export const getHoliday = async (id: string): Promise<Holiday> => {
  try {
    const data = await apiClient.get(`/hr/holidays/${id}`);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to fetch holiday');
  }
};

export const createHoliday = async (holiday: Partial<Holiday>): Promise<Holiday> => {
  try {
    const data = await apiClient.post('/hr/holidays', holiday);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to create holiday');
  }
};

export const updateHoliday = async (id: string, holiday: Partial<Holiday>): Promise<Holiday> => {
  try {
    const data = await apiClient.put(`/hr/holidays/${id}`, holiday);
    return {
      ...data,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to update holiday');
  }
};

export const deleteHoliday = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/hr/holidays/${id}`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to delete holiday');
  }
};

export const calculateWorkingDays = async (startDate: string, endDate: string): Promise<number> => {
  try {
    const data = await apiClient.post('/hr/holidays/calculate-working-days', {
      startDate,
      endDate,
    });
    return data.workingDays;
  } catch (error: any) {
    throw new Error(error?.response?.data?.error || 'Failed to calculate working days');
  }
};

