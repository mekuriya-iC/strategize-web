"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    // Mock API call - simulate sending reset email
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

      // Store email in localStorage for next step
      localStorage.setItem("resetEmail", email);

      toast.success("Reset link sent to your email!");
      router.push("/auth/email-sent");
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="">
      {/* Back button */}
      <Link
        href="/auth"
        className="inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors w-full"
      >
        <ChevronLeftIcon className="w-8 h-8 mr-4" />
        <h1 className="text-3xl md:text-4xl font-bold  font-sans text-[#11181C] dark:text-[#E5E7EB]">
          Reset Password
        </h1>
      </Link>

      <div className="mb-8 ">
        <p className="text-center text-[#ABABAB] font-sans text-base ">
          Please enter your email so that we can send you a reset password link
        </p>
      </div>

      {/* Email Input */}
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
            className="pl-10 py-6 border-gray-300 dark:border-gray-700 text-black dark:text-white focus-visible:ring-primary/20 focus-visible:border-primary"
          />
        </div>
      </div>

      {/* Send Reset Link Button */}
      <Button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-primary text-white py-6 font-sans cursor-pointer disabled:opacity-50"
      >
        {loading ? "Sending Reset Link..." : "Send Reset Link"}
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
