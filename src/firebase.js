import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const config = {
  apiKey: 'AIzaSyAxt6H_sdMzVQ0dKcQ0SmHf9rqSgXgP98Q',
  projectId: 'sous-833df',
  authDomain: window.location.host,
  databaseURL: 'https://sous-833df.firebaseio.com',
  storageBucket: 'sous-833df.appspot.com'
};

firebase.initializeApp(config);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const recipes = db.collection('recipes');

export {
  auth,
  db,
  storage,
  recipes
};
