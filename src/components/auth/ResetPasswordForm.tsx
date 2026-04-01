"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    // Mock API call - simulate password reset
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear stored email
      localStorage.removeItem("resetEmail");

      toast.success("Password reset successful!");
      router.push("/auth/reset-success");
    } catch {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      {/* Back button */}
      <Link
        href="/auth/forgot-password"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Reset Password
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center font-sans text-[#11181C]">
          Reset Password
        </h1>
        <p className="text-center text-[#ABABAB] font-sans">
          Please enter a new password to reset your access to your account.
        </p>
      </div>

      {/* New Password */}
      <div className="space-y-2 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
          </span>
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-2 mb-12">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
          </span>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Reset Password Button */}
      <Button
        type="submit"
        disabled={loading || !newPassword || !confirmPassword}
        className="w-full bg-primary text-white py-6 font-sans cursor-pointer disabled:opacity-50"
      >
        {loading ? "Resetting Password..." : "Reset Password"}
      </Button>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          © 2025 Nephty Apps Inc. All rights reserved.
        </p>
      </div>
    </form>
  );
}
