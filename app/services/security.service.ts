/**
 * 🔐 Security Service
 * 
 * Frontend service for calling secure Cloud Functions endpoints.
 * All critical operations go through this service instead of direct Firestore writes.
 */

import functions from '@react-native-firebase/functions';

/**
 * Create a task securely via Cloud Function
 * This validates permissions, rate limits, and input on the server
 */
export async function secureCreateTask(params: {
  title: string;
  description: string;
  location?: {lat: number; lng: number};
  imageBase64?: string;
  category?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}): Promise<{success: boolean; taskId: string}> {
  try {
    const createTaskFunction = functions().httpsCallable('secureCreateTask');
    const result = await createTaskFunction(params);
    return result.data;
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === 'resource-exhausted') {
      throw new Error('Rate limit exceeded. Please wait before creating more tasks.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to create tasks.');
    }
    if (error.code === 'invalid-argument') {
      throw new Error(error.message || 'Invalid input provided.');
    }
    throw new Error(error.message || 'Failed to create task securely');
  }
}

/**
 * Update task status securely via Cloud Function
 */
export async function secureUpdateTaskStatus(params: {
  taskId: string;
  newStatus: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
}): Promise<{success: boolean}> {
  try {
    const updateStatusFunction = functions().httpsCallable('secureUpdateTaskStatus');
    const result = await updateStatusFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'resource-exhausted') {
      throw new Error('Rate limit exceeded. Please wait before making more changes.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to change task status.');
    }
    if (error.code === 'invalid-argument') {
      throw new Error(error.message || 'Invalid status transition.');
    }
    throw new Error(error.message || 'Failed to update task status');
  }
}

/**
 * Add comment to task securely via Cloud Function
 */
export async function secureAddTaskComment(params: {
  taskId: string;
  text: string;
}): Promise<{success: boolean; commentId: string}> {
  try {
    const addCommentFunction = functions().httpsCallable('secureAddTaskComment');
    const result = await addCommentFunction(params);
    return result.data;
  } catch (error: any) {
    if (error.code === 'resource-exhausted') {
      throw new Error('Rate limit exceeded. Please wait before adding more comments.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add comments.');
    }
    if (error.code === 'invalid-argument') {
      throw new Error(error.message || 'Invalid comment.');
    }
    throw new Error(error.message || 'Failed to add comment');
  }
}


