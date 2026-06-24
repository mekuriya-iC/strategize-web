"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useStrategicPeriodMutations } from "@/hooks/strategic-periods/useStrategicPeriods";
import { toast } from "sonner";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { useMutation } from "@apollo/client";
import { CREATE_STRATEGIC_PLAN } from "@/lib/graphql/mutations/strategicPlans";
import { formatAnnualTimeline } from "@/lib/strategic-periods/periodDates";

const GET_ORGANIZATIONS = gql`
  query GetOrganizationsForPeriodSetup {
    organizations(page: 1, limit: 1) {
      items {
        organizationId
        name
      }
    }
  }
`;

const PERIOD_TYPES = [
  { value: "ANNUAL", label: "Annual" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "CUSTOM", label: "Custom" },
];

export default function AddNewStrategyForm() {
  const router = useRouter();
  const userOrgId = useAuthStore((s) => s.user?.organizationId ?? "");
  const { selectPeriodWithTimeline } = useStrategicPeriodStore();
  const { createStrategicPeriod } = useStrategicPeriodMutations();

  // Call the mutation directly (no success toast — plan creation is invisible to the user)
  const [createPlanMutation] = useMutation(CREATE_STRATEGIC_PLAN);

  // Fallback: fetch org if not on the user object (super admins)
  const { data: orgData, loading: orgLoading } = useQuery(GET_ORGANIZATIONS, {
    skip: !!userOrgId,
    fetchPolicy: "cache-and-network",
  });

  const organizationId =
    userOrgId || orgData?.organizations?.items?.[0]?.organizationId || "";

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    periodType: "ANNUAL",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter a period name");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (form.endDate <= form.startDate) {
      toast.error("End date must be after start date");
      return;
    }
    if (!organizationId) {
      toast.error("Organization not found. Please contact your administrator.");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: silently create a strategic plan to satisfy the backend requirement.
      // The user never sees this — the period name is used as the plan title.
      const { data: planData } = await createPlanMutation({
        variables: {
          input: {
            title: form.name.trim(),
            startDate: form.startDate,
            endDate: form.endDate,
            organizationId,
            isActive: true,
          },
        },
      });
      const plan = planData?.createStrategicPlan;

      if (!plan?.strategicPlanId) {
        toast.error("Failed to initialize strategy. Please try again.");
        return;
      }

      // Step 2: create the strategic period under that plan
      const period = await createStrategicPeriod({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        periodType: form.periodType,
        strategicPlanId: plan.strategicPlanId,
        organizationId,
      });

      if (period) {
        selectPeriodWithTimeline(period, formatAnnualTimeline(period));
      }

      router.push("/strategy-period");
    } catch {
      // errors already toasted by the hooks
    } finally {
      setSubmitting(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="w-full max-w-sm text-center text-sm text-gray-500">
        Loading your account details...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm flex flex-col gap-5"
    >
      {/* Period Name */}
      <div>
        <Label className="mb-2 block">
          Period Name <span className="text-red-500">*</span>
        </Label>
        <Input
          placeholder="e.g. FY 2026-2027"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      {/* Period Type */}
      <div>
        <Label className="mb-2 block">
          Period Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={form.periodType}
          onValueChange={(v) => setForm({ ...form, periodType: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="mb-2 block">
            End Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#3838EC] hover:bg-[#2e2ed6] text-white text-base font-semibold mt-2"
      >
        {submitting ? "Creating Period..." : "Add Period"}
      </Button>
    </form>
  );
}
