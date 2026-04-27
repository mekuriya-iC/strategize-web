import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StartFromScratchButton() {
  const router = useRouter();
  
  const handleStartFromScratch = () => {
    // Store that user chose to start from scratch
    sessionStorage.setItem("selectedOrgTemplate", "scratch");
    
    // Navigate to add org structure page
    router.push("/org-structure/new");
  };

  return (
    <Button
      variant="outline"
      className="flex items-center gap-3 px-6 md:px-8 py-6 border border-[#E2E8F0] dark:border-gray-700 text-[#64748B] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
      onClick={handleStartFromScratch}
      size="lg"
    >
      <Plus size={20} className="flex-shrink-0" />
      <div className="flex flex-col items-start text-left">
        <span className="font-medium text-sm md:text-base text-[#11181C] dark:text-gray-100">Start from Scratch</span>
        <span className="text-xs text-[#64748B] dark:text-gray-400 font-normal">Begin with a blank structure and add nodes manually</span>
      </div>
    </Button>
  );
}
