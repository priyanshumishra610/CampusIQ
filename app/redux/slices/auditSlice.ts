import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import apiClient from '../../services/api.client';
import {AdminRole} from '../../config/permissions';

export type AuditAction =
  | 'task:created'
  | 'task:status_changed'
  | 'task:priority_changed'
  | 'task:comment_added'
  | 'task:assigned'
  | 'task:deleted'
  | 'exam:created'
  | 'exam:updated'
  | 'exam:deleted'
  | 'exam:results_published'
  | 'compliance:updated'
  | 'compliance:approved'
  | 'finance:updated'
  | 'system:config_changed';

export type EntityType = 'Task' | 'Exam' | 'Compliance' | 'Finance' | 'System';

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  performedBy: {
    id: string;
    name: string;
    role: AdminRole;
  };
  timestamp: Date;
  entityType: EntityType;
  entityId: string;
  details?: Record<string, any>;
  previousValue?: string;
  newValue?: string;
};

type AuditState = {
  logs: AuditLogEntry[];
  loading: boolean;
  error?: string;
};

const initialState: AuditState = {
  logs: [],
  loading: false,
};

export const createAuditLog = createAsyncThunk(
  'audit/create',
  async (
    {
      action,
      performedBy,
      entityType,
      entityId,
      details,
      previousValue,
      newValue,
    }: {
      action: AuditAction;
      performedBy: {id: string; name: string; role: AdminRole};
      entityType: EntityType;
      entityId: string;
      details?: Record<string, any>;
      previousValue?: string;
      newValue?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      // Note: Backend doesn't have audit logs endpoint yet
      // This would need to be added to the backend
      // For now, just return a local entry
      const entry: AuditLogEntry = {
        id: Date.now().toString(),
        action,
        performedBy,
        entityType,
        entityId,
        details,
        previousValue,
        newValue,
        timestamp: new Date(),
      };
      return entry;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to create audit log');
    }
  },
);

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetch',
  async (
    {entityId, limit = 50}: {entityId?: string; limit?: number},
    {rejectWithValue},
  ) => {
    try {
      // Note: Backend doesn't have audit logs endpoint yet
      // This would need to be added to the backend
      // For now, return empty array
      return [] as AuditLogEntry[];
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch audit logs');
    }
  },
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearAuditLogs: state => {
      state.logs = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createAuditLog.fulfilled, (state, action) => {
        state.logs = [action.payload, ...state.logs];
      })
      .addCase(fetchAuditLogs.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {clearAuditLogs} = auditSlice.actions;

export default auditSlice.reducer;

export const getActionDisplayName = (action: AuditAction): string => {
  const names: Record<AuditAction, string> = {
    'task:created': 'Task Created',
    'task:status_changed': 'Status Changed',
    'task:priority_changed': 'Priority Changed',
    'task:comment_added': 'Comment Added',
    'task:assigned': 'Task Assigned',
    'task:deleted': 'Task Deleted',
    'exam:created': 'Exam Created',
    'exam:updated': 'Exam Updated',
    'exam:deleted': 'Exam Deleted',
    'exam:results_published': 'Exam Results Published',
    'compliance:updated': 'Compliance Updated',
    'compliance:approved': 'Compliance Approved',
    'finance:updated': 'Finance Updated',
    'system:config_changed': 'System Configuration Changed',
  };
  return names[action] || action;
};
