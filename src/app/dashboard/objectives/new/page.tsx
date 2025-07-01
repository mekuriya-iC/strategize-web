"use client";
import ObjectiveForm from "@/components/objectives/ObjectiveForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddObjectivePage() {
  const router = useRouter();
  return (
    <>
      <div className="max-w-6xl  py-6 px-4">
        <h1 className="text-2xl md:text-4xl font-semibold mb-8 flex items-center gap-2 text-[#3F3F46] dark:text-white">
          <span className="cursor-pointer" onClick={() => router.back()}>
            {" "}
            <ChevronLeft className="w-6 h-6 mr-2" />
          </span>
          Add Objective
        </h1>
        <ObjectiveForm />
      </div>
    </>
  );
}
