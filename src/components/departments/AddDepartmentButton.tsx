import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddDepartmentButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick: () => void;
}

export default function AddDepartmentButton({
  className = "",
  variant = "default",
  size = "md",
  onClick,
}: AddDepartmentButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const baseClasses =
    variant === "default"
      ? "bg-[#3838EC] hover:bg-[#3838EC]/90 text-white"
      : variant === "outline"
      ? "border border-[#3838EC] text-[#3838EC] hover:bg-[#3838EC] hover:text-white"
      : "text-[#3838EC] hover:bg-[#3838EC]/10";

  return (
    <Button
      className={`${sizeClasses[size]} ${baseClasses} rounded-md font-medium transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Plus className="w-4 h-4 mr-1" /> Add Department
    </Button>
  );
}
