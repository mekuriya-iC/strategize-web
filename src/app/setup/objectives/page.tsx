"use client";

import Logo from "@/components/Logo";
import ObjectiveForm from "@/components/objectives/ObjectiveForm";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SetupObjectivesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);

  // Non-admins shouldn't be here — send them to dashboard
  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090b] flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-6 md:px-12 md:py-8">
        <Logo width={120} height={30} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-12">
        <div className="w-full max-w-3xl mx-auto">
          {/* Step indicator */}
          <p className="text-sm font-medium text-[#3838EC] text-center mb-3 uppercase tracking-wide">
            Setup — Step 5 of 5
          </p>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-center mb-3 text-[#11181C] dark:text-gray-100">
            Create Your First Strategic Objective
          </h1>

          <p className="text-sm md:text-base text-[#64748B] dark:text-gray-400 text-center mb-10">
            {selectedPeriod
              ? `Define the first objective for "${selectedPeriod.name}". You can add more after setup.`
              : "Define the first objective for your strategic period. You can add more after setup."}
          </p>

          {/* Reuse the existing ObjectiveForm — it handles creation + redirect */}
          <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
            <ObjectiveForm />
          </div>
        </div>
      </div>
    </div>
  );
}
