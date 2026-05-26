"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Users, Calendar, Clock, CheckCircle2, Archive } from "lucide-react";
import { useEvaluationCycles } from "@/hooks/evaluations/useEvaluationCycles";
import { EvaluationCycleStatus } from "@/types/evaluation";

interface CycleStatusTabsProps {
  onEditCycle: (cycle: any) => void;
  onAssignEvaluators: (cycle: any) => void;
}

export default function CycleStatusTabs({
  onEditCycle,
  onAssignEvaluators,
}: CycleStatusTabsProps) {
  const [activeStatusTab, setActiveStatusTab] = useState<EvaluationCycleStatus>(
    EvaluationCycleStatus.ACTIVE
  );

  // Fetch cycles for each status
  const { cycles: activeCycles, loading: activeLoading } = useEvaluationCycles(
    1,
    20,
    "",
    EvaluationCycleStatus.ACTIVE
  );
  const { cycles: upcomingCycles, loading: upcomingLoading } = useEvaluationCycles(
    1,
    20,
    "",
    EvaluationCycleStatus.UPCOMING
  );
  const { cycles: closedCycles, loading: closedLoading } = useEvaluationCycles(
    1,
    20,
    "",
    EvaluationCycleStatus.CLOSED
  );
  const { cycles: archivedCycles, loading: archivedLoading } = useEvaluationCycles(
    1,
    20,
    "",
    EvaluationCycleStatus.ARCHIVED
  );

  const getStatusIcon = (status: EvaluationCycleStatus) => {
    switch (status) {
      case EvaluationCycleStatus.ACTIVE:
        return <CheckCircle2 className="h-4 w-4" />;
      case EvaluationCycleStatus.UPCOMING:
        return <Clock className="h-4 w-4" />;
      case EvaluationCycleStatus.CLOSED:
        return <Calendar className="h-4 w-4" />;
      case EvaluationCycleStatus.ARCHIVED:
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: EvaluationCycleStatus) => {
    switch (status) {
      case EvaluationCycleStatus.ACTIVE:
        return "bg-green-100 text-green-700";
      case EvaluationCycleStatus.UPCOMING:
        return "bg-blue-100 text-blue-700";
      case EvaluationCycleStatus.CLOSED:
        return "bg-orange-100 text-orange-700";
      case EvaluationCycleStatus.ARCHIVED:
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderCycleCards = (cycles: any[], loading: boolean, status: EvaluationCycleStatus) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading cycles...</p>
          </div>
        </div>
      );
    }

    if (!cycles || cycles.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              {getStatusIcon(status)}
              <div>
                <p className="text-gray-500 font-medium">
                  No {status.toLowerCase()} cycles
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {status === EvaluationCycleStatus.ACTIVE &&
                    "Create a new cycle and set it to active"}
                  {status === EvaluationCycleStatus.UPCOMING &&
                    "Schedule future evaluation cycles"}
                  {status === EvaluationCycleStatus.CLOSED &&
                    "Completed cycles will appear here"}
                  {status === EvaluationCycleStatus.ARCHIVED &&
                    "Archived cycles for historical reference"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map((cycle: any) => (
          <Card
            key={cycle.evaluationCycleId}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">
                    {cycle.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-600">
                      {new Date(cycle.startDate).toLocaleDateString()} -{" "}
                      {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusBadgeClass(cycle.status)}>
                  {cycle.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {cycle.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {cycle.description}
                </p>
              )}
              
              {/* Strategic Period */}
              {cycle.strategicPeriod && (
                <div className="mb-4 p-2 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-500">Strategic Period</p>
                  <p className="text-sm font-medium text-gray-900">
                    {cycle.strategicPeriod.name}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEditCycle(cycle)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {(status === EvaluationCycleStatus.ACTIVE ||
                  status === EvaluationCycleStatus.UPCOMING) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onAssignEvaluators(cycle)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                )}
              </div>

              {/* Created By */}
              {cycle.createdBy && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created by {cycle.createdBy.fullName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs
      value={activeStatusTab}
      onValueChange={(value) => setActiveStatusTab(value as EvaluationCycleStatus)}
      className="space-y-6"
    >
      <TabsList className="bg-white p-1 border border-gray-200 rounded-lg">
        <TabsTrigger
          value={EvaluationCycleStatus.ACTIVE}
          className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Active
          {activeCycles && activeCycles.length > 0 && (
            <Badge className="ml-1 bg-green-100 text-green-700 text-xs">
              {activeCycles.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value={EvaluationCycleStatus.UPCOMING}
          className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 gap-2"
        >
          <Clock className="h-4 w-4" />
          Upcoming
          {upcomingCycles && upcomingCycles.length > 0 && (
            <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs">
              {upcomingCycles.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value={EvaluationCycleStatus.CLOSED}
          className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 gap-2"
        >
          <Calendar className="h-4 w-4" />
          Closed
          {closedCycles && closedCycles.length > 0 && (
            <Badge className="ml-1 bg-orange-100 text-orange-700 text-xs">
              {closedCycles.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value={EvaluationCycleStatus.ARCHIVED}
          className="data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 gap-2"
        >
          <Archive className="h-4 w-4" />
          Archived
          {archivedCycles && archivedCycles.length > 0 && (
            <Badge className="ml-1 bg-gray-100 text-gray-700 text-xs">
              {archivedCycles.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={EvaluationCycleStatus.ACTIVE} className="mt-6">
        {renderCycleCards(activeCycles, activeLoading, EvaluationCycleStatus.ACTIVE)}
      </TabsContent>

      <TabsContent value={EvaluationCycleStatus.UPCOMING} className="mt-6">
        {renderCycleCards(upcomingCycles, upcomingLoading, EvaluationCycleStatus.UPCOMING)}
      </TabsContent>

      <TabsContent value={EvaluationCycleStatus.CLOSED} className="mt-6">
        {renderCycleCards(closedCycles, closedLoading, EvaluationCycleStatus.CLOSED)}
      </TabsContent>

      <TabsContent value={EvaluationCycleStatus.ARCHIVED} className="mt-6">
        {renderCycleCards(archivedCycles, archivedLoading, EvaluationCycleStatus.ARCHIVED)}
      </TabsContent>
    </Tabs>
  );
}
