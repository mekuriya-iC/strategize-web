"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  trackColor = "#3838EC80",
  fillColor = "#3838EC",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  trackColor?: string;
  fillColor?: string;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      style={{ backgroundColor: trackColor }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all duration-500 ease-in-out"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: fillColor,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
