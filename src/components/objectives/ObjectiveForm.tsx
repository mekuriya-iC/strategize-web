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
  const { strategicPlans, loading: plansLoading } = useStrategicPlansQuery();
  const selectedPeriod = useStrategicPeriodStore((state) => state.selectedPeriod);
  const user = useAuthStore((state) => state.user);

  // For backwards compatibility
  const selected = selectedPeriod ? { period: selectedPeriod } : null;
  
  // Get the active strategic plan and organizationId
  const activeStrategicPlan = strategicPlans.find(plan => plan.isActive);
  const organizationId = activeStrategicPlan?.organization?.organizationId || "";

  // Fetch strategic periods filtered by the active strategic plan
  const { strategicPeriods, loading: periodsLoading } = useStrategicPeriods({
    page: 1,
    limit: 100, // Fetch more periods to ensure we get all
    strategicPlanId: activeStrategicPlan?.strategicPlanId,
  });

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
  const [hasManuallySelected, setHasManuallySelected] = useState(false); // Track manual selection

  // Debug logging
  useEffect(() => {
    console.log("📊 Strategic Periods loaded:", {
      count: strategicPeriods.length,
      loading: periodsLoading,
      activeStrategicPlanId: activeStrategicPlan?.strategicPlanId,
      periods: strategicPeriods.map(p => ({
        id: p.strategicPeriodId,
        name: p.name,
        type: p.periodType,
        status: p.status,
      })),
    });
  }, [strategicPeriods, periodsLoading, activeStrategicPlan]);

  useEffect(() => {
    console.log("🎯 Selected period value changed:", {
      value: strategicPeriodValue,
      exists: strategicPeriods.some(p => p.strategicPeriodId === strategicPeriodValue),
      periodName: strategicPeriods.find(p => p.strategicPeriodId === strategicPeriodValue)?.name,
    });
  }, [strategicPeriodValue, strategicPeriods]);

  // Only CORPORATE objectives can be created directly
  // Division/Department/Personnel objectives are created through cascade/assignment
  const objectiveTypes: { value: ObjectiveType; label: string }[] = [
    { value: "CORPORATE", label: "Corporate" },
  ];

  useEffect(() => {
    // Don't auto-select if periods are still loading or user has manually selected
    if (periodsLoading || strategicPeriods.length === 0 || hasManuallySelected) {
      return;
    }

    if (selected?.period) {
      // If there's a selected period from the store, use it only if it exists in the current list
      const periodExists = strategicPeriods.find(
        p => p.strategicPeriodId === selected.period.strategicPeriodId
      );
      if (periodExists) {
        setStrategicPeriodValue(selected.period.strategicPeriodId);
      } else {
        console.warn("⚠️ Selected period from store not found in available periods, will auto-select");
        // Don't clear, let the auto-selection below handle it
      }
    }
    
    // Only auto-select if no value is set
    if (!strategicPeriodValue) {
      // Priority 1: Find the current active period
      const activePeriod = strategicPeriods.find(p => 
        p.status?.toUpperCase() === 'ACTIVE'
      );
      
      // Priority 2: Find the first ANNUAL period (best for corporate objectives)
      const firstAnnualPeriod = strategicPeriods.find(p => 
        p.periodType?.toUpperCase() === 'ANNUAL'
      );
      
      // Priority 3: First period in the list
      const periodToSelect = activePeriod || firstAnnualPeriod || strategicPeriods[0];
      
      if (periodToSelect) {
        console.log("🎯 Auto-selecting period:", {
          name: periodToSelect.name,
          id: periodToSelect.strategicPeriodId,
          type: periodToSelect.periodType,
          status: periodToSelect.status,
          reason: activePeriod ? 'active' : firstAnnualPeriod ? 'first annual' : 'first available'
        });
        setStrategicPeriodValue(periodToSelect.strategicPeriodId);
      }
    }
  }, [selected, strategicPeriods, strategicPeriodValue, periodsLoading, hasManuallySelected]);

  // Helper function to calculate period length in years
  const calculatePeriodLength = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 365);
  };

  // Filter periods based on objective type for better UX
  const getRecommendedPeriods = () => {
    if (!objectiveType) return strategicPeriods;
    
    // Corporate objectives should use ANNUAL periods
    if (objectiveType === 'CORPORATE') {
      const annualPeriods = strategicPeriods.filter(p => 
        p.periodType?.toUpperCase() === 'ANNUAL'
      );
      // If no annual periods, show all
      return annualPeriods.length > 0 ? annualPeriods : strategicPeriods;
    }
    
    // Division/Department objectives can use QUARTERLY or ANNUAL
    if (objectiveType === 'DIVISION' || objectiveType === 'DEPARTMENT') {
      const relevantPeriods = strategicPeriods.filter(p => 
        p.periodType?.toUpperCase() === 'ANNUAL' || 
        p.periodType?.toUpperCase() === 'QUARTERLY'
      );
      return relevantPeriods.length > 0 ? relevantPeriods : strategicPeriods;
    }
    
    // Personnel objectives can use any period type
    return strategicPeriods;
  };

  const filteredPeriods = getRecommendedPeriods();

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

    // Validate that the selected period exists
    const selectedPeriodExists = strategicPeriods.find(
      p => p.strategicPeriodId === strategicPeriodValue
    );
    
    if (!selectedPeriodExists) {
      toast.error("Selected strategic period is invalid. Please select a valid period.");
      console.error("❌ Invalid period ID:", strategicPeriodValue);
      console.error("Available periods:", strategicPeriods.map(p => p.strategicPeriodId));
      return;
    }

    console.log("✅ Validation passed, all required fields present");

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
        // Only include strategicPillarId if a valid pillar is selected
        ...(selectedPillarId && selectedPillarId !== "none" && selectedPillarId !== "" ? { strategicPillarId: selectedPillarId } : {}),
      };

      // CRITICAL: Only set assigneeType for non-corporate objectives
      // Corporate objectives are organization-wide and not "assigned"
      // Valid assigneeType values: DIVISION, DEPARTMENT, PERSONNEL (NOT CORPORATE)
      if (objectiveType !== "CORPORATE") {
        inputData.assigneeType = objectiveType;
      }

      console.log("🎯 Creating objective with input:", inputData);
      console.log("📋 Selected period:", selectedPeriodExists);

      const created = await createObjective({
        input: inputData,
      });

      console.log("✅ Objective created:", {
        objectiveId: created?.objectiveId,
        title: created?.title,
        strategicPeriodId: strategicPeriodValue,
        selectedPeriod: selectedPeriodExists,
      });
      
      toast.success("Objective created successfully!");
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('strategicPlanId');
        sessionStorage.removeItem('planStartDate');
        sessionStorage.removeItem('planEndDate');
        sessionStorage.removeItem('selectedOrgTemplate');
      }
      
      // Wait a bit for backend to process before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to objectives page to see the created objective
      router.push("/dashboard/objectives");
    } catch (error: any) {
      console.error("❌ Error creating objective:", error);
      
      // Check for foreign key constraint error
      if (error?.message?.includes('foreign key constraint') || 
          error?.message?.includes('FK_504432a198fb1db8a723c02e98e')) {
        toast.error("The selected strategic period is invalid or has been deleted. Please select a different period.");
      } else {
        toast.error(error?.message || "Failed to create objective. Please try again.");
      }
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
            {objectiveType === 'CORPORATE' && filteredPeriods.length < strategicPeriods.length && (
              <p className="text-xs text-blue-600 mb-2">
                💡 Showing annual periods (recommended for corporate objectives)
              </p>
            )}
            <Select
              value={strategicPeriodValue}
              onValueChange={(val) => {
                console.log("🔄 Period selection changed to:", val);
                setStrategicPeriodValue(val);
                setHasManuallySelected(true); // Mark as manually selected
              }}
            >
              <SelectTrigger className="max-w-xl">
                <SelectValue placeholder="Select strategic period" />
              </SelectTrigger>
              <SelectContent>
                {periodsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading periods...
                  </SelectItem>
                ) : filteredPeriods.length === 0 ? (
                  <SelectItem value="no-periods" disabled>
                    No strategic periods found
                  </SelectItem>
                ) : (
                  filteredPeriods.map((period) => {
                    const isActive = period.status?.toUpperCase() === 'ACTIVE';
                    const periodTypeLabel = period.periodType?.toUpperCase() === 'ANNUAL' ? '📅' : 
                                           period.periodType?.toUpperCase() === 'QUARTERLY' ? '📊' : 
                                           period.periodType?.toUpperCase() === 'MONTHLY' ? '📆' : '';
                    
                    const displayText = `${periodTypeLabel} ${period.name} (${new Date(period.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} - ${new Date(period.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })})${isActive ? ' • ACTIVE' : ''}`;
                    
                    return (
                      <SelectItem
                        key={period.strategicPeriodId}
                        value={period.strategicPeriodId}
                        className={isActive ? 'font-semibold bg-green-50' : ''}
                      >
                        {displayText}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {filteredPeriods.length === 0 && !periodsLoading && (
              <p className="text-xs text-red-500 mt-1">
                No strategic periods found. Please create periods first in the strategic plan setup.
              </p>
            )}
            {filteredPeriods.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {filteredPeriods.length} period{filteredPeriods.length !== 1 ? 's' : ''} available
                {strategicPeriodValue && ` • Selected: ${filteredPeriods.find(p => p.strategicPeriodId === strategicPeriodValue)?.name || 'Unknown'}`}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-2">
              📅 Annual • 📊 Quarterly • 📆 Monthly
            </p>
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
              periodsLoading ||
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
