import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  getStudentAssignments,
  getCourseAssignments,
  getAssignmentById,
  getStudentSubmission,
  getAssignmentSubmissions,
  getStudentAssignmentSummary,
  Assignment,
  AssignmentSubmission,
} from '../../services/assignment.service';

type AssignmentState = {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  submissions: AssignmentSubmission[];
  currentSubmission: AssignmentSubmission | null;
  summary: {
    total: number;
    submitted: number;
    pending: number;
    graded: number;
    overdue: number;
  } | null;
  loading: boolean;
  error?: string;
  lastFetched?: number;
};

const initialState: AssignmentState = {
  assignments: [],
  currentAssignment: null,
  submissions: [],
  currentSubmission: null,
  summary: null,
  loading: false,
};

export const fetchStudentAssignments = createAsyncThunk(
  'assignment/fetchStudent',
  async ({studentId, courseId}: {studentId: string; courseId?: string}, {rejectWithValue}) => {
    try {
      return await getStudentAssignments(studentId, courseId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch assignments');
    }
  },
);

export const fetchCourseAssignments = createAsyncThunk(
  'assignment/fetchCourse',
  async ({courseId, status}: {courseId: string; status?: string}, {rejectWithValue}) => {
    try {
      return await getCourseAssignments(courseId, status as any);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch course assignments');
    }
  },
);

export const fetchAssignmentById = createAsyncThunk(
  'assignment/fetchById',
  async (assignmentId: string, {rejectWithValue}) => {
    try {
      const assignment = await getAssignmentById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }
      return assignment;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch assignment');
    }
  },
);

export const fetchStudentSubmission = createAsyncThunk(
  'assignment/fetchSubmission',
  async ({assignmentId, studentId}: {assignmentId: string; studentId: string}, {rejectWithValue}) => {
    try {
      const submission = await getStudentSubmission(assignmentId, studentId);
      return submission;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch submission');
    }
  },
);

export const fetchAssignmentSubmissions = createAsyncThunk(
  'assignment/fetchSubmissions',
  async (assignmentId: string, {rejectWithValue}) => {
    try {
      return await getAssignmentSubmissions(assignmentId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch submissions');
    }
  },
);

export const fetchStudentAssignmentSummary = createAsyncThunk(
  'assignment/fetchSummary',
  async (studentId: string, {rejectWithValue}) => {
    try {
      return await getStudentAssignmentSummary(studentId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch assignment summary');
    }
  },
);

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    setCurrentAssignment: (state, action: PayloadAction<Assignment | null>) => {
      state.currentAssignment = action.payload;
    },
    setCurrentSubmission: (state, action: PayloadAction<AssignmentSubmission | null>) => {
      state.currentSubmission = action.payload;
    },
    clearAssignments: state => {
      state.assignments = [];
      state.currentAssignment = null;
      state.submissions = [];
      state.currentSubmission = null;
      state.summary = null;
      state.error = undefined;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchStudentAssignments.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchStudentAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCourseAssignments.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchCourseAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCourseAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignmentById.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAssignment = action.payload;
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentSubmission.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchStudentSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAssignmentSubmissions.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchAssignmentSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchAssignmentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentAssignmentSummary.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStudentAssignmentSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchStudentAssignmentSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setCurrentAssignment, setCurrentSubmission, clearAssignments} = assignmentSlice.actions;
export default assignmentSlice.reducer;

