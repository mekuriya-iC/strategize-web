"use client";

import { AlertCircle, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiFormulaManagement } from "@/components/kpi-formulas/KpiFormulaManagement";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSystemConfigurationByOrg } from "@/hooks/systemConfiguration/useSystemConfiguration";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function KpiFormulasAdminPage() {
  const { user, loading } = useAuth();
  const organizationId = user?.organizationId;
  const { configuration, loading: configurationLoading } =
    useSystemConfigurationByOrg(organizationId ?? "");

  if (loading || configurationLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Organization context required</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            KPI formula management is scoped to an organization, but your current
            session does not include an organization ID.
          </p>
          <p className="flex items-center gap-1 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Select or assign an organization before opening this page.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (!configuration?.enableFormulaKpis) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Formula KPIs are disabled</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Enable Formula KPIs for this organization before creating metric
            drivers, templates, or formula definitions.
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/admin/system-config">Open System Configuration</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <KpiFormulaManagement organizationId={organizationId} />;
}
