import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {AppDispatch, RootState} from './store';
import {UserProfile} from './authSlice';
import {AdminRole} from '../config/permissions';
import {
  secureCreateExam,
  secureUpdateExam,
  secureDeleteExam,
  securePublishExamResults,
  detectExamConflicts,
  ExamConflict,
} from '../services/exam.service';

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT';

export type Exam = {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  examType: ExamType;
  status: ExamStatus;
  scheduledDate: FirebaseFirestoreTypes.Timestamp | Date;
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
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | Date;
  publishedAt?: FirebaseFirestoreTypes.Timestamp | Date;
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

export const startExamListener = createAsyncThunk<
  () => void,
  {role: UserProfile['role']; userId: string}
>('exams/startListener', async ({role, userId}, {dispatch}) => {
  const collectionRef = firestore().collection('exams');
  const queryRef =
    role === 'ADMIN'
      ? collectionRef.orderBy('scheduledDate', 'asc')
      : collectionRef
          .where('createdBy', '==', userId)
          .orderBy('scheduledDate', 'asc');

  const unsubscribe = queryRef.onSnapshot(snapshot => {
    const exams = snapshot.docs.map<Exam>(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        courseCode: data.courseCode,
        courseName: data.courseName,
        examType: data.examType,
        status: data.status,
        scheduledDate: data.scheduledDate,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        room: data.room,
        building: data.building,
        capacity: data.capacity,
        enrolledStudents: data.enrolledStudents || [],
        studentCount: data.studentCount || 0,
        instructions: data.instructions,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        publishedAt: data.publishedAt,
        conflictWarnings: data.conflictWarnings,
        aiSuggestions: data.aiSuggestions,
      };
    });
    dispatch(setExams(exams));
  });

  return unsubscribe;
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
      courseCode,
      courseName,
      examType,
      scheduledDate,
      startTime,
      endTime,
      duration,
      room,
      building,
      capacity,
      instructions,
      enrolledStudents,
    }: {
      title: string;
      courseCode: string;
      courseName: string;
      examType: ExamType;
      scheduledDate: Date;
      startTime: string;
      endTime: string;
      duration: number;
      room?: string;
      building?: string;
      capacity: number;
      instructions?: string;
      enrolledStudents?: string[];
    },
    {rejectWithValue},
  ) => {
    try {
      const result = await secureCreateExam({
        title,
        courseCode,
        courseName,
        examType,
        scheduledDate: scheduledDate.toISOString(),
        startTime,
        endTime,
        duration,
        room,
        building,
        capacity,
        instructions,
        enrolledStudents: enrolledStudents || [],
      });

      const examId = result.examId;

      // Fetch the created exam to return it
      const examDoc = await firestore().collection('exams').doc(examId).get();
      const examData = examDoc.data()!;

      return {
        id: examId,
        ...examData,
        scheduledDate: examData.scheduledDate?.toDate?.() || new Date(),
        createdAt: examData.createdAt?.toDate?.() || new Date(),
      } as Exam;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Could not create exam');
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
        courseCode: string;
        courseName: string;
        examType: ExamType;
        scheduledDate: Date;
        startTime: string;
        endTime: string;
        duration: number;
        room: string;
        building: string;
        capacity: number;
        instructions: string;
        enrolledStudents: string[];
        status: ExamStatus;
      }>;
    },
    {rejectWithValue},
  ) => {
    try {
      const updateData: any = {...updates};
      if (updates.scheduledDate) {
        updateData.scheduledDate = updates.scheduledDate.toISOString();
      }
      if (updates.enrolledStudents) {
        updateData.enrolledStudents = updates.enrolledStudents;
      }

      await secureUpdateExam({
        examId,
        updates: updateData,
      });

      // Fetch updated exam
      const examDoc = await firestore().collection('exams').doc(examId).get();
      const examData = examDoc.data()!;

      return {
        id: examId,
        ...examData,
        scheduledDate: examData.scheduledDate?.toDate?.() || new Date(),
        createdAt: examData.createdAt?.toDate?.() || new Date(),
        updatedAt: examData.updatedAt?.toDate?.() || new Date(),
      } as Exam;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Could not update exam');
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
      return rejectWithValue(error?.message || 'Could not delete exam');
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
      return rejectWithValue(error?.message || 'Could not publish results');
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
      return rejectWithValue(error?.message || 'Could not check conflicts');
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


