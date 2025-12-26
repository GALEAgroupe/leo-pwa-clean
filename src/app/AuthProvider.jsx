import React, { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase.js";

export const AuthCtx = React.createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const api = useMemo(
    () => ({
      user,
      ready,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      logout: () => signOut(auth),
    }),
    [user, ready]
  );

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}
