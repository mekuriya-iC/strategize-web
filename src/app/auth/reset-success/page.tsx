"use client";

import ResetSuccessConfirmation from "@/components/auth/ResetSuccessConfirmation";

export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Success Confirmation */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <ResetSuccessConfirmation />
        </div>
      </div>

      {/* Right side - Purple section */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden hidden lg:block">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Align. Act. Achieve.
            </h1>
            <p className="text-lg opacity-90">
              Your strategic workspace for long-term planning.
            </p>
          </div>

          {/* Dashboard preview image */}
          <div className="relative">
            <img
              src="/images/auth/performance-dashboard.png"
              alt="Performance Dashboard"
              className="rounded-lg shadow-2xl max-w-full h-auto"
            />
            <div className="absolute inset-0 bg-white/10 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
