"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { ObjectiveType } from "@/types/graphql";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ObjectiveForm() {
  const router = useRouter();
  const { createObjective, updateObjective, loading } = useObjectiveMutations();
  const { strategicPeriods, loading: periodsLoading } = useStrategicPeriods();
  const { strategicPlans, loading: plansLoading } = useStrategicPlansQuery();
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const user = useAuthStore((state) => state.user);

  // For backwards compatibility
  const selected = selectedPeriod ? { period: selectedPeriod } : null;
  
  // Get the active strategic plan and organizationId
  const activeStrategicPlan = strategicPlans.find(plan => plan.isActive);
  const organizationId = activeStrategicPlan?.organization?.organizationId || "";

  // Check if user is at corporate level (ADMIN or SUPER_ADMIN)
  const isCorporateUser =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [objectiveName, setObjectiveName] = useState("");
  const [objectiveType, setObjectiveType] = useState<ObjectiveType | "">(
    isCorporateUser ? "CORPORATE" : ""
  );
  const [strategicPeriodValue, setStrategicPeriodValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const objectiveTypes: { value: ObjectiveType; label: string }[] = [
    { value: "CORPORATE", label: "Corporate" },
    { value: "DIVISION", label: "Division" },
    { value: "DEPARTMENT", label: "Department" },
    { value: "PERSONNEL", label: "Personnel" },
  ];

  useEffect(() => {
    if (selected?.period) {
      setStrategicPeriodValue(selected.period.strategicPeriodId);
    }
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!objectiveName.trim()) {
      toast.error("Please enter an objective name");
      return;
    }

    if (!objectiveType) {
      toast.error("Please select an objective type");
      return;
    }

    if (!strategicPeriodValue) {
      toast.error("Please select a strategic period");
      return;
    }

    if (!organizationId) {
      toast.error("No active strategic plan found. Please contact your administrator.");
      return;
    }

    if (!activeStrategicPlan?.strategicPlanId) {
      toast.error("No active strategic plan found. Please contact your administrator.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Map ObjectiveType to ObjectiveLevel
      // CORPORATE -> CORPORATE, DIVISION -> DIVISION, DEPARTMENT -> DEPARTMENT, PERSONNEL -> INDIVIDUAL
      const levelMap: Record<ObjectiveType, string> = {
        CORPORATE: "CORPORATE",
        DIVISION: "DIVISION",
        DEPARTMENT: "DEPARTMENT",
        PERSONNEL: "INDIVIDUAL",
      };

      const created = await createObjective({
        input: {
          title: objectiveName.trim(),
          type: objectiveType,
          level: levelMap[objectiveType],
          strategicPeriodId: strategicPeriodValue,
          organizationId: organizationId,
          strategicPlanId: activeStrategicPlan.strategicPlanId,
        },
      });

      // Auto-approve corporate-level objectives immediately after creation
      if (objectiveType === "CORPORATE" && created?.objectiveId) {
        await updateObjective({
          input: {
            objectiveId: created.objectiveId,
            status: "APPROVED",
          },
        });
      }

      toast.success(
        objectiveType === "CORPORATE"
          ? "Objective created and auto-approved"
          : "Objective created successfully!"
      );
      router.push("/dashboard/objectives");
    } catch (error) {
      console.error("Error creating objective:", error);
      toast.error("Failed to create objective. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-[70vh] flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Content Container */}
        <div className="flex-1 space-y-6 pb-6">
          {/* Objective Name */}
          <div>
            <Label className="block font-medium mb-2">Objective Name *</Label>
            <Input
              placeholder="Enter objective name"
              value={objectiveName}
              onChange={(e) => setObjectiveName(e.target.value)}
              required
              className="max-w-xl"
            />
          </div>

          {/* Objective Type */}
          <div>
            <Label className="block font-medium mb-2">Objective Type *</Label>
            <Select
              value={objectiveType}
              onValueChange={(val) => setObjectiveType(val as ObjectiveType)}
            >
              <SelectTrigger className="max-w-xl">
                <SelectValue placeholder="Select objective type" />
              </SelectTrigger>
              <SelectContent>
                {objectiveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strategic Period */}
          <div>
            <Label className="block font-medium mb-2">Strategic Period *</Label>
            <Select
              value={strategicPeriodValue}
              onValueChange={(val) => setStrategicPeriodValue(val)}
            >
              <SelectTrigger className="max-w-xl">
                <SelectValue placeholder="Select strategic period" />
              </SelectTrigger>
              <SelectContent>
                {periodsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading periods...
                  </SelectItem>
                ) : (
                  strategicPeriods.map((period) => (
                    <SelectItem
                      key={period.strategicPeriodId}
                      value={period.strategicPeriodId}
                    >
                      {new Date(period.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      {" - "}
                      {new Date(period.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      {" ("}
                      {period.length} {period.length === 1 ? "year" : "years"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Strategic Plan Info */}
          {plansLoading ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xl">
              <p className="text-sm text-gray-600">Loading strategic plan...</p>
            </div>
          ) : activeStrategicPlan ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-xl">
              <p className="text-sm text-green-800">
                <strong>Strategic Plan:</strong> {activeStrategicPlan.title}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Organization: {activeStrategicPlan.organization.name}
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xl">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> No active strategic plan found. Please contact your administrator to create one.
              </p>
            </div>
          )}

          {/* Note about KPIs */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xl">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> KPIs can be added to this objective after
              it&apos;s created. You&apos;ll be able to manage KPIs from the
              objective details page.
            </p>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-4 py-4 bottom-0">
          <Button
            type="button"
            variant="ghost"
            className="text-primary cursor-pointer border border-primary hover:bg-primary hover:text-white"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#3838EC] text-white hover:bg-[#2e2ed6]"
            disabled={
              loading ||
              isSubmitting ||
              plansLoading ||
              !objectiveName.trim() ||
              !objectiveType ||
              !strategicPeriodValue ||
              !organizationId ||
              !activeStrategicPlan
            }
          >
            {loading || isSubmitting ? "Creating..." : "Add Objective"}
          </Button>
        </div>
      </form>
    </div>
  );
}
