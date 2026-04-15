"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";

type MessageType = "expired" | "logout" | "info" | null;

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: MessageType }>({ text: "", type: null });
  const { login, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for expired session, intentional logout, or stored auth message
  useEffect(() => {
    const expired = searchParams.get("expired");
    const storedMessage = sessionStorage.getItem("authMessage");
    const intentionalLogout = sessionStorage.getItem("intentionalLogout");

    // Clear the intentional logout flag after reading
    if (intentionalLogout) {
      sessionStorage.removeItem("intentionalLogout");
      setMessage({ text: "You have been logged out successfully.", type: "logout" });
      return; // Don't show expired message if user logged out intentionally
    }

    if (expired === "true") {
      setMessage({ text: "Your session has expired. Please log in again.", type: "expired" });
    } else if (storedMessage) {
      setMessage({ text: storedMessage, type: "info" });
      sessionStorage.removeItem("authMessage");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: null }); // Clear any previous messages

    const result = await login({
      email,
      password,
    });

    if (result?.success) {
      toast.success("Login Successful!");

      // Check for redirect URL
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else {
        router.push("/strategy-period");
      }
    } else {
      // Determine the type of error and show appropriate message
      const error = result?.error;
      const isNetworkError = result?.isNetworkError;

      // Check for network errors
      if (isNetworkError || error?.networkError) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else if (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError")) {
        toast.error("Unable to connect to server. Please check your internet connection.");
      } else if (error?.graphQLErrors?.length > 0) {
        // GraphQL errors (usually auth failures)
        const gqlError = error.graphQLErrors[0]?.message || "Authentication failed";
        toast.error(gqlError);
      } else if (typeof error === "string" && error === "No access token received") {
        toast.error("Login failed. Please check your credentials and try again.");
      } else {
        // Fallback for other errors
        toast.error("Login failed. Please check your credentials and try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center font-sans text-[#11181C] dark:text-white">
          Welcome Back
        </h1>
        <p className="mb-8 text-center text-[#636161] dark:text-gray-400 font-sans">
          Please enter your email and password to continue
        </p>
      </div>

      {/* Auth Message */}
      {message.type && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === "logout"
              ? "bg-green border border-green-200"
              : "bg-amber border border-amber-200"
            }`}
        >
          {message.type === "logout" ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${message.type === "logout" ? "text-green-800" : "text-amber-800"
              }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2 mb-12">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-gray-400">
            <Mail size={18} />
          </span>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 py-6 border-gray-300 dark:border-gray-700 text-black dark:text-white focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-gray-400">
            <Lock size={18} />
          </span>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 pr-10 py-6 border-gray-300 dark:border-gray-700 text-black dark:text-white focus-visible:ring-primary/20 focus-visible:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-black dark:text-gray-400 hover:text-black dark:hover:text-white"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Remember me & Forgot password */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
          />
          <Label
            htmlFor="remember"
            className="text-sm font-sans text-[#242424] dark:text-gray-300"
          >
            Remember me
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-primary hover:underline font-sans"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Login Button */}
      <Button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full bg-primary text-white py-6 font-sans cursor-pointer disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
