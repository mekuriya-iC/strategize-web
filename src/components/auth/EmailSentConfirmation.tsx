"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EmailSentConfirmation() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResend = async () => {
    setResending(true);

    // Mock resend API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Reset link sent again!");
    } catch {
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const openEmailApp = () => {
    // Try to open default email app
    window.location.href = "mailto:";
  };

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title and Message */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center font-sans text-[#11181C]">
          Password Reset Email Sent!
        </h1>
        <p className="text-center text-[#ABABAB] font-sans mb-2">
          We&apos;ve sent a password reset link to
        </p>
        <p className="text-center text-[#11181C] font-semibold font-sans">
          {email || "your email address"}
        </p>
      </div>

      {/* Open Email App Button */}
      <Button
        onClick={openEmailApp}
        className="w-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-white py-6 font-sans mb-4 transition-colors"
      >
        <Mail className="w-5 h-5 mr-2" />
        Open Email App
      </Button>

      {/* Resend and Back to Login */}
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-sm text-[#ABABAB] font-sans">
            Didn&apos;t receive the email?{" "}
          </span>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-primary hover:underline font-sans disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend"}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth"
            className="text-sm text-[#ABABAB] hover:text-[#11181C] font-sans transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-sm text-gray-500">
          © 2025 Nephty Apps Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
