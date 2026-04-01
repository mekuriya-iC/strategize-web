"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApolloClient } from "@apollo/client";
import { cleanupObjectivesAndKPIs } from "@/utils/cleanup-objectives";
import { toast } from "sonner";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DataCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const apolloClient = useApolloClient();

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const success = await cleanupObjectivesAndKPIs(apolloClient);

      if (success) {
        setIsCompleted(true);
        toast.success(
          "🎉 Cleanup Successful! All objectives and KPIs have been deleted. Ready for fresh data with the new structure."
        );
      } else {
        toast.error(
          "❌ Cleanup Failed: Some items could not be deleted. Check console for details."
        );
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      toast.error(
        "💥 Cleanup Error: An unexpected error occurred during cleanup."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              ✅ Cleanup Completed Successfully!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All objectives and KPIs have been deleted. The system is now ready
              for the new parent-child structure.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            🧹 Database Cleanup Required
          </h3>
          <p className="text-sm text-orange-700 mb-4">
            The backend schema has been updated with new parent-child
            relationships. To ensure compatibility, we need to delete all
            existing objectives and KPIs and start fresh with the new structure.
          </p>

          <div className="bg-orange-100 border border-orange-300 rounded-md p-3 mb-4">
            <h4 className="font-medium text-orange-900 mb-1">
              ⚠️ This will delete:
            </h4>
            <ul className="text-sm text-orange-800 list-disc list-inside space-y-1">
              <li>All existing KPIs</li>
              <li>
                All existing objectives (some may remain if referenced by
                submissions)
              </li>
              <li>All assignment relationships</li>
            </ul>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isLoading ? "Cleaning up..." : "Start Cleanup"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Confirm Data Cleanup</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete ALL existing objectives
                  and KPIs from the database. This cannot be undone.
                  <br />
                  <br />
                  Are you sure you want to proceed with the cleanup?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup}>
                  Yes, Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
