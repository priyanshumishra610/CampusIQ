import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {AppDispatch, RootState} from './store';
import {UserProfile} from './authSlice';

export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT' | 'ON_LUNCH' | 'LUNCH_RETURNED';
export type LeaveType = 'CASUAL' | 'SICK' | 'PAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EmployeeTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE';
export type EmployeeTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type Attendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  loginTime?: string; // HH:mm
  logoutTime?: string; // HH:mm
  lunchStartTime?: string; // HH:mm
  lunchEndTime?: string; // HH:mm
  totalHours?: number; // calculated
  status: AttendanceStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
};

export type Leave = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  appliedAt: FirebaseFirestoreTypes.Timestamp | Date;
  reviewedBy?: string;
  reviewedAt?: FirebaseFirestoreTypes.Timestamp | Date;
};

export type Payroll = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  totalDays: number;
  totalHours: number;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netSalary: number;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
};

export type EmployeeTask = {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  priority: EmployeeTaskPriority;
  status: EmployeeTaskStatus;
  assignedAt: FirebaseFirestoreTypes.Timestamp | Date;
  completedAt?: FirebaseFirestoreTypes.Timestamp | Date;
};

type EmployeeState = {
  attendance: Attendance[];
  leaves: Leave[];
  payroll: Payroll[];
  tasks: EmployeeTask[];
  loading: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
  applyingLeave: boolean;
  updatingTask: boolean;
  error?: string;
  unsubscribe?: () => void;
};

const initialState: EmployeeState = {
  attendance: [],
  leaves: [],
  payroll: [],
  tasks: [],
  loading: false,
  checkingIn: false,
  checkingOut: false,
  applyingLeave: false,
  updatingTask: false,
};

// Calculate hours between two times
const calculateHours = (start: string, end: string, lunchStart?: string, lunchEnd?: string): number => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  let totalMinutes = endMinutes - startMinutes;
  
  if (lunchStart && lunchEnd) {
    const [lunchStartHour, lunchStartMin] = lunchStart.split(':').map(Number);
    const [lunchEndHour, lunchEndMin] = lunchEnd.split(':').map(Number);
    const lunchStartMinutes = lunchStartHour * 60 + lunchStartMin;
    const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;
    const lunchMinutes = lunchEndMinutes - lunchStartMinutes;
    totalMinutes -= lunchMinutes;
  }
  
  return Math.max(0, totalMinutes / 60);
};

// Check in
export const checkIn = createAsyncThunk<
  Attendance,
  {employeeId: string; employeeName: string},
  {state: RootState}
>('employee/checkIn', async ({employeeId, employeeName}, {getState, rejectWithValue}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if already checked in today
    const existing = await firestore()
      .collection('employee_attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();
    
    if (!existing.empty) {
      const existingDoc = existing.docs[0].data() as Attendance;
      if (existingDoc.status === 'CHECKED_IN' || existingDoc.status === 'ON_LUNCH' || existingDoc.status === 'LUNCH_RETURNED') {
        return rejectWithValue('Already checked in today');
      }
    }
    
    const attendanceData: Omit<Attendance, 'id'> = {
      employeeId,
      employeeName,
      date: today,
      loginTime: timeString,
      status: 'CHECKED_IN',
      createdAt: firestore.Timestamp.now(),
    };
    
    if (!existing.empty) {
      // Update existing
      await existing.docs[0].ref.update({
        loginTime: timeString,
        status: 'CHECKED_IN',
      });
      return {id: existing.docs[0].id, ...attendanceData};
    } else {
      // Create new
      const docRef = await firestore().collection('employee_attendance').add(attendanceData);
      return {id: docRef.id, ...attendanceData};
    }
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to check in');
  }
});

// Check out
export const checkOut = createAsyncThunk<
  Attendance,
  {employeeId: string},
  {state: RootState}
>('employee/checkOut', async ({employeeId}, {rejectWithValue}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const existing = await firestore()
      .collection('employee_attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();
    
    if (existing.empty) {
      return rejectWithValue('No check-in found for today');
    }
    
    const doc = existing.docs[0];
    const data = doc.data() as Attendance;
    
    if (!data.loginTime) {
      return rejectWithValue('No login time found');
    }
    
    if (data.logoutTime) {
      return rejectWithValue('Already checked out today');
    }
    
    const totalHours = calculateHours(
      data.loginTime,
      timeString,
      data.lunchStartTime,
      data.lunchEndTime
    );
    
    await doc.ref.update({
      logoutTime: timeString,
      status: 'CHECKED_OUT',
      totalHours,
    });
    
    return {
      id: doc.id,
      ...data,
      logoutTime: timeString,
      status: 'CHECKED_OUT',
      totalHours,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to check out');
  }
});

// Start lunch
export const startLunch = createAsyncThunk<
  Attendance,
  {employeeId: string},
  {state: RootState}
>('employee/startLunch', async ({employeeId}, {rejectWithValue}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const existing = await firestore()
      .collection('employee_attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();
    
    if (existing.empty || !existing.docs[0].data().loginTime) {
      return rejectWithValue('Must check in first');
    }
    
    const doc = existing.docs[0];
    const data = doc.data() as Attendance;
    
    if (data.status === 'ON_LUNCH') {
      return rejectWithValue('Already on lunch');
    }
    
    await doc.ref.update({
      lunchStartTime: timeString,
      status: 'ON_LUNCH',
    });
    
    return {
      id: doc.id,
      ...data,
      lunchStartTime: timeString,
      status: 'ON_LUNCH',
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to start lunch');
  }
});

// End lunch
export const endLunch = createAsyncThunk<
  Attendance,
  {employeeId: string},
  {state: RootState}
>('employee/endLunch', async ({employeeId}, {rejectWithValue}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const existing = await firestore()
      .collection('employee_attendance')
      .where('employeeId', '==', employeeId)
      .where('date', '==', today)
      .get();
    
    if (existing.empty) {
      return rejectWithValue('No attendance record found');
    }
    
    const doc = existing.docs[0];
    const data = doc.data() as Attendance;
    
    if (data.status !== 'ON_LUNCH') {
      return rejectWithValue('Not currently on lunch');
    }
    
    await doc.ref.update({
      lunchEndTime: timeString,
      status: 'LUNCH_RETURNED',
    });
    
    return {
      id: doc.id,
      ...data,
      lunchEndTime: timeString,
      status: 'LUNCH_RETURNED',
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to end lunch');
  }
});

// Apply for leave
export const applyLeave = createAsyncThunk<
  Leave,
  {employeeId: string; employeeName: string; leaveType: LeaveType; startDate: string; endDate: string; reason: string},
  {state: RootState}
>('employee/applyLeave', async (payload, {rejectWithValue}) => {
  try {
    const leaveData: Omit<Leave, 'id'> = {
      ...payload,
      status: 'PENDING',
      appliedAt: firestore.Timestamp.now(),
    };
    
    const docRef = await firestore().collection('employee_leaves').add(leaveData);
    return {id: docRef.id, ...leaveData};
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to apply for leave');
  }
});

// Update task status
export const updateEmployeeTaskStatus = createAsyncThunk<
  EmployeeTask,
  {taskId: string; status: EmployeeTaskStatus},
  {state: RootState}
>('employee/updateTaskStatus', async ({taskId, status}, {rejectWithValue}) => {
  try {
    const docRef = firestore().collection('employee_tasks').doc(taskId);
    const updates: any = {status};
    if (status === 'DONE') {
      updates.completedAt = firestore.Timestamp.now();
    }
    await docRef.update(updates);
    
    const doc = await docRef.get();
    return {id: doc.id, ...doc.data()} as EmployeeTask;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update task');
  }
});

// Load employee data
export const loadEmployeeData = createAsyncThunk<
  {attendance: Attendance[]; leaves: Leave[]; payroll: Payroll[]; tasks: EmployeeTask[]},
  {employeeId: string},
  {state: RootState}
>('employee/loadData', async ({employeeId}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // Load attendance
  const attendanceSnapshot = await firestore()
    .collection('employee_attendance')
    .where('employeeId', '==', employeeId)
    .orderBy('date', 'desc')
    .limit(30)
    .get();
  
  const attendance = attendanceSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt || firestore.Timestamp.now(),
    } as Attendance;
  });
  
  // Load leaves
  const leavesSnapshot = await firestore()
    .collection('employee_leaves')
    .where('employeeId', '==', employeeId)
    .orderBy('appliedAt', 'desc')
    .limit(20)
    .get();
  
  const leaves = leavesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      appliedAt: data.appliedAt || firestore.Timestamp.now(),
    } as Leave;
  });
  
  // Load payroll (mock for now)
  const payroll: Payroll[] = [];
  
  // Load tasks
  const tasksSnapshot = await firestore()
    .collection('employee_tasks')
    .where('employeeId', '==', employeeId)
    .orderBy('assignedAt', 'desc')
    .limit(50)
    .get();
  
  const tasks = tasksSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      assignedAt: data.assignedAt || firestore.Timestamp.now(),
    } as EmployeeTask;
  });
  
  return {attendance, leaves, payroll, tasks};
});

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearError: state => {
      state.error = undefined;
    },
  },
  extraReducers: builder => {
    builder
      // Check in
      .addCase(checkIn.pending, state => {
        state.checkingIn = true;
        state.error = undefined;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.checkingIn = false;
        const index = state.attendance.findIndex(a => a.id === action.payload.id);
        if (index >= 0) {
          state.attendance[index] = action.payload;
        } else {
          state.attendance.unshift(action.payload);
        }
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.checkingIn = false;
        state.error = action.payload as string;
      })
      // Check out
      .addCase(checkOut.pending, state => {
        state.checkingOut = true;
        state.error = undefined;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.checkingOut = false;
        const index = state.attendance.findIndex(a => a.id === action.payload.id);
        if (index >= 0) {
          state.attendance[index] = action.payload;
        }
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.checkingOut = false;
        state.error = action.payload as string;
      })
      // Start lunch
      .addCase(startLunch.fulfilled, (state, action) => {
        const index = state.attendance.findIndex(a => a.id === action.payload.id);
        if (index >= 0) {
          state.attendance[index] = action.payload;
        }
      })
      // End lunch
      .addCase(endLunch.fulfilled, (state, action) => {
        const index = state.attendance.findIndex(a => a.id === action.payload.id);
        if (index >= 0) {
          state.attendance[index] = action.payload;
        }
      })
      // Apply leave
      .addCase(applyLeave.pending, state => {
        state.applyingLeave = true;
        state.error = undefined;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.applyingLeave = false;
        state.leaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.applyingLeave = false;
        state.error = action.payload as string;
      })
      // Update task
      .addCase(updateEmployeeTaskStatus.pending, state => {
        state.updatingTask = true;
        state.error = undefined;
      })
      .addCase(updateEmployeeTaskStatus.fulfilled, (state, action) => {
        state.updatingTask = false;
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index >= 0) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateEmployeeTaskStatus.rejected, (state, action) => {
        state.updatingTask = false;
        state.error = action.payload as string;
      })
      // Load data
      .addCase(loadEmployeeData.pending, state => {
        state.loading = true;
      })
      .addCase(loadEmployeeData.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload.attendance;
        state.leaves = action.payload.leaves;
        state.payroll = action.payload.payroll;
        state.tasks = action.payload.tasks;
      })
      .addCase(loadEmployeeData.rejected, state => {
        state.loading = false;
      });
  },
});

export const {clearError} = employeeSlice.actions;
export default employeeSlice.reducer;

