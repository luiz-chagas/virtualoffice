import firebase from "firebase/app";
import { createContext, FunctionComponent, useEffect, useState } from "react";
import { firebaseConfig } from "./firebaseConfig";
import { listenForUserChange, signIn, signOut } from "./auth";

const initializeFirebase = () => {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
};

interface FirebaseService {
  signIn: typeof signIn;
  signOut: typeof signOut;
  user: firebase.User | null;
}

const api: FirebaseService = {
  signIn,
  signOut,
  user: null,
};

export const FirebaseContext = createContext<FirebaseService>(api);

export const FirebaseProvider: FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  useEffect(() => {
    initializeFirebase();
  }, []);

  useEffect(() => {
    listenForUserChange((firebaseUser) => {
      setUser(firebaseUser);
    });
  }, []);

  const value: FirebaseService = {
    ...api,
    user,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
