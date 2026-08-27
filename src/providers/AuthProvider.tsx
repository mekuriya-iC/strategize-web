"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Employee } from "@/types/graphql";

interface AuthContextType {
  isAuthenticated: boolean;
  user: Employee | null;
  loading: boolean;
  tokenExpiresIn: string | null;
  login: (input: { email: string; password: string }) => Promise<any>;
  logout: () => void;
  getToken: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: auth.isAuthenticated,
      user: auth.user,
      loading: auth.loading,
      tokenExpiresIn: auth.tokenExpiresIn,
      login: auth.login,
      logout: auth.logout,
      getToken: auth.getToken,
    }),
    [
      auth.isAuthenticated,
      auth.user,
      auth.loading,
      auth.tokenExpiresIn,
      auth.login,
      auth.logout,
      auth.getToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
