"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import { useObjective } from "@/hooks/useObjectives";
import { useKPIs } from "@/hooks/useKPIs";
import KPIList from "@/components/objectives/KPIList";
import KPIForm from "@/components/objectives/KPIForm";

export default function ObjectiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const objectiveId = params.id as string;

  const [showAddKPI, setShowAddKPI] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);

  // Fetch objective details
  const {
    objective,
    loading: objectiveLoading,
    error: objectiveError,
  } = useObjective({
    objectiveId,
  });

  // Fetch KPIs for this objective
  const {
    kpis,
    loading: kpisLoading,
    error: kpisError,
    refetch,
  } = useKPIs({
    // Note: We filter by objective on the frontend since API might not support it
  });

  // Filter KPIs for this specific objective (handle null objectives)
  const objectiveKPIs = kpis.filter(
    (kpi) => kpi.objective?.objectiveId === objectiveId
  );

  const handleBack = () => {
    router.back();
  };

  const handleAddKPI = () => {
    setShowAddKPI(true);
    setEditingKPI(null);
  };

  const handleEditKPI = (kpiId: string) => {
    setEditingKPI(kpiId);
    setShowAddKPI(true);
  };

  const handleKPISuccess = () => {
    setShowAddKPI(false);
    setEditingKPI(null);
    refetch();
  };

  if (objectiveLoading) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (objectiveError || !objective) {
    return (
      <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Objective
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            {objectiveError?.message || "Failed to load objective details"}
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    NOT_SUBMITTED: "bg-pink-100 text-pink-600",
    PENDING: "bg-yellow-100 text-yellow-600",
    APPROVED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const typeColors = {
    CORPORATE: "bg-purple-100 text-purple-600",
    DIVISION: "bg-blue-100 text-blue-600",
    DEPARTMENT: "bg-green-100 text-green-600",
    PERSONNEL: "bg-orange-100 text-orange-600",
  };

  if (showAddKPI) {
    return (
      <KPIForm
        objectiveId={objectiveId}
        kpiId={editingKPI}
        onSuccess={handleKPISuccess}
        onCancel={() => setShowAddKPI(false)}
        objective={objective}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3F3F46] mb-2">
            {objective.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${typeColors[objective.type]} border-0`}>
              {objective.type}
            </Badge>
            <Badge className={`${statusColors[objective.status]} border-0`}>
              {objective.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Objective Details Card */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Objective Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{objective.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{objective.status.replace("_", " ")}</p>
          </div>
          {objective.strategicPeriod && (
            <>
              <div>
                <p className="text-sm text-gray-500">Strategic Period</p>
                <p className="font-medium">
                  {new Date(
                    objective.strategicPeriod.startDate
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    objective.strategicPeriod.endDate
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">
                  {objective.strategicPeriod.length}{" "}
                  {objective.strategicPeriod.length === 1 ? "year" : "years"}
                </p>
              </div>
            </>
          )}
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">
              {new Date(objective.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
          <Button
            onClick={handleAddKPI}
            className="bg-[#3838EC] hover:bg-[#2e2ed6]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add KPI
          </Button>
        </div>

        {kpisLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading KPIs...</p>
          </div>
        ) : kpisError ? (
          <div className="text-center py-8">
            <p className="text-red-600">
              Error loading KPIs: {kpisError.message}
            </p>
          </div>
        ) : objectiveKPIs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              No KPIs have been added to this objective yet.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click &quot;Add KPI&quot; to get started.
            </p>
          </div>
        ) : (
          <KPIList
            kpis={objectiveKPIs}
            onEdit={handleEditKPI}
            onRefresh={refetch}
          />
        )}
      </div>
    </div>
  );
}
