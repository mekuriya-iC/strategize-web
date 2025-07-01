"use client";

import { useState, useEffect } from "react";
import { useMutation, useLazyQuery, useApolloClient } from "@apollo/client";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { LOGIN_EMPLOYEE } from "@/lib/graphql/mutations/employees";
import { GET_ME } from "@/lib/graphql/queries/employees";
import { LoginEmployeeInput, Employee } from "@/types/graphql";

interface AuthState {
  isAuthenticated: boolean;
  user: Employee | null;
  loading: boolean;
}

// Cookie configuration for security
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production", // Only secure in production
  sameSite: "strict" as const,
  path: "/",
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  const router = useRouter();
  const pathname = usePathname();
  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation(LOGIN_EMPLOYEE);
  const [getMeQuery] = useLazyQuery(GET_ME);

  // Check for existing token and load user data
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const token = Cookies.get("accessToken");
        if (token) {
          try {
            // Token exists, fetch current user data with fresh network request
            const { data } = await getMeQuery({
              fetchPolicy: "network-only",
            });
            if (data?.me) {
              setAuthState({
                isAuthenticated: true,
                user: data.me,
                loading: false,
              });
            } else {
              // Token is invalid, remove it
              Cookies.remove("accessToken", { path: "/" });
              setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
              });
              // Redirect to auth if not already there
              if (pathname !== "/auth") {
                router.push("/auth");
              }
            }
          } catch (error) {
            // Token is invalid or network error
            console.error("Failed to fetch user data:", error);
            Cookies.remove("accessToken", { path: "/" });
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false,
            });
            // Redirect to auth if not already there
            if (pathname !== "/auth") {
              router.push("/auth");
            }
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
          // Redirect to auth if not already there
          if (pathname !== "/auth") {
            router.push("/auth");
          }
        }
      }
    };

    checkAuth();
  }, [getMeQuery, pathname, router]);

  const login = async (input: LoginEmployeeInput) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const { data } = await loginMutation({
        variables: { input },
        // Ensure fresh data, don't use cache
        fetchPolicy: "network-only",
      });

      if (data?.loginEmployee?.accessToken) {
        // Store token in secure cookie using js-cookie
        Cookies.set(
          "accessToken",
          data.loginEmployee.accessToken,
          COOKIE_OPTIONS
        );

        // Set user data from login response
        setAuthState({
          isAuthenticated: true,
          user: data.loginEmployee.employee,
          loading: false,
        });

        return { success: true, user: data.loginEmployee.employee };
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return { success: false, error: "No access token received" };
      }
    } catch (error) {
      setAuthState((prev) => ({ ...prev, loading: false }));
      console.error("Login error:", error);
      return { success: false, error };
    }
  };

  const logout = () => {
    // Remove cookie with same path used for setting
    Cookies.remove("accessToken", { path: "/" });

    // Clear Apollo cache to prevent stale data
    apolloClient.clearStore();

    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });

    // Redirect to auth page after logout
    router.push("/auth");
  };

  const getToken = () => {
    return Cookies.get("accessToken");
  };

  return {
    ...authState,
    login,
    logout,
    getToken,
  };
};
