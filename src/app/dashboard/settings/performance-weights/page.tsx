"use client";

import { useAuthStore } from "@/stores";
import WeightConfigManager from "@/components/performance/WeightConfigManager";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PerformanceWeightsPage() {
  const user = useAuthStore((state) => state.user);
  const hasAccess = user?.role && ["SUPER_ADMIN", "ADMIN", "HR"].includes(user.role);

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Performance Weight Configuration
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure performance scoring weights
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Only HR and Administrators can configure performance weights.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user?.organizationId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            No organization found. Please contact support.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Performance Weight Configuration
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure how KPI, 360° Evaluation, and Activity metrics contribute to overall performance scores
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Weight configurations determine how performance components are combined.
          The default is 70% KPI, 25% 360° Evaluation, and 5% Activity. You can create period-specific
          configurations or update the organization default.
        </AlertDescription>
      </Alert>

      <WeightConfigManager organizationId={user.organizationId} />
    </div>
  );
}
