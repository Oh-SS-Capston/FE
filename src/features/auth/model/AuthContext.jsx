import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  deleteAccount as deleteAccountRequest,
  getCurrentUser,
  logout as logoutRequest,
  redirectToGoogleLogin,
  redirectToGoogleSignup,
  updateNickname as updateNicknameRequest,
} from "../api/authApi";
import { getMyMembership } from "../../membership/api/membershipApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshMembership = useCallback(async () => {
    try {
      const nextMembership = await getMyMembership();
      setMembership(nextMembership);
      return nextMembership;
    } catch {
      setMembership(null);
      return null;
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      setAuthLoading(true);

      const currentUser = await getCurrentUser();
      setUser(currentUser);

      await refreshMembership();

      return currentUser;
    } catch {
      setUser(null);
      setMembership(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [refreshMembership]);

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
      setMembership(null);
      window.location.replace("/");
    }
  }, []);

  const updateNickname = useCallback(async (nickname) => {
    const updatedUser = await updateNicknameRequest(nickname);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest();
    setUser(null);
    setMembership(null);
    window.location.replace("/");
  }, []);

  const value = useMemo(
    () => ({
      user,
      membership,
      authLoading,
      isAuthenticated: Boolean(user),

      loginWithGoogle,
      signupWithGoogle,
      logout,

      updateNickname,
      deleteAccount,

      refreshMe,
      refreshMembership,
    }),
    [
      user,
      membership,
      authLoading,
      loginWithGoogle,
      signupWithGoogle,
      logout,
      updateNickname,
      deleteAccount,
      refreshMe,
      refreshMembership,
    ]
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