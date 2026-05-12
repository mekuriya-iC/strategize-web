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
import { Textarea } from "@/components/ui/textarea";
import { useObjectiveMutations } from "@/hooks/objectives/useObjectiveMutations";
import { useStrategicPeriods } from "@/hooks/objectives/useStrategicPeriods";
import { useStrategicPlansQuery } from "@/hooks/strategic-plans/useStrategicPlans";
import { useStrategicPillars } from "@/hooks/strategicPlans/useStrategicPlans";
import { useAuthStore, useStrategicPeriodStore } from "@/stores";
import { ObjectiveType } from "@/types/graphql";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SearchableSelect } from "@/components/ui/searchable-select";

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

  // Fetch strategic pillars from the active plan
  const { strategicPillars, loading: pillarsLoading } = useStrategicPillars(
    activeStrategicPlan?.strategicPlanId
  );

  // Check if user is at corporate level (ADMIN or SUPER_ADMIN)
  const isCorporateUser =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [selectedPillarId, setSelectedPillarId] = useState<string>("");
  const [objectiveName, setObjectiveName] = useState("");
  const [objectiveDescription, setObjectiveDescription] = useState("");
  const [objectiveType, setObjectiveType] = useState<ObjectiveType | "">(
    isCorporateUser ? "CORPORATE" : ""
  );
  const [strategicPeriodValue, setStrategicPeriodValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only CORPORATE objectives can be created directly
  // Division/Department/Personnel objectives are created through cascade/assignment
  const objectiveTypes: { value: ObjectiveType; label: string }[] = [
    { value: "CORPORATE", label: "Corporate" },
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

      const inputData: any = {
        title: objectiveName.trim(),
        description: objectiveDescription.trim() || undefined,
        type: objectiveType,
        level: levelMap[objectiveType],
        strategicPeriodId: strategicPeriodValue,
        organizationId: organizationId,
        strategicPlanId: activeStrategicPlan.strategicPlanId,
        strategicPillarId: (selectedPillarId && selectedPillarId !== "none") ? selectedPillarId : undefined,
      };

      // CRITICAL: Only set assigneeType for non-corporate objectives
      // Corporate objectives are organization-wide and not "assigned"
      // Valid assigneeType values: DIVISION, DEPARTMENT, PERSONNEL (NOT CORPORATE)
      if (objectiveType !== "CORPORATE") {
        inputData.assigneeType = objectiveType;
      }

      console.log("🎯 Creating objective with input:", inputData);

      const created = await createObjective({
        input: inputData,
      });

      console.log("✅ Objective created:", created);

      // Auto-approve corporate-level objectives immediately after creation
      if (objectiveType === "CORPORATE" && created?.objectiveId) {
        try {
          console.log("🔄 Auto-approving corporate objective:", created.objectiveId);
          
          const updated = await updateObjective({
            input: {
              objectiveId: created.objectiveId,
              status: "APPROVED",
            },
          });
          
          console.log("✅ Objective auto-approved:", updated);
          toast.success("Objective created and auto-approved");
        } catch (approvalError) {
          console.error("❌ Failed to auto-approve objective:", approvalError);
          toast.warning("Objective created but auto-approval failed. Please approve manually.");
        }
      } else {
        toast.success("Objective created successfully!");
      }
      
      // Wait a bit for backend to process before redirecting
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push("/dashboard");
    } catch (error) {
      console.error("❌ Error creating objective:", error);
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
          {/* Strategic Plan Info */}
          {plansLoading ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xl">
              <p className="text-sm text-gray-600">Loading strategic plan...</p>
            </div>
          ) : activeStrategicPlan ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-xl">
              <p className="text-sm text-green-800">
                <strong>Active Strategic Plan:</strong> {activeStrategicPlan.title}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Organization: {activeStrategicPlan.organization.name}
              </p>
            </div>
          ) : (
            <Alert className="bg-red-50 border-red-200 max-w-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> No active strategic plan found. Please contact your administrator to create one.
              </AlertDescription>
            </Alert>
          )}

          {/* Strategic Pillar Selection */}
          <div>
            <Label className="block font-medium mb-2">
              Strategic Pillar <span className="text-gray-500 text-sm">(Optional)</span>
            </Label>
            <SearchableSelect
              value={selectedPillarId === "none" ? "" : selectedPillarId}
              onValueChange={(val) => setSelectedPillarId(val || "none")}
              placeholder={
                pillarsLoading 
                  ? "Loading pillars..." 
                  : strategicPillars.length === 0 
                  ? "No pillars available" 
                  : "Select a strategic pillar"
              }
              searchPlaceholder="Search pillars..."
              emptyMessage={strategicPillars.length === 0 && !isAdmin ? "No pillars available. Contact an admin to create one." : "No pillars found"}
              disabled={!activeStrategicPlan || pillarsLoading}
              className="max-w-xl"
              clearable
              options={strategicPillars.map((pillar) => ({
                value: pillar.strategicPillarId,
                label: pillar.name,
                description: pillar.description || undefined,
              }))}
              customContent={
                strategicPillars.length === 0 && isAdmin && activeStrategicPlan ? (
                  <div className="px-2 py-1.5 pointer-events-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 pointer-events-auto"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/dashboard/strategic-plans/${activeStrategicPlan.strategicPlanId}`);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Pillar
                    </Button>
                  </div>
                ) : undefined
              }
            />
            {strategicPillars.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Link this objective to a strategic pillar from the active plan
              </p>
            )}
          </div>

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

          {/* Objective Description */}
          <div>
            <Label className="block font-medium mb-2">
              Description <span className="text-gray-500 text-sm">(Optional)</span>
            </Label>
            <Textarea
              placeholder="Enter objective description"
              value={objectiveDescription}
              onChange={(e) => setObjectiveDescription(e.target.value)}
              className="max-w-xl"
              rows={3}
            />
          </div>

          {/* Objective Type */}
          <div>
            <Label className="block font-medium mb-2">Objective Type *</Label>
            <Select
              value={objectiveType}
              onValueChange={(val) => setObjectiveType(val as ObjectiveType)}
              disabled={true}  // Always disabled - only CORPORATE can be created
            >
              <SelectTrigger className="max-w-xl">
                <SelectValue placeholder="Corporate (Only type available)" />
              </SelectTrigger>
              <SelectContent>
                {objectiveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Only Corporate objectives can be created directly. Division, Department, and Personnel objectives are created through the cascade/assignment process.
            </p>
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
