/**
 * Shared EmptyState Component
 * 
 * A reusable empty state component that displays when no data is available.
 * Used across employees, departments, divisions, and other entity lists.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No employees found"
 *   description="Start building your team by adding employees."
 *   actionLabel="Add Employee"
 *   onAction={() => handleAddEmployee()}
 * />
 * ```
 */

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Label for the action button */
  actionLabel?: string;
  /** Callback when action button is clicked */
  onAction?: () => void;
  /** Optional custom image path (defaults to objective-empty.png) */
  imageSrc?: string;
  /** Optional custom icon to display instead of image */
  icon?: React.ReactNode;
  /** Optional additional className for container */
  className?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  imageSrc = "/images/dashboard/objective-empty.png",
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-4 ${className}`}
    >
      {icon ? (
        <div className="mb-12">{icon}</div>
      ) : (
        <Image
          src={imageSrc}
          alt={title}
          width={320}
          height={240}
          className="mb-12"
          priority
        />
      )}

      <h2 className="text-2xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-4 max-w-xl">
        {title}
      </h2>

      <p className="text-[#BABABA] dark:text-gray-400 mb-8 md:mb-12 text-lg max-w-sm">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#3838EC] hover:bg-[#2828CC] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
