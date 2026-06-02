import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { formatErrorMessage, logError } from "@/lib/errorHandler";
import { toast } from "@/hooks/use-toast";

const DOMAIN = "@srmap.edu.in";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  signupEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const assertDomain = (email: string | null | undefined) => {
  if (!email?.toLowerCase().endsWith(DOMAIN)) {
    throw new Error(`Only ${DOMAIN} accounts are allowed`);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !u.email?.toLowerCase().endsWith(DOMAIN)) {
        signOut(auth).catch(e => logError("signOut", e));
        setUser(null);
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginEmail = async (email: string, password: string) => {
    try {
      assertDomain(email);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logError("loginEmail", error);
      toast({
        title: "Login failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const signupEmail = async (email: string, password: string) => {
    try {
      assertDomain(email);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      logError("signupEmail", error);
      toast({
        title: "Signup failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: "srmap.edu.in" });
      const result = await signInWithPopup(auth, provider);
      if (!result.user.email?.toLowerCase().endsWith(DOMAIN)) {
        await signOut(auth).catch(e => logError("signOut", e));
        throw new Error(`Only ${DOMAIN} accounts are allowed`);
      }
    } catch (error) {
      logError("loginGoogle", error);
      toast({
        title: "Login failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      logError("logout", error);
      toast({
        title: "Logout failed",
        description: formatErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginEmail, signupEmail, loginGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

