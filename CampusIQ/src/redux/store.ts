import {configureStore} from '@reduxjs/toolkit';
import authReducer from './authSlice';
import taskReducer from './taskSlice';
import auditReducer from './auditSlice';
import examReducer from './examSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    audit: auditReducer,
    exams: examReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
