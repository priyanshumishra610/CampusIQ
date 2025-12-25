import {configureStore} from '@reduxjs/toolkit';
import {authReducer, taskReducer, examReducer, auditReducer} from './slices';

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
