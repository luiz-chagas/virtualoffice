import firebase from "firebase/app";
import "firebase/auth";

const GOOGLE_PROVIDER = new firebase.auth.GoogleAuthProvider();

export const listenForUserChange = (
  callbackFn: (user: firebase.User | null) => void
) => {
  firebase.auth().onAuthStateChanged(callbackFn);
};

export const signIn = () =>
  firebase
    .auth()
    .signInWithPopup(GOOGLE_PROVIDER)
    .then((result) => {
      // const credential = result.credential;

      // This gives you a Google Access Token. You can use it to access the Google API.
      // const token = credential.accessToken;

      // The signed-in user info.
      const user = result.user;

      return user;
    })
    .catch(console.error);

export const signOut = () => firebase.auth().signOut();
