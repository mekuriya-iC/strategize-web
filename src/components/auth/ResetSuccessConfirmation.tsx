"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResetSuccessConfirmation() {
  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title and Message */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center font-sans text-[#11181C]">
          Password Reset Successfully!
        </h1>
        <p className="text-center text-[#ABABAB] font-sans">
          Your password has been reset successfully. You can now log in with
          your new password.
        </p>
      </div>

      {/* Login Button */}
      <Link href="/auth">
        <Button className="w-full bg-primary text-white py-6 font-sans cursor-pointer hover:bg-primary/90 transition-colors">
          Login
        </Button>
      </Link>

      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-sm text-gray-500">
          © 2025 Nephty Apps Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
