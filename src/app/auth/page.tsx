// src/app/auth/page.tsx
import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import Logo from "@/components/Logo";

// Loading fallback for the login form
function LoginFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="h-12 bg-gray-200 rounded mb-4"></div>
      <div className="h-12 bg-gray-200 rounded mb-4"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row relative p-4 dark:bg-[#09090b]">
      {/* Logo - Top Left */}
      <div className="absolute top-4 left-8 z-10">
        <Logo />
      </div>

      {/* Left: Login Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 bg-white dark:bg-[#09090b]">
        {/* Spacer for logo on small screens */}
        <div className="h-20 md:hidden" />
        {/* Login Form */}
        <div className="w-full max-w-md">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
        {/* Footer */}
        <div className="w-full max-w-md mt-8 text-xs text-gray-400 text-center font-sans">
          © 2024 Stratify. Align. Act. Achieve. All Rights Reserved.
        </div>
      </div>

      {/* Right: Illustration & Marketing */}
      <div className="hidden md:flex flex-1 flex-col justify-center bg-gradient-to-br from-[#4F46E5] to-[#726BEA] text-white rounded-3xl pl-16 pr-8">
        <div className="max-w-2xl w-full">
          <h2 className="text-5xl font-bold mb-6 mt-8 font-sans">Align. Act. Achieve.</h2>
          <p className="mb-12 text-2xl  text-[#D0D0EC] font-sans">
            Your strategic workspace for long-term planning.
          </p>
          <div className="relative mt-4">
            {/* Main dashboard image */}
            <Image
              src="/images/auth/performance-dashboard.png"
              alt="Dashboard Preview"
              width={600}
              height={400}
              className="rounded-xl shadow-lg"
              priority
            />
            {/* Overlay chart image */}
            <Image
              src="/images/auth/overlay-chart-sample.png"
              alt="Chart Sample Overlay"
              width={280}
              height={120}
              className="absolute -right-2 bottom-34 rounded-2xl shadow-2xl "
              style={{ zIndex: 10 }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
