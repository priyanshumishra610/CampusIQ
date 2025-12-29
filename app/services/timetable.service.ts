import apiClient from './api.client';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type TimetableEntry = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  facultyId: string;
  facultyName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  room: string;
  building: string;
  campusId: string;
  semester?: string;
  academicYear?: string;
  createdAt: number;
  updatedAt: number;
};

export type StudentTimetable = {
  studentId: string;
  entries: TimetableEntry[];
  semester: string;
  academicYear: string;
  updatedAt: number;
};

export type FacultyTimetable = {
  facultyId: string;
  entries: TimetableEntry[];
  semester: string;
  academicYear: string;
  updatedAt: number;
};

// Map day number to DayOfWeek
const dayNumberToDay: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

// Get timetable for a student
export const getStudentTimetable = async (
  studentId: string,
  semester?: string,
  academicYear?: string,
): Promise<TimetableEntry[]> => {
  try {
    // Note: Backend timetable endpoint doesn't filter by student yet
    // For now, get all timetable entries and filter client-side
    // This would need backend support for student enrollments
    const params: any = {};
    if (semester) params.semester = semester;
    if (academicYear) params.academicYear = academicYear;

    const data = await apiClient.get('/timetable', params);
    
    return data.map((entry: any) => ({
      ...entry,
      dayOfWeek: dayNumberToDay[entry.dayOfWeek] || 'MONDAY',
      createdAt: entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt).getTime() : Date.now(),
    })).sort((a, b) => {
      const dayOrder: Record<DayOfWeek, number> = {
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
        SUNDAY: 7,
      };
      if (dayOrder[a.dayOfWeek] !== dayOrder[b.dayOfWeek]) {
        return dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      }
      return a.startTime.localeCompare(b.startTime);
    });
  } catch (error: any) {
    console.error('Error fetching student timetable:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch timetable');
  }
};

// Get timetable for a faculty member
export const getFacultyTimetable = async (
  facultyId: string,
  semester?: string,
  academicYear?: string,
): Promise<TimetableEntry[]> => {
  try {
    const params: any = {facultyId};
    if (semester) params.semester = semester;
    if (academicYear) params.academicYear = academicYear;

    const data = await apiClient.get('/timetable', params);
    
    return data.map((entry: any) => ({
      ...entry,
      dayOfWeek: dayNumberToDay[entry.dayOfWeek] || 'MONDAY',
      createdAt: entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now(),
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt).getTime() : Date.now(),
    })).sort((a, b) => {
      const dayOrder: Record<DayOfWeek, number> = {
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
        SUNDAY: 7,
      };
      if (dayOrder[a.dayOfWeek] !== dayOrder[b.dayOfWeek]) {
        return dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      }
      return a.startTime.localeCompare(b.startTime);
    });
  } catch (error: any) {
    console.error('Error fetching faculty timetable:', error);
    throw new Error(error?.response?.data?.error || 'Failed to fetch timetable');
  }
};

// Get timetable entries for a specific day
export const getTimetableForDay = (
  entries: TimetableEntry[],
  day: DayOfWeek,
): TimetableEntry[] => {
  return entries.filter(entry => entry.dayOfWeek === day);
};

// Get current/upcoming class
export const getCurrentClass = (entries: TimetableEntry[]): TimetableEntry | null => {
  const now = new Date();
  const currentDay = getCurrentDayOfWeek(now);
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const todayEntries = getTimetableForDay(entries, currentDay);
  
  for (const entry of todayEntries) {
    if (currentTime >= entry.startTime && currentTime <= entry.endTime) {
      return entry;
    }
  }

  return null;
};

// Get next class
export const getNextClass = (entries: TimetableEntry[]): TimetableEntry | null => {
  const now = new Date();
  const currentDay = getCurrentDayOfWeek(now);
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const dayOrder: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const currentDayIndex = dayOrder.indexOf(currentDay);

  // Check today's remaining classes
  const todayEntries = getTimetableForDay(entries, currentDay);
  for (const entry of todayEntries) {
    if (entry.startTime > currentTime) {
      return entry;
    }
  }

  // Check upcoming days
  for (let i = 1; i < 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = dayOrder[nextDayIndex];
    const nextDayEntries = getTimetableForDay(entries, nextDay);
    if (nextDayEntries.length > 0) {
      return nextDayEntries[0]; // Return first class of the day
    }
  }

  return null;
};

// Helper to get current day of week
const getCurrentDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

// Check for timetable conflicts
export const checkTimetableConflict = (
  newEntry: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>,
  existingEntries: TimetableEntry[],
): boolean => {
  const sameDayEntries = existingEntries.filter(e => e.dayOfWeek === newEntry.dayOfWeek);
  
  for (const entry of sameDayEntries) {
    // Check if times overlap
    if (
      (newEntry.startTime >= entry.startTime && newEntry.startTime < entry.endTime) ||
      (newEntry.endTime > entry.startTime && newEntry.endTime <= entry.endTime) ||
      (newEntry.startTime <= entry.startTime && newEntry.endTime >= entry.endTime)
    ) {
      // Check if same room
      if (entry.room === newEntry.room && entry.building === newEntry.building) {
        return true; // Conflict detected
      }
      // Check if same faculty
      if (entry.facultyId === newEntry.facultyId) {
        return true; // Conflict detected
      }
    }
  }
  
  return false;
};

// Create timetable entry (admin/faculty only)
export const createTimetableEntry = async (
  entry: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    const dayNumberMap: Record<DayOfWeek, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const response = await apiClient.post('/timetable', {
      ...entry,
      dayOfWeek: dayNumberMap[entry.dayOfWeek],
    });
    return response.id;
  } catch (error: any) {
    console.error('Error creating timetable entry:', error);
    throw new Error(error?.response?.data?.error || 'Failed to create timetable entry');
  }
};

// Update timetable entry
export const updateTimetableEntry = async (
  entryId: string,
  updates: Partial<TimetableEntry>,
): Promise<void> => {
  try {
    const updateData: any = {...updates};
    if (updates.dayOfWeek) {
      const dayNumberMap: Record<DayOfWeek, number> = {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
      };
      updateData.dayOfWeek = dayNumberMap[updates.dayOfWeek];
    }
    await apiClient.put(`/timetable/${entryId}`, updateData);
  } catch (error: any) {
    console.error('Error updating timetable entry:', error);
    throw new Error(error?.response?.data?.error || 'Failed to update timetable entry');
  }
};

// Delete timetable entry
export const deleteTimetableEntry = async (entryId: string): Promise<void> => {
  try {
    await apiClient.delete(`/timetable/${entryId}`);
  } catch (error: any) {
    console.error('Error deleting timetable entry:', error);
    throw new Error(error?.response?.data?.error || 'Failed to delete timetable entry');
  }
};
