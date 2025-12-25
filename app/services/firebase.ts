import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

try {
  firestore().settings({persistence: true});
} catch (e) {
  // ignore
}

export {auth, firestore, messaging, functions};

export default firebase;

