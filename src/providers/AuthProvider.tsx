"use client";

import { createContext, useContext, ReactNode } from "react";
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

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
