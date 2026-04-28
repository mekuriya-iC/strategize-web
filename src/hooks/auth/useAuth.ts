"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useLazyQuery, useApolloClient } from "@apollo/client";
import { useRouter, usePathname } from "next/navigation";
import { LOGIN_EMPLOYEE } from "@/lib/graphql/mutations/auth";
import { GET_ME } from "@/lib/graphql/queries/auth";
import { LoginEmployeeInput, Employee } from "@/types/graphql";
import { authLogger } from "@/lib/logger";
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiryDisplay,
  setupTokenExpirationChecker,
} from "@/lib/auth-utils";

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

        // Store token in secure cookie
        setAccessToken(token);

        // Set user data from login response
        setAuthState({
          isAuthenticated: true,
          user: data.loginEmployee.employee,
          loading: false,
          tokenExpiresIn: getTokenExpiryDisplay(token),
        });

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

  const logout = useCallback(() => {
    authLogger.info("User logging out");

    // Remove token
    removeAccessToken();

    // Clear Apollo cache to prevent stale data
    apolloClient.clearStore();

    // Clear any session storage and set logout flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("selectedStrategicPeriod");
      sessionStorage.removeItem("authMessage"); // Clear any expired session messages
      sessionStorage.setItem("intentionalLogout", "true"); // Mark as intentional logout
    }

    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      tokenExpiresIn: null,
    });

    // Redirect to auth page (no expired param since this is intentional)
    router.push("/auth");
  }, [apolloClient, router]);

  const getToken = useCallback(() => {
    return getAccessToken();
  }, []);

  return {
    ...authState,
    login,
    logout,
    getToken,
  };
};


 