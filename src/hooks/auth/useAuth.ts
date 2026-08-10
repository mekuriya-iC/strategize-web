"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useLazyQuery, useApolloClient } from "@apollo/client";
import { useRouter, usePathname } from "next/navigation";
import { LOGIN_EMPLOYEE, CHANGE_PASSWORD } from "@/lib/graphql/mutations/auth";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { LoginEmployeeInput, Employee } from "@/types/graphql";
import { authLogger } from "@/lib/logger";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiryDisplay,
  setupTokenExpirationChecker,
} from "@/lib/auth-utils";
import { useAuthStore } from "@/stores/authStore";
import { useStrategicPeriodStore } from "@/stores/strategicPeriodStore";

interface AuthState {
  isAuthenticated: boolean;
  user: Employee | null;
  loading: boolean;
  tokenExpiresIn: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    tokenExpiresIn: null,
  });

  const router = useRouter();
  const pathname = usePathname();
  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation(LOGIN_EMPLOYEE);
  const [changePasswordMutation] = useMutation(CHANGE_PASSWORD);
  const [getMeQuery] = useLazyQuery(GET_ME);

  // Update token expiry display periodically
  const updateTokenExpiry = useCallback(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      const expiryDisplay = getTokenExpiryDisplay(token);
      setAuthState((prev) => ({ ...prev, tokenExpiresIn: expiryDisplay }));
    } else {
      setAuthState((prev) => ({ ...prev, tokenExpiresIn: null }));
    }
  }, []);

  // Check for existing token and load user data
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const token = getAccessToken();

        if (token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            authLogger.warn("Token is expired, clearing session");
            removeAccessToken();
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false,
              tokenExpiresIn: null,
            });
            if (pathname !== "/auth") {
              router.push("/auth?expired=true");
            }
            return;
          }

          // Warn if token is expiring soon
          if (isTokenExpiringSoon(token)) {
            const expiryDisplay = getTokenExpiryDisplay(token);
            authLogger.warn(`Token expiring soon: ${expiryDisplay} remaining`);
          }

          try {
            // Token exists and is valid, fetch current user data
            const { data } = await getMeQuery({
              fetchPolicy: "network-only",
            });

            if (data?.me) {
              setAuthState({
                isAuthenticated: true,
                user: data.me,
                loading: false,
                tokenExpiresIn: getTokenExpiryDisplay(token),
              });
            } else {
              // Token is invalid on server side
              authLogger.warn("Token invalid on server, clearing session");
              removeAccessToken();
              setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                tokenExpiresIn: null,
              });
              if (pathname !== "/auth") {
                router.push("/auth");
              }
            }
          } catch (error) {
            // Token is invalid or network error
            authLogger.error("Failed to fetch user data:", error);
            removeAccessToken();
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false,
              tokenExpiresIn: null,
            });
            if (pathname !== "/auth") {
              router.push("/auth");
            }
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            tokenExpiresIn: null,
          });
          if (pathname !== "/auth") {
            router.push("/auth");
          }
        }
      }
    };

    checkAuth();
  }, [getMeQuery, pathname, router]);

  // Setup token expiration checker
  useEffect(() => {
    if (authState.isAuthenticated) {
      // Check token expiry every minute
      const intervalId = setInterval(updateTokenExpiry, 60000);
      updateTokenExpiry(); // Initial check

      // Setup automatic expiration checker
      const cleanupChecker = setupTokenExpirationChecker(() => {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          tokenExpiresIn: null,
        });
      });

      return () => {
        clearInterval(intervalId);
        cleanupChecker();
      };
    }
  }, [authState.isAuthenticated, updateTokenExpiry]);

  const login = async (input: LoginEmployeeInput) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const { data } = await loginMutation({
        variables: { input },
        fetchPolicy: "network-only",
      });

      if (data?.loginEmployee?.accessToken) {
        const token = data.loginEmployee.accessToken;
        const refreshToken = data.loginEmployee.refreshToken;

        // Store both tokens in secure cookies
        setAccessToken(token);
        if (refreshToken) {
          setRefreshToken(refreshToken);
          authLogger.info("Refresh token stored");
        }

        const employee = data.loginEmployee.employee;

        // Set user data from login response
        setAuthState({
          isAuthenticated: true,
          user: employee,
          loading: false,
          tokenExpiresIn: getTokenExpiryDisplay(token),
        });

        useAuthStore.getState().login(employee, token);

        // Refetch active queries with the new session (objectives list, me, etc.)
        await apolloClient.resetStore();

        authLogger.info("Login successful");
        return { success: true, user: data.loginEmployee.employee };
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return { success: false, error: "No access token received" };
      }
    } catch (error: unknown) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      authLogger.error("Login error:", error);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apolloError = error as any;

      // Check if it's a network error (no internet, server unreachable)
      const isNetworkError =
        apolloError?.networkError ||
        apolloError?.message?.includes("Failed to fetch") ||
        apolloError?.message?.includes("NetworkError") ||
        apolloError?.message?.includes("Network request failed") ||
        apolloError?.message?.includes("ERR_NETWORK");

      return {
        success: false,
        error: apolloError,
        isNetworkError,
      };
    }
  };

  const logout = useCallback(async () => {
    authLogger.info("User logging out");

    // Remove both tokens
    removeAccessToken();
    removeRefreshToken();

    useAuthStore.getState().logout();
    useStrategicPeriodStore.getState().clearSelection();

    // Clear any session storage and set logout flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("strategic-period-storage");
      sessionStorage.removeItem("authMessage");
      sessionStorage.setItem("intentionalLogout", "true");
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      tokenExpiresIn: null,
    });

    try {
      await apolloClient.clearStore();
    } catch (error) {
      authLogger.warn("Apollo clearStore during logout", error);
    }

    router.push("/auth");
  }, [apolloClient, router]);

  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const { data } = await changePasswordMutation({
        variables: {
          input: {
            oldPassword,
            newPassword,
          },
        },
      });

      if (data?.changePassword?.success) {
        authLogger.info("Password changed successfully");
        return { success: true, message: data.changePassword.message };
      } else {
        return { success: false, error: "Failed to change password" };
      }
    } catch (error: unknown) {
      authLogger.error("Change password error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apolloError = error as any;
      return {
        success: false,
        error: apolloError?.message || "Failed to change password",
      };
    }
  };

  return {
    ...authState,
    login,
    logout,
    getToken,
    changePassword,
  };
};
