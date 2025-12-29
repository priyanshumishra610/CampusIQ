import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import apiClient from '../../services/api.client';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementTarget = 'ALL' | 'STUDENTS' | 'FACULTY' | 'ADMIN' | 'DEPARTMENT' | 'COURSE';

export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target: AnnouncementTarget;
  targetIds?: string[]; // For department/course specific
  authorId: string;
  authorName: string;
  campusId?: string;
  attachments?: string[];
  readBy?: string[]; // User IDs who read it
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
};

type AnnouncementState = {
  announcements: Announcement[];
  unreadCount: number;
  loading: boolean;
  error?: string;
  lastFetched?: number;
};

const initialState: AnnouncementState = {
  announcements: [],
  unreadCount: 0,
  loading: false,
};

export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetch',
  async (
    {
      userId,
      role,
      campusId,
      departmentId,
    }: {userId: string; role: string; campusId?: string; departmentId?: string},
    {rejectWithValue},
  ) => {
    try {
      const data = await apiClient.get('/announcements', {role});
      
      const announcements: Announcement[] = data.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        target: 'ALL', // Backend uses targetRoles array
        targetIds: announcement.targetCourses || [],
        authorId: announcement.authorId,
        authorName: announcement.authorName || '',
        campusId: campusId,
        createdAt: announcement.createdAt ? new Date(announcement.createdAt).getTime() : Date.now(),
        updatedAt: announcement.updatedAt ? new Date(announcement.updatedAt).getTime() : Date.now(),
        readBy: [], // Backend doesn't track this yet
      }));

      return announcements;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Failed to fetch announcements');
    }
  },
);

export const markAnnouncementAsRead = createAsyncThunk(
  'announcement/markRead',
  async ({announcementId, userId}: {announcementId: string; userId: string}, {rejectWithValue}) => {
    try {
      // Note: Backend doesn't have mark-as-read endpoint yet
      // This would need to be added
      // For now, just update local state
      return {announcementId, userId};
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to mark as read');
    }
  },
);

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    clearAnnouncements: state => {
      state.announcements = [];
      state.unreadCount = 0;
      state.error = undefined;
    },
    updateUnreadCount: state => {
      state.unreadCount = state.announcements.filter(
        a => !a.readBy || !a.readBy.length,
      ).length;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAnnouncements.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload;
        state.unreadCount = action.payload.filter(a => !a.readBy || !a.readBy.length).length;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markAnnouncementAsRead.fulfilled, (state, action) => {
        const announcement = state.announcements.find(a => a.id === action.payload.announcementId);
        if (announcement) {
          announcement.readBy = [...(announcement.readBy || []), action.payload.userId];
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const {clearAnnouncements, updateUnreadCount} = announcementSlice.actions;
export default announcementSlice.reducer;
