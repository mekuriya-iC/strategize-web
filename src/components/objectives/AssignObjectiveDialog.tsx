"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, Building2, CheckCircle, AlertCircle } from "lucide-react";
import { useAssignmentDialog } from "@/hooks/useAssignmentDialog";
import {
  AssigneeTab,
  KPISelectionCard,
  TargetAssignmentCard,
  AssignmentListCard,
  AssignmentPreviewCard,
} from "./assign-dialog";
import type { Objective, Kpi } from "@/types/graphql";

interface AssignObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: Objective;
  kpis: Kpi[];
  onSuccess?: () => void;
}

export default function AssignObjectiveDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess,
}: AssignObjectiveDialogProps) {
  const {
    // State
    searchTerm,
    setSearchTerm,
    isSubmitting,
    assignments,
    bulkAssignmentValues,
    setBulkAssignmentValues,
    selectedKPIs,
    selectedAssignees,
    assigneeType,
    assignmentErrors,
    loading,
    employeesLoading,
    employeesError,

    // Data
    filteredDivisions,
    filteredDepartments,
    filteredEmployees,
    allObjectives,

    // Computed
    isFormValid,
    getTabCount,
    getAssigneeDetails,
    getAssigneeObjectiveType,
    getYearlyTotalFromTargets,

    // Actions
    handleAssigneeSelection,
    handleKPISelection,
    handleSelectAllKPIs,
    handleAddToAssignments,
    handleRemoveAssignment,
    handleBulkAssignment,
    handleSubmit,
    updateAssigneeType,
    updateTargetAssignment,
    getTargetAssignment,
    getTotalAssignedTarget,
    refetchObjectives,
  } = useAssignmentDialog({
    open,
    onOpenChange,
    objective,
    kpis,
    onSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Objective
          </DialogTitle>
          <DialogDescription>
            Assign &quot;{objective.name}&quot; to a{" "}
            {objective.type === "CORPORATE"
              ? "division or department"
              : objective.type === "DIVISION"
              ? "department"
              : "employee"}{" "}
            with selected KPIs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Smart Assignment Info */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-green-800 text-sm">
              <strong>Smart Assignment:</strong> The system prevents duplicate
              objectives by adding new KPIs to existing objectives when
              possible.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchObjectives()}
              className="ml-auto text-xs"
            >
              🔄 Refresh Data
            </Button>
          </div>

          {/* Assignee Type Selection */}
          <Tabs
            value={assigneeType}
            onValueChange={(value) =>
              updateAssigneeType(value as "DIVISION" | "DEPARTMENT" | "PERSONNEL")
            }
          >
            <TabsList
              className={`grid w-full ${
                getTabCount() === 1
                  ? "grid-cols-1"
                  : getTabCount() === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              }`}
            >
              {objective.type === "CORPORATE" && (
                <TabsTrigger value="DIVISION" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Division
                </TabsTrigger>
              )}
              {(objective.type === "CORPORATE" || objective.type === "DIVISION") && (
                <TabsTrigger value="DEPARTMENT" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department
                </TabsTrigger>
              )}
              {objective.type === "DEPARTMENT" && (
                <TabsTrigger value="PERSONNEL" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employee
                </TabsTrigger>
              )}
            </TabsList>

            <AssigneeTab
              type="DIVISION"
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              items={filteredDivisions}
              selectedAssignees={selectedAssignees}
              onAssigneeSelection={handleAssigneeSelection}
            />

            <AssigneeTab
              type="DEPARTMENT"
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              items={filteredDepartments}
              selectedAssignees={selectedAssignees}
              onAssigneeSelection={handleAssigneeSelection}
            />

            <AssigneeTab
              type="PERSONNEL"
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              items={filteredEmployees}
              selectedAssignees={selectedAssignees}
              onAssigneeSelection={handleAssigneeSelection}
              loading={employeesLoading}
              error={employeesError}
            />
          </Tabs>

          <Separator />

          {/* Add to Assignment List Button */}
          {selectedAssignees.length > 0 && selectedKPIs.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={handleAddToAssignments}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add {selectedAssignees.length} {assigneeType.toLowerCase()}
                {selectedAssignees.length > 1 ? "s" : ""} with{" "}
                {selectedKPIs.length} KPI{selectedKPIs.length > 1 ? "s" : ""} to
                Assignment List
              </Button>
            </div>
          )}

          <Separator />

          {/* KPI Selection */}
          <KPISelectionCard
            kpis={kpis}
            selectedKPIs={selectedKPIs}
            onKPISelection={handleKPISelection}
            onSelectAllKPIs={handleSelectAllKPIs}
          />

          {/* Target Assignment Section */}
          <TargetAssignmentCard
            selectedKPIs={selectedKPIs}
            kpis={kpis}
            assignments={assignments}
            bulkAssignmentValues={bulkAssignmentValues}
            onBulkAssignmentValueChange={(kpiId, value) =>
              setBulkAssignmentValues((prev) => ({ ...prev, [kpiId]: value }))
            }
            onBulkAssignment={handleBulkAssignment}
            getTargetAssignment={getTargetAssignment}
            getTotalAssignedTarget={getTotalAssignedTarget}
            getYearlyTotalFromTargets={getYearlyTotalFromTargets}
            updateTargetAssignment={updateTargetAssignment}
            getAssigneeDetails={getAssigneeDetails}
          />

          {/* Assignment List */}
          <AssignmentListCard
            assignments={assignments}
            kpis={kpis}
            onRemoveAssignment={handleRemoveAssignment}
          />

          {/* Validation Errors */}
          {assignmentErrors.length > 0 && (
            <div className="space-y-2">
              {assignmentErrors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Assignment Preview */}
          <AssignmentPreviewCard
            assignments={assignments}
            kpis={kpis}
            allObjectives={allObjectives || []}
            objective={objective}
            getAssigneeObjectiveType={getAssigneeObjectiveType}
          />

          {/* Validation Warning */}
          {assignments.length === 0 && assignmentErrors.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">
                Please add at least one assignment to the list before submitting.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading || isSubmitting
              ? "Assigning..."
              : `Assign to ${assignments.length} ${
                  assignments.length === 1 ? "Entity" : "Entities"
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

