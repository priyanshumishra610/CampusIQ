import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
  getStudentAttendanceStats,
  getCourseAttendance,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceStats,
  AttendanceStatus,
} from '../../services/attendance.service';

type AttendanceState = {
  records: AttendanceRecord[];
  summary: AttendanceSummary[];
  stats: AttendanceStats | null;
  loading: boolean;
  error?: string;
  lastFetched?: number;
};

const initialState: AttendanceState = {
  records: [],
  summary: [],
  stats: null,
  loading: false,
};

export const fetchStudentAttendance = createAsyncThunk(
  'attendance/fetchStudent',
  async (
    {studentId, courseId, startDate, endDate}: {
      studentId: string;
      courseId?: string;
      startDate?: string;
      endDate?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      return await getStudentAttendance(studentId, courseId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch attendance');
    }
  },
);

export const fetchStudentAttendanceSummary = createAsyncThunk(
  'attendance/fetchSummary',
  async ({studentId, courseId}: {studentId: string; courseId?: string}, {rejectWithValue}) => {
    try {
      return await getStudentAttendanceSummary(studentId, courseId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch attendance summary');
    }
  },
);

export const fetchStudentAttendanceStats = createAsyncThunk(
  'attendance/fetchStats',
  async (studentId: string, {rejectWithValue}) => {
    try {
      return await getStudentAttendanceStats(studentId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch attendance stats');
    }
  },
);

export const fetchCourseAttendance = createAsyncThunk(
  'attendance/fetchCourse',
  async ({courseId, date}: {courseId: string; date?: string}, {rejectWithValue}) => {
    try {
      return await getCourseAttendance(courseId, date);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch course attendance');
    }
  },
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendance: state => {
      state.records = [];
      state.summary = [];
      state.stats = null;
      state.error = undefined;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchStudentAttendance.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchStudentAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentAttendanceSummary.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentAttendanceSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchStudentAttendanceSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentAttendanceStats.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentAttendanceStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStudentAttendanceStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCourseAttendance.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchCourseAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCourseAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearAttendance} = attendanceSlice.actions;
export default attendanceSlice.reducer;

