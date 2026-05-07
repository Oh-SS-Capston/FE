import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logout as logoutRequest,
  redirectToGoogleLogin,
  redirectToGoogleSignup,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      setAuthLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const loginWithGoogle = useCallback(() => {
    redirectToGoogleLogin();
  }, []);

  const signupWithGoogle = useCallback(() => {
    redirectToGoogleSignup();
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      window.location.replace("/"); // 로그아웃 후 화면갱신용으로 메인으로 보냄
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      loginWithGoogle,
      signupWithGoogle,
      logout,
      refreshMe,
    }),
    [user, authLoading, loginWithGoogle, signupWithGoogle, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }

  return context;
}