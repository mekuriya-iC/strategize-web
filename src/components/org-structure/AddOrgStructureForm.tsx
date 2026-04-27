"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddOrgStructureForm() {
  const [topEntityName, setTopEntityName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topEntityName.trim()) {
      toast.error("Please enter a top entity name");
      return;
    }

    // Store the top entity name
    sessionStorage.setItem("topEntityName", topEntityName);
    
    // Navigate to the structure builder
    router.push("/org-structure/builder");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm p-8 md:p-12">
        <div className="space-y-6">
          {/* Top Entity Name Field */}
          <div className="space-y-3">
            <Label 
              htmlFor="topEntityName" 
              className="text-sm font-medium text-[#11181C] dark:text-gray-100"
            >
              Top Entity Name
            </Label>
            <p className="text-xs text-[#64748B] dark:text-gray-400">
              This will be the organization's top entity.
            </p>
            <Input
              id="topEntityName"
              type="text"
              placeholder="E.g: CEO"
              value={topEntityName}
              onChange={(e) => setTopEntityName(e.target.value)}
              className="w-full py-6 px-4 text-base border-[#E2E8F0] dark:border-gray-700 focus-visible:ring-primary/20 focus-visible:border-primary"
              autoFocus
            />
          </div>

          {/* Continue Button */}
          <Button
            type="submit"
            disabled={!topEntityName.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-6 transition-colors flex items-center justify-center gap-2 mt-8"
          >
            Continue
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </form>
  );
}
