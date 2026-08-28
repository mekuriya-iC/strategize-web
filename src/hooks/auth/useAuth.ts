"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import { useRouter } from "next/navigation";
import { LOGIN_EMPLOYEE, CHANGE_PASSWORD } from "@/lib/graphql/mutations/auth";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { LoginEmployeeInput } from "@/types/graphql";
import { authLogger } from "@/lib/logger";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,

  setRefreshToken,
  removeRefreshToken,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiryDisplay,
  setupTokenExpirationChecker,
} from "@/lib/auth-utils";
import { useAuthStore } from "@/stores/authStore";
import { useStrategicPeriodStore } from "@/stores/strategicPeriodStore";

interface UseAuthOptions {
  bootstrap?: boolean;
}

export const useAuth = ({ bootstrap = false }: UseAuthOptions = {}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.isLoading);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<string | null>(null);
  const bootstrapStarted = useRef(false);

  const router = useRouter();
  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation(LOGIN_EMPLOYEE);
  const [changePasswordMutation] = useMutation(CHANGE_PASSWORD);

  // Update token expiry display periodically
  const updateTokenExpiry = useCallback(() => {
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      const expiryDisplay = getTokenExpiryDisplay(token);
      setTokenExpiresIn(expiryDisplay);
    } else {
      setTokenExpiresIn(null);
    }
  }, []);

  // Check for existing token and load user data
  useEffect(() => {
    if (!bootstrap || bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const token = getAccessToken();
        const authStore = useAuthStore.getState();
        authStore.setLoading(true);

        if (token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            authLogger.warn("Token is expired, clearing session");
            removeAccessToken();
            authStore.setUser(null);
            authStore.setLoading(false);
            setTokenExpiresIn(null);
            if (window.location.pathname !== "/auth") {
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
            const { data } = await apolloClient.query({
              query: GET_ME,
              fetchPolicy: "network-only",
            });

            if (data?.me) {
              authStore.setUser(data.me);
              authStore.setLoading(false);
              setTokenExpiresIn(getTokenExpiryDisplay(token));

              if (
                (data.me.isFirstLogin || data.me.mustChangePassword) &&
                window.location.pathname !== "/onboarding"
              ) {
                router.push("/onboarding");
              }
            } else {
              // Token is invalid on server side
              authLogger.warn("Token invalid on server, clearing session");
              removeAccessToken();
              authStore.setUser(null);
              authStore.setLoading(false);
              setTokenExpiresIn(null);
              if (window.location.pathname !== "/auth") {
                router.push("/auth");
              }
            }
          } catch (error) {
            // Token is invalid or network error
            authLogger.error("Failed to fetch user data:", error);
            removeAccessToken();
            authStore.setUser(null);
            authStore.setLoading(false);
            setTokenExpiresIn(null);
            if (window.location.pathname !== "/auth") {
              router.push("/auth");
            }
          }
        } else {
          authStore.setUser(null);
          authStore.setLoading(false);
          setTokenExpiresIn(null);
          if (window.location.pathname !== "/auth") {
            router.push("/auth");
          }
        }
      }
    };

    void checkAuth();
  }, [apolloClient, bootstrap, router]);

  // Setup token expiration checker
  useEffect(() => {
    if (bootstrap && isAuthenticated) {
      // Check token expiry every minute
      const intervalId = setInterval(updateTokenExpiry, 60000);

      // Setup automatic expiration checker
      const cleanupChecker = setupTokenExpirationChecker(() => {
        useAuthStore.getState().logout();
        setTokenExpiresIn(null);
      });

      return () => {
        clearInterval(intervalId);
        cleanupChecker();
      };
    }
  }, [bootstrap, isAuthenticated, updateTokenExpiry]);

  const login = useCallback(async (input: LoginEmployeeInput) => {
    try {
      useAuthStore.getState().setLoading(true);

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

        useAuthStore.getState().login(employee, token);
        setTokenExpiresIn(getTokenExpiryDisplay(token));

        // Refetch active queries with the new session (objectives list, me, etc.)
        await apolloClient.resetStore();

        authLogger.info("Login successful");
        return { success: true, user: data.loginEmployee.employee };
      } else {
        useAuthStore.getState().setLoading(false);
        return { success: false, error: "No access token received" };
      }
    } catch (error: unknown) {
      useAuthStore.getState().setLoading(false);
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
  }, [apolloClient, loginMutation]);

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

    setTokenExpiresIn(null);

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
    isAuthenticated,
    user,
    loading,
    tokenExpiresIn,
    login,
    logout,
    getToken,
    changePassword,
  };
};
