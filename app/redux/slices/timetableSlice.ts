import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  getStudentTimetable,
  getFacultyTimetable,
  TimetableEntry,
} from '../../services/timetable.service';
import {getCurrentClass, getNextClass, getTimetableForDay} from '../../services/timetable.service';

type TimetableState = {
  entries: TimetableEntry[];
  currentClass: TimetableEntry | null;
  nextClass: TimetableEntry | null;
  loading: boolean;
  error?: string;
  lastFetched?: number;
};

const initialState: TimetableState = {
  entries: [],
  currentClass: null,
  nextClass: null,
  loading: false,
};

export const fetchStudentTimetable = createAsyncThunk(
  'timetable/fetchStudent',
  async (
    {studentId, semester, academicYear}: {studentId: string; semester?: string; academicYear?: string},
    {rejectWithValue},
  ) => {
    try {
      return await getStudentTimetable(studentId, semester, academicYear);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch timetable');
    }
  },
);

export const fetchFacultyTimetable = createAsyncThunk(
  'timetable/fetchFaculty',
  async (
    {facultyId, semester, academicYear}: {facultyId: string; semester?: string; academicYear?: string},
    {rejectWithValue},
  ) => {
    try {
      return await getFacultyTimetable(facultyId, semester, academicYear);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch timetable');
    }
  },
);

const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {
    updateCurrentClass: state => {
      state.currentClass = getCurrentClass(state.entries);
      state.nextClass = getNextClass(state.entries);
    },
    getTimetableForDay: (state, action: PayloadAction<string>) => {
      // This is a helper - actual filtering should be done in components
      return state;
    },
    clearTimetable: state => {
      state.entries = [];
      state.currentClass = null;
      state.nextClass = null;
      state.error = undefined;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchStudentTimetable.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.currentClass = getCurrentClass(action.payload);
        state.nextClass = getNextClass(action.payload);
        state.lastFetched = Date.now();
      })
      .addCase(fetchStudentTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFacultyTimetable.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchFacultyTimetable.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
        state.currentClass = getCurrentClass(action.payload);
        state.nextClass = getNextClass(action.payload);
        state.lastFetched = Date.now();
      })
      .addCase(fetchFacultyTimetable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {updateCurrentClass, clearTimetable} = timetableSlice.actions;
export default timetableSlice.reducer;

