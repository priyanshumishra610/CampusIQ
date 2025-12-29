import {configureStore} from '@reduxjs/toolkit';
import {
  authReducer,
  taskReducer,
  examReducer,
  auditReducer,
  timetableReducer,
  attendanceReducer,
  assignmentReducer,
  announcementReducer,
  ticketReducer,
  securityReducer,
} from './slices';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    audit: auditReducer,
    exams: examReducer,
    timetable: timetableReducer,
    attendance: attendanceReducer,
    assignment: assignmentReducer,
    announcement: announcementReducer,
    tickets: ticketReducer,
    security: securityReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
