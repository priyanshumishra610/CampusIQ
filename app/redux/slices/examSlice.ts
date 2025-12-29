import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppDispatch, RootState} from '../store';
import {UserProfile} from './authSlice';
import {AdminRole} from '../../config/permissions';
import {
  secureCreateExam,
  secureUpdateExam,
  secureDeleteExam,
  securePublishExamResults,
  detectExamConflicts,
  ExamConflict,
  getCourseExams,
  getExamById,
} from '../../services/exam.service';
import apiClient from '../../services/api.client';
import socketClient from '../../services/socket.client';

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT';

export type Exam = {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  examType: ExamType;
  status: ExamStatus;
  scheduledDate: Date | number;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // minutes
  room?: string;
  building?: string;
  capacity: number;
  enrolledStudents: string[]; // student IDs
  studentCount: number;
  instructions?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date | number;
  updatedAt?: Date | number;
  publishedAt?: Date | number;
  conflictWarnings?: ExamConflict[];
  aiSuggestions?: string;
};

export type ExamStudentLink = {
  examId: string;
  studentId: string;
  studentName: string;
  seatNumber?: number;
  attendance?: 'PRESENT' | 'ABSENT' | 'LATE';
  score?: number;
  grade?: string;
};

type ExamState = {
  items: Exam[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error?: string;
  unsubscribe?: () => void;
  conflicts: ExamConflict[];
  conflictChecking: boolean;
};

const initialState: ExamState = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  conflicts: [],
  conflictChecking: false,
};

// Fetch exams (replaces real-time listener)
export const fetchExams = createAsyncThunk(
  'exams/fetch',
  async (
    {role, userId, courseId}: {role: UserProfile['role']; userId: string; courseId?: string},
    {rejectWithValue},
  ) => {
    try {
      let exams: Exam[] = [];
      
      if (courseId) {
        exams = await getCourseExams(courseId);
      } else {
        // Get all exams for user's courses
        // Note: This would need backend support for user's enrolled courses
        const data = await apiClient.get('/exams', {});
        exams = data.map((exam: any) => ({
          ...exam,
          scheduledDate: exam.examDate ? new Date(exam.examDate).getTime() : Date.now(),
          createdAt: exam.createdAt ? new Date(exam.createdAt).getTime() : Date.now(),
          updatedAt: exam.updatedAt ? new Date(exam.updatedAt).getTime() : undefined,
          publishedAt: exam.publishedAt ? new Date(exam.publishedAt).getTime() : undefined,
          enrolledStudents: [],
          studentCount: 0,
        }));
      }
      
      return exams;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Failed to fetch exams');
    }
  },
);

export const startExamListener = createAsyncThunk<
  () => void,
  {role: UserProfile['role']; userId: string}
>('exams/startListener', async ({role, userId}, {dispatch}) => {
  // Set up Socket.IO listener for real-time updates
  const unsubscribe = socketClient.on('notification', (data: any) => {
    if (data.type === 'EXAM') {
      // Refresh exams when exam-related notification received
      dispatch(fetchExams({role, userId}));
    }
  });

  // Initial fetch
  dispatch(fetchExams({role, userId}));

  // Poll for updates every 30 seconds
  const pollInterval = setInterval(() => {
    dispatch(fetchExams({role, userId}));
  }, 30000);

  // Return cleanup function
  return () => {
    unsubscribe();
    clearInterval(pollInterval);
  };
});

export const stopExamListener = createAsyncThunk<void, void, {state: RootState}>(
  'exams/stopListener',
  async (_, {getState}) => {
    const unsub = getState().exams.unsubscribe;
    if (unsub) {
      unsub();
    }
  },
);

export const createExam = createAsyncThunk(
  'exams/create',
  async (
    {
      title,
      courseId,
      examDate,
      durationMinutes,
      maxMarks,
      venue,
      instructions,
      description,
    }: {
      title: string;
      courseId: string;
      examDate: Date;
      durationMinutes: number;
      maxMarks: number;
      venue?: string;
      instructions?: string;
      description?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const result = await secureCreateExam({
        title,
        courseId,
        examDate: examDate.toISOString(),
        durationMinutes,
        maxMarks,
        venue,
        instructions,
        description,
      });

      const examId = result.examId;

      // Fetch the created exam to return it
      const exam = await getExamById(examId);
      if (!exam) {
        throw new Error('Failed to fetch created exam');
      }

      return {
        ...exam,
        scheduledDate: exam.examDate,
        createdAt: exam.createdAt,
        enrolledStudents: [],
        studentCount: 0,
      } as Exam;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not create exam');
    }
  },
);

export const updateExam = createAsyncThunk(
  'exams/update',
  async (
    {
      examId,
      updates,
    }: {
      examId: string;
      updates: Partial<{
        title: string;
        description: string;
        examDate: Date;
        durationMinutes: number;
        maxMarks: number;
        venue: string;
        instructions: string;
      }>;
    },
    {rejectWithValue},
  ) => {
    try {
      const updateData: any = {...updates};
      if (updates.examDate) {
        updateData.examDate = updates.examDate.toISOString();
      }

      await secureUpdateExam({
        examId,
        updates: updateData,
      });

      // Fetch updated exam
      const exam = await getExamById(examId);
      if (!exam) {
        throw new Error('Failed to fetch updated exam');
      }

      return {
        ...exam,
        scheduledDate: exam.examDate,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        enrolledStudents: [],
        studentCount: 0,
      } as Exam;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not update exam');
    }
  },
);

export const deleteExam = createAsyncThunk(
  'exams/delete',
  async (
    {examId}: {examId: string},
    {rejectWithValue},
  ) => {
    try {
      await secureDeleteExam({examId});
      return examId;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not delete exam');
    }
  },
);

export const publishExamResults = createAsyncThunk(
  'exams/publishResults',
  async (
    {examId, results}: {examId: string; results: ExamStudentLink[]},
    {rejectWithValue},
  ) => {
    try {
      await securePublishExamResults({
        examId,
        results,
      });
      return {examId, results};
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not publish results');
    }
  },
);

export const checkExamConflicts = createAsyncThunk(
  'exams/checkConflicts',
  async (
    {
      examId,
      scheduledDate,
      startTime,
      endTime,
      room,
      enrolledStudents,
    }: {
      examId?: string;
      scheduledDate: Date;
      startTime: string;
      endTime: string;
      room?: string;
      enrolledStudents?: string[];
    },
    {rejectWithValue},
  ) => {
    try {
      const conflicts = await detectExamConflicts({
        examId,
        scheduledDate: scheduledDate.toISOString(),
        startTime,
        endTime,
        room,
        enrolledStudents,
      });
      return conflicts;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not check conflicts');
    }
  },
);

const examSlice = createSlice({
  name: 'exams',
  initialState,
  reducers: {
    setExams: (state, action: PayloadAction<Exam[]>) => {
      state.items = action.payload;
    },
    clearConflicts: state => {
      state.conflicts = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchExams.pending, state => {
        state.loading = true;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchExams.rejected, state => {
        state.loading = false;
      })
      .addCase(startExamListener.pending, state => {
        state.loading = true;
      })
      .addCase(startExamListener.fulfilled, (state, action) => {
        state.loading = false;
        state.unsubscribe = action.payload;
      })
      .addCase(startExamListener.rejected, state => {
        state.loading = false;
      })
      .addCase(createExam.pending, state => {
        state.creating = true;
        state.error = undefined;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.creating = false;
        state.items = [...state.items, action.payload as Exam];
      })
      .addCase(createExam.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(updateExam.pending, state => {
        state.updating = true;
        state.error = undefined;
      })
      .addCase(updateExam.fulfilled, (state, action) => {
        state.updating = false;
        const updatedExam = action.payload as Exam;
        state.items = state.items.map(exam =>
          exam.id === updatedExam.id ? updatedExam : exam,
        );
      })
      .addCase(updateExam.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(deleteExam.pending, state => {
        state.deleting = true;
        state.error = undefined;
      })
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter(exam => exam.id !== action.payload);
      })
      .addCase(deleteExam.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      })
      .addCase(checkExamConflicts.pending, state => {
        state.conflictChecking = true;
      })
      .addCase(checkExamConflicts.fulfilled, (state, action) => {
        state.conflictChecking = false;
        state.conflicts = action.payload as ExamConflict[];
      })
      .addCase(checkExamConflicts.rejected, (state, action) => {
        state.conflictChecking = false;
        state.error = action.payload as string;
      })
      .addCase(stopExamListener.fulfilled, state => {
        state.unsubscribe = undefined;
      });
  },
});

export const {setExams, clearConflicts} = examSlice.actions;

export default examSlice.reducer;

export const startExamsForRole =
  ({role, userId}: {role: UserProfile['role']; userId: string}) =>
  (dispatch: AppDispatch) => {
    dispatch(stopExamListener());
    dispatch(startExamListener({role, userId}));
  };
