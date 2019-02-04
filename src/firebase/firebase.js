import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

const config = {
  apiKey: "AIzaSyDuLgy1lUfY3CJ_csNIewLTgzEl6luZbzE",
  authDomain: "react-slack-e0618.firebaseapp.com",
  databaseURL: "https://react-slack-e0618.firebaseio.com",
  projectId: "react-slack-e0618",
  storageBucket: "react-slack-e0618.appspot.com",
  messagingSenderId: "578223279521"
};
firebase.initializeApp(config);

export default firebase;