import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {registerDeviceToken} from '../services/notification.service';
import {AdminRole} from '../config/permissions';

export type Role = 'USER' | 'ADMIN';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  adminRole?: AdminRole;
  department?: string;
  fcmTokens?: string[];
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

const mapUserDoc = (id: string, data: any): UserProfile => ({
  id,
  name: data?.name || '',
  email: data?.email || '',
  role: data?.role || 'USER',
  adminRole: data?.adminRole,
  department: data?.department,
  fcmTokens: data?.fcmTokens || [],
});

export const initAuthListener = createAsyncThunk(
  'auth/init',
  async (_, {dispatch}) =>
    new Promise<void>(resolve => {
      let resolved = false;
      auth().onAuthStateChanged(async current => {
        if (current) {
          const doc = await firestore().collection('users').doc(current.uid).get();
          if (doc.exists) {
            dispatch(setUser(mapUserDoc(doc.id, doc.data())));
          } else {
            dispatch(
              setUser({
                id: current.uid,
                name: current.displayName || '',
                email: current.email || '',
                role: 'USER',
              }),
            );
          }
        } else {
          dispatch(clearUser());
        }
        if (!resolved) {
          resolved = true;
          resolve();
        }
      });
    }),
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    {email, password}: {email: string; password: string},
    {rejectWithValue},
  ) => {
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      const doc = await firestore()
        .collection('users')
        .doc(credential.user.uid)
        .get();
      if (!doc.exists) {
        throw new Error('Profile missing');
      }
      const profile = mapUserDoc(doc.id, doc.data());
      await registerDeviceToken();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Sign in failed');
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
      const credential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const profile: UserProfile = {
        id: credential.user.uid,
        email,
        name,
        role,
        adminRole,
        department,
      };
      await firestore().collection('users').doc(profile.id).set(profile);
      await registerDeviceToken();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Sign up failed');
    }
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await auth().signOut();
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
