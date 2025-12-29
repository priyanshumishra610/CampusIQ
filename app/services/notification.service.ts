import apiClient from './api.client';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';

// Register device token for push notifications
export const registerDeviceToken = async (): Promise<string | null> => {
  try {
    // For now, return null - FCM token registration should be handled
    // by the native push notification service
    // The token can be registered via POST /api/users/:id/fcm-token
    return null;
  } catch (error) {
    console.error('Error registering device token:', error);
    return null;
  }
};

// Register FCM token with backend
export const registerFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    await apiClient.post(`/users/${userId}/fcm-token`, {token});
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
};

// Notify admins of high priority task
export const notifyAdminsHighPriority = async ({
  issueId,
  title,
  description,
  priority,
}: {
  issueId: string;
  title: string;
  description: string;
  priority: string;
}) => {
  try {
    // This will be handled by the backend notification service
    // which can send push notifications to admin users
    console.log('High priority notification:', {issueId, title, description, priority});
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

// Notify user of status change
export const notifyUserStatusChange = async (
  issueId: string,
  status: string,
  userId: string,
) => {
  try {
    await apiClient.post('/notifications', {
      userId,
      title: 'Task Status Updated',
      message: `Status: ${status}`,
      type: 'TASK',
      relatedId: issueId,
    });
  } catch (error) {
    console.error('Error notifying user:', error);
  }
};
