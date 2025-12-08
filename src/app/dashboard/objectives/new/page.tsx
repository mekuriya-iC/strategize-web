"use client";
import ObjectiveForm from "@/components/objectives/ObjectiveForm";
import { useAuthStore } from "@/stores";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AddObjectivePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const pageTitle = "Add Objective";

  // Check if user has permission to access this page
  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/objectives");
    }
  }, [user, router]);

  // Show loading or redirect if user doesn't have permission
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl  py-6 px-4">
        <h1 className="text-2xl md:text-4xl font-semibold mb-8 flex items-center gap-2 text-[#3F3F46] dark:text-white">
          <span className="cursor-pointer" onClick={() => router.back()}>
            {" "}
            <ChevronLeft className="w-6 h-6 mr-2" />
          </span>
          {pageTitle}
        </h1>
        <ObjectiveForm />
      </div>
    </>
  );
}
