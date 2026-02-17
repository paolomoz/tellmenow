import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useAuth() {
  const { user, loading, checkSession, logout } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { user, loading, logout };
}

export function useRequireAuth() {
  const auth = useAuth();
  return { ...auth, isAuthenticated: !!auth.user };
}
