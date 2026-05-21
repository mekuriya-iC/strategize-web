"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StrategicPlanEditRedirect() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  useEffect(() => {
    // Redirect to the detail page with the edit dialog open intent
    // The detail page will handle opening the dialog if we add logic for it,
    // or just redirecting is enough if the user can find the edit button.
    // However, to be helpful, let's redirect and the detail page will show the dialog.
    router.replace(`/dashboard/strategic-plans/${id}?edit=true`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}
