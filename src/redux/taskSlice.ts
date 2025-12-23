import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {AppDispatch, RootState} from './store';
import {
  analyzeTaskWithGemini,
  GeminiTaskInsights,
} from '../services/gemini.service';
import {
  notifyAdminsHighPriority,
  notifyUserStatusChange,
} from '../services/notification.service';
import {UserProfile} from './authSlice';
import {createAuditLog} from './auditSlice';
import {AdminRole} from '../config/permissions';
import {
  secureCreateTask,
  secureUpdateTaskStatus,
  secureAddTaskComment,
} from '../services/security.service';

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  location?: {lat: number; lng: number};
  createdBy: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
  resolvedAt?: FirebaseFirestoreTypes.Timestamp | Date;
  aiSummary?: string;
  imageBase64?: string;
  createdByName?: string;
  assignedTo?: string;
  comments?: TaskComment[];
};

export type TaskComment = {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: AdminRole;
  createdAt: Date;
};

type TaskState = {
  items: Task[];
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error?: string;
  unsubscribe?: () => void;
};

const initialState: TaskState = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
};

export const startTaskListener = createAsyncThunk<
  () => void,
  {role: UserProfile['role']; userId: string}
>('tasks/startListener', async ({role, userId}, {dispatch}) => {
  const collectionRef = firestore().collection('issues');
  const queryRef =
    role === 'ADMIN'
      ? collectionRef.orderBy('createdAt', 'desc')
      : collectionRef
          .where('createdBy', '==', userId)
          .orderBy('createdAt', 'desc');

  const unsubscribe = queryRef.onSnapshot(snapshot => {
    const tasks = snapshot.docs.map<Task>(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        location: data.location,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        resolvedAt: data.resolvedAt,
        aiSummary: data.aiSummary,
        imageBase64: data.imageBase64,
        assignedTo: data.assignedTo,
        comments: data.comments,
      };
    });
    dispatch(setTasks(tasks));
  });

  return unsubscribe;
});

export const stopTaskListener = createAsyncThunk<void, void, {state: RootState}>(
  'tasks/stopListener',
  async (_, {getState}) => {
    const unsub = getState().tasks.unsubscribe;
    if (unsub) {
      unsub();
    }
  },
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (
    {
      title,
      description,
      location,
      imageBase64,
      createdBy,
      createdByName,
      creatorRole,
    }: {
      title: string;
      description: string;
      location?: {lat: number; lng: number};
      imageBase64?: string;
      createdBy: string;
      createdByName?: string;
      creatorRole?: AdminRole;
    },
    {rejectWithValue, dispatch},
  ) => {
    try {
      // 🔐 SECURITY: Use secure Cloud Function endpoint instead of direct Firestore write
      // This validates permissions, rate limits, and input sanitization server-side
      
      // Get AI analysis first (for category/priority suggestions)
      let ai: GeminiTaskInsights | null = null;
      try {
        ai = await analyzeTaskWithGemini(title, description);
      } catch (aiError) {
        // Continue even if AI fails - Cloud Function will use defaults
        console.warn('AI analysis failed, using defaults:', aiError);
      }

      // Call secure Cloud Function endpoint
      const result = await secureCreateTask({
        title,
        description,
        location,
        imageBase64,
        category: ai?.category,
        priority: ai?.priority,
      });

      const taskId = result.taskId;

      // Update task with AI summary if available (read-only field, safe to update)
      if (ai?.summary) {
        await firestore().collection('issues').doc(taskId).update({
          aiSummary: ai.summary,
        });
      }

      // Fetch the created task to return it
      const taskDoc = await firestore().collection('issues').doc(taskId).get();
      const taskData = taskDoc.data()!;

      // Send notification if high priority
      if (ai && ai.priority === 'HIGH') {
        notifyAdminsHighPriority({
          issueId: taskId,
          title,
          description,
          priority: ai.priority,
        }).catch(() => {});
      }

      return {
        id: taskId,
        ...taskData,
        createdAt: taskData.createdAt?.toDate?.() || new Date(),
      } as Task;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Could not create task');
    }
  },
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async (
    {
      taskId,
      status,
      userId,
      userName,
      userRole,
      previousStatus,
    }: {
      taskId: string;
      status: TaskStatus;
      userId: string;
      userName?: string;
      userRole?: AdminRole;
      previousStatus?: TaskStatus;
    },
    {rejectWithValue, dispatch},
  ) => {
    try {
      // 🔐 SECURITY: Use secure Cloud Function endpoint
      // This validates permissions, rate limits, and status transitions server-side
      await secureUpdateTaskStatus({
        taskId,
        newStatus: status,
      });

      // Audit log is created automatically by Cloud Function
      // No need to dispatch createAuditLog here

      notifyUserStatusChange(taskId, status, userId).catch(() => {});
      return {taskId, status};
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Update failed');
    }
  },
);

export const addTaskComment = createAsyncThunk(
  'tasks/addComment',
  async (
    {
      taskId,
      text,
      authorId,
      authorName,
      authorRole,
    }: {
      taskId: string;
      text: string;
      authorId: string;
      authorName: string;
      authorRole: AdminRole;
    },
    {rejectWithValue, dispatch},
  ) => {
    try {
      // 🔐 SECURITY: Use secure Cloud Function endpoint
      // This validates permissions and rate limits server-side
      const result = await secureAddTaskComment({
        taskId,
        text,
      });

      // Fetch updated task to get the comment
      const taskDoc = await firestore().collection('issues').doc(taskId).get();
      const taskData = taskDoc.data()!;
      const comments = taskData.comments || [];
      const comment = comments.find((c: any) => c.id === result.commentId);

      // Audit log is created automatically by Cloud Function
      // No need to dispatch createAuditLog here

      return {taskId, comment: comment || {id: result.commentId, text, authorId, authorName, authorRole, createdAt: new Date()}};
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to add comment');
    }
  },
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(startTaskListener.pending, state => {
        state.loading = true;
      })
      .addCase(startTaskListener.fulfilled, (state, action) => {
        state.loading = false;
        state.unsubscribe = action.payload;
      })
      .addCase(createTask.pending, state => {
        state.creating = true;
        state.error = undefined;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.creating = false;
        state.items = [action.payload as Task, ...state.items];
      })
      .addCase(createTask.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })
      .addCase(updateTaskStatus.pending, state => {
        state.updating = true;
        state.error = undefined;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.updating = false;
        const {taskId, status} = action.payload as {
          taskId: string;
          status: TaskStatus;
        };
        state.items = state.items.map(task =>
          task.id === taskId
            ? {
                ...task,
                status,
                resolvedAt: status === 'RESOLVED' ? new Date() : task.resolvedAt,
              }
            : task,
        );
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      })
      .addCase(stopTaskListener.fulfilled, state => {
        state.unsubscribe = undefined;
      });
  },
});

export const {setTasks} = taskSlice.actions;

export default taskSlice.reducer;

export const startTasksForRole =
  ({role, userId}: {role: UserProfile['role']; userId: string}) =>
  (dispatch: AppDispatch) => {
    dispatch(stopTaskListener());
    dispatch(startTaskListener({role, userId}));
  };

