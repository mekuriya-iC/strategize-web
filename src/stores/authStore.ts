/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Employee } from "@/types/graphql";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  isTokenExpired,
} from "@/lib/auth-utils";
import { authLogger } from "@/lib/logger";
import { useOrgUnitStore } from "./orgUnitStore";

interface AuthState {
  // State
  user: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: Employee | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  initialize: () => void;
  login: (user: Employee, token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      // Set user
      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        }),

      // Set loading
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      // Set authenticated
      setAuthenticated: (authenticated) =>
        set((state) => {
          state.isAuthenticated = authenticated;
        }),

      // Initialize auth state from token
      initialize: () => {
        const token = getAccessToken();
        if (token && !isTokenExpired(token)) {
          set((state) => {
            state.isAuthenticated = true;
            state.isInitialized = true;
            state.isLoading = false;
          });
          authLogger.debug("Auth initialized from token");
        } else {
          if (token) {
            removeAccessToken();
            authLogger.warn("Token expired during initialization");
          }
          set((state) => {
            state.isAuthenticated = false;
            state.isInitialized = true;
            state.isLoading = false;
            state.user = null;
          });
        }
      },

      // Login
      login: (user, token) => {
        setAccessToken(token);
        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
        authLogger.info("User logged in", { userId: user.employeeId });
      },

      // Logout
      logout: () => {
        removeAccessToken();
        // Clear org unit selection on logout
        useOrgUnitStore.getState().clearSelection();
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
        authLogger.info("User logged out");
      },

      // Check if auth is still valid
      checkAuth: () => {
        const token = getAccessToken();
        if (!token || isTokenExpired(token)) {
          get().logout();
          return false;
        }
        return true;
      },
    })),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);


