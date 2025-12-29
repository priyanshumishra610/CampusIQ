import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppDispatch, RootState} from '../store';
import {
  analyzeTaskWithGemini,
  GeminiTaskInsights,
} from '../../services/gemini.service';
import {
  notifyAdminsHighPriority,
  notifyUserStatusChange,
} from '../../services/notification.service';
import {UserProfile} from './authSlice';
import {createAuditLog} from './auditSlice';
import {AdminRole} from '../../config/permissions';
import apiClient from '../../services/api.client';
import socketClient from '../../services/socket.client';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  location?: {lat: number; lng: number};
  createdBy: string;
  createdAt: Date | number;
  resolvedAt?: Date | number;
  aiSummary?: string;
  imageBase64?: string;
  createdByName?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedByName?: string;
  dueDate?: Date | number;
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

// Fetch tasks (replaces real-time listener)
export const fetchTasks = createAsyncThunk(
  'tasks/fetch',
  async (
    {role, userId}: {role: UserProfile['role']; userId: string},
    {rejectWithValue},
  ) => {
    try {
      const params: any = {};
      if (role !== 'ADMIN') {
        params.assignedTo = userId;
      }
      
      const data = await apiClient.get('/tasks', params);
      
      return data.map((task: any) => ({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now(),
        resolvedAt: task.resolvedAt ? new Date(task.resolvedAt).getTime() : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate).getTime() : undefined,
      })) as Task[];
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Failed to fetch tasks');
    }
  },
);

export const startTaskListener = createAsyncThunk<
  () => void,
  {role: UserProfile['role']; userId: string}
>('tasks/startListener', async ({role, userId}, {dispatch}) => {
  // Set up Socket.IO listener for real-time updates
  const unsubscribe = socketClient.on('notification', (data: any) => {
    if (data.type === 'TASK') {
      // Refresh tasks when task-related notification received
      dispatch(fetchTasks({role, userId}));
    }
  });

  // Initial fetch
  dispatch(fetchTasks({role, userId}));

  // Poll for updates every 30 seconds
  const pollInterval = setInterval(() => {
    dispatch(fetchTasks({role, userId}));
  }, 30000);

  // Return cleanup function
  return () => {
    unsubscribe();
    clearInterval(pollInterval);
  };
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
      assignedTo,
      priority,
      dueDate,
    }: {
      title: string;
      description: string;
      location?: {lat: number; lng: number};
      imageBase64?: string;
      createdBy: string;
      createdByName?: string;
      creatorRole?: AdminRole;
      assignedTo?: string;
      priority?: TaskPriority;
      dueDate?: Date | number;
    },
    {rejectWithValue, dispatch},
  ) => {
    try {
      // Get AI analysis first (for category/priority suggestions)
      let ai: GeminiTaskInsights | null = null;
      try {
        ai = await analyzeTaskWithGemini(title, description);
      } catch (aiError) {
        console.warn('AI analysis failed, using defaults:', aiError);
      }

      const response = await apiClient.post('/tasks', {
        title,
        description,
        assignedTo: assignedTo || createdBy,
        priority: priority || ai?.priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      const taskId = response.id;

      // Send notification if high priority
      if (ai && ai.priority === 'HIGH') {
        notifyAdminsHighPriority({
          issueId: taskId,
          title,
          description,
          priority: ai.priority,
        }).catch(() => {});
      }

      // Create audit log
      dispatch(
        createAuditLog({
          action: 'task:created',
          performedBy: {
            id: createdBy,
            name: createdByName || '',
            role: creatorRole || 'ADMIN',
          },
          entityType: 'Task',
          entityId: taskId,
          details: {title, priority: ai?.priority || priority},
        }),
      );

      return {
        id: taskId,
        title,
        description,
        category: ai?.category,
        priority: ai?.priority || priority || 'MEDIUM',
        status: 'PENDING' as TaskStatus,
        location,
        createdBy,
        createdByName,
        assignedTo: assignedTo || createdBy,
        createdAt: new Date(),
        aiSummary: ai?.summary,
      } as Task;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Could not create task');
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
      await apiClient.put(`/tasks/${taskId}`, {status});

      // Create audit log
      dispatch(
        createAuditLog({
          action: 'task:status_changed',
          performedBy: {
            id: userId,
            name: userName || '',
            role: userRole || 'ADMIN',
          },
          entityType: 'Task',
          entityId: taskId,
          previousValue: previousStatus,
          newValue: status,
        }),
      );

      notifyUserStatusChange(taskId, status, userId).catch(() => {});
      return {taskId, status};
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Update failed');
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
      // Note: Backend doesn't have task comments endpoint yet
      // This would need to be added
      // For now, just create audit log
      dispatch(
        createAuditLog({
          action: 'task:comment_added',
          performedBy: {
            id: authorId,
            name: authorName,
            role: authorRole,
          },
          entityType: 'Task',
          entityId: taskId,
          details: {comment: text},
        }),
      );

      return {
        taskId,
        comment: {
          id: Date.now().toString(),
          text,
          authorId,
          authorName,
          authorRole,
          createdAt: new Date(),
        },
      };
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Failed to add comment');
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
      .addCase(fetchTasks.pending, state => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, state => {
        state.loading = false;
      })
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
                resolvedAt: status === 'COMPLETED' ? Date.now() : task.resolvedAt,
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
