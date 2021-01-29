import { useContext } from "react";
import { FirebaseContext } from "../services/firebase/FirebaseContext";

export const useFirebase = () => useContext(FirebaseContext);
