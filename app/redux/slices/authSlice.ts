import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import apiClient from '../../services/api.client';
import {registerDeviceToken} from '../../services/notification.service';
import {AdminRole} from '../../config/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'SUPPORT' | 'SECURITY' | 'HR_ADMIN' | 'HR_MANAGER' | 'HR_STAFF';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  adminRole?: AdminRole;
  department?: string;
  campusId?: string;
  campusName?: string;
  studentId?: string; // For students
  facultyId?: string; // For faculty
  enrollmentNumber?: string; // For students
  employeeId?: string; // For faculty/staff
  phoneNumber?: string;
  profileImageUrl?: string;
  fcmTokens?: string[];
  createdAt?: number;
  updatedAt?: number;
};

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  error?: string;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  initializing: true,
};

const mapUserData = (data: any): UserProfile => ({
  id: data.id,
  name: data.name || '',
  email: data.email || '',
  role: data.role || 'STUDENT',
  adminRole: data.adminRole,
  department: data.department,
  campusId: data.campusId,
  campusName: data.campusName,
  studentId: data.studentId,
  facultyId: data.facultyId,
  enrollmentNumber: data.enrollmentNumber,
  employeeId: data.employeeId,
  phoneNumber: data.phoneNumber,
  profileImageUrl: data.profileImageUrl,
  fcmTokens: data.fcmTokens || [],
  createdAt: data.createdAt ? new Date(data.createdAt).getTime() : undefined,
  updatedAt: data.updatedAt ? new Date(data.updatedAt).getTime() : undefined,
});

export const initAuthListener = createAsyncThunk(
  'auth/init',
  async (_, {dispatch}) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        const userData = await apiClient.getCurrentUser();
        dispatch(setUser(mapUserData(userData)));
      } else {
        dispatch(clearUser());
      }
    } catch (error) {
      // Token invalid or expired
      await AsyncStorage.removeItem('auth_token');
      dispatch(clearUser());
    }
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    {email, password}: {email: string; password: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await apiClient.login(email, password);
      const profile = mapUserData(response.user);
      await registerDeviceToken();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Sign in failed');
    }
  },
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    {
      email,
      password,
      name,
      role,
      adminRole,
      department,
    }: {
      email: string;
      password: string;
      name: string;
      role: Role;
      adminRole?: AdminRole;
      department?: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const response = await apiClient.register({
        email,
        password,
        name,
        role,
        adminRole,
        department,
      });
      const profile = mapUserData(response.user);
      await registerDeviceToken();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.error || error?.message || 'Sign up failed');
    }
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await apiClient.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.initializing = false;
      state.error = undefined;
    },
    clearUser: state => {
      state.user = null;
      state.initializing = false;
      state.error = undefined;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(signIn.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload as UserProfile;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signUp.pending, state => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload as UserProfile;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signOut.fulfilled, state => {
        state.user = null;
      })
      .addCase(initAuthListener.pending, state => {
        state.initializing = true;
      })
      .addCase(initAuthListener.fulfilled, state => {
        state.initializing = false;
      });
  },
});

export const {setUser, clearUser} = authSlice.actions;

export default authSlice.reducer;
