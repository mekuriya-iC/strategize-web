"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
// import { LoginEmployeeInput } from "@/types/graphql";
import { toast } from "sonner";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({
      email,
      password,
    });

    if (result?.success) {
      toast.success("Login Successful!");
      // Use Next.js router instead of window.location
      router.push("/dashboard");
    } else {
      // console.log("Login failed:", result?.error);
      toast.error("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center font-sans text-[#11181C]">
          Welcome Back
        </h1>
        <p className="mb-8 text-center text-[#ABABAB] font-sans">
          Please enter your email and password to continue
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2 mb-12">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            className="pl-10"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            className="text-sm font-sans text-[#242424]"
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
