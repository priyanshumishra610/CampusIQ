import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

const sendPush = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  if (!tokens.length || !FCM_SERVER_KEY) {
    return;
  }

  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify({
      registration_ids: tokens,
      notification: {
        title,
        body,
      },
      data,
    }),
  });
};

export const registerDeviceToken = async (): Promise<string | null> => {
  await messaging().registerDeviceForRemoteMessages();
  const status = await messaging().requestPermission();
  const enabled =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;
  if (!enabled) {
    return null;
  }

  const token = await messaging().getToken();
  const currentUser = auth().currentUser;
  if (currentUser && token) {
    await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .set(
        {
          fcmTokens: firestore.FieldValue.arrayUnion(token),
        },
        {merge: true},
      );
  }

  return token;
};

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
  const snapshot = await firestore()
    .collection('users')
    .where('role', '==', 'ADMIN')
    .get();
  const tokens: string[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (Array.isArray(data.fcmTokens)) {
      tokens.push(...data.fcmTokens);
    }
  });

  await sendPush(tokens, 'High Priority Task', title, {
    issueId,
    description,
    priority,
  });
};

export const notifyUserStatusChange = async (
  issueId: string,
  status: string,
  userId: string,
) => {
  const userDoc = await firestore().collection('users').doc(userId).get();
  const data = userDoc.data();
  const tokens = Array.isArray(data?.fcmTokens) ? data.fcmTokens : [];
  await sendPush(tokens, 'Task Status Updated', `Status: ${status}`, {
    issueId,
    status,
  });
};
