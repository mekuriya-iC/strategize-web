"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error.message || "An error occurred while loading the logbook."}
      </p>
      <Button onClick={() => reset()} className="bg-[#3838EC] hover:bg-[#2d2dbd]">
        Try again
      </Button>
    </div>
  );
}
