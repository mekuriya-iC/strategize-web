"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface OrganizationTemplateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export default function OrganizationTemplateCard({
  icon,
  title,
  description,
  onClick,
  selected = false,
  loading = false,
  disabled = false,
}: OrganizationTemplateCardProps) {
  return (
    <div onClick={!disabled && !loading ? onClick : undefined} className={`cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <Card
        className={`bg-white dark:bg-[#18181b] border-0 rounded-2xl shadow-sm hover:shadow-md flex flex-col items-center p-6 md:p-8 transition-all duration-200 relative ${
          selected ? "ring-2 ring-primary" : ""
        }`}
      >
      {/* Icon */}
      <div className="mb-6 md:mb-8 flex items-center justify-center text-[#11181C] dark:text-gray-100">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="font-semibold text-base md:text-lg text-primary mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-xs md:text-sm text-[#64748B] dark:text-gray-400 mb-6 text-center">
        {description}
      </p>
      
      {/* Choose Button */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled && !loading) onClick?.();
        }}
        disabled={disabled || loading}
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2.5 transition-colors"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating...
          </span>
        ) : "Choose"}
      </Button>
    </Card>
    </div>
  );
}
