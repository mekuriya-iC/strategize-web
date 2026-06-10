"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_KPI, GET_KPIS } from "@/lib/graphql/queries/kpis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronDown,
  Target,
  Users,
  Building2,
  Briefcase,
  User,
  TrendingUp,
} from "lucide-react";

interface KPICascadeViewProps {
  rootKpiId?: string;
}

export default function KPICascadeView({ rootKpiId }: KPICascadeViewProps) {
  const [selectedRootKpi, setSelectedRootKpi] = useState(rootKpiId || "");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get all KPIs to find root KPIs
  const { data: allKpisData } = useQuery(GET_KPIS, {
    variables: { page: 1, limit: 1000 },
  });

  // Get selected KPI with all its children
  const { data: kpiData, loading } = useQuery(GET_KPI, {
    variables: { kpiId: selectedRootKpi },
    skip: !selectedRootKpi,
  });

  const allKpis = allKpisData?.kpis?.items || [];
  const rootKpis = allKpis.filter(
    (kpi: any) => !kpi.parent && !kpi.isDeleted
  );
  const selectedKpi = kpiData?.kpi;

  const toggleNode = (kpiId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(kpiId)) {
      newExpanded.delete(kpiId);
    } else {
      newExpanded.add(kpiId);
    }
    setExpandedNodes(newExpanded);
  };

  const getKpiChildren = (parentKpiId: string) => {
    return allKpis.filter(
      (kpi: any) =>
        kpi.parent?.kpiId === parentKpiId && !kpi.isDeleted
    );
  };

  const calculateProgress = (kpi: any): number => {
    const latestUpdate = kpi.latestUpdate;
    const achieved = latestUpdate?.achievedValue ?? 0;
    const target = kpi.targetValue ?? 0;
    const baseline = kpi.baselineValue ?? 0;

    if (target === 0 || target === baseline) return 0;

    const progress = ((achieved - baseline) / (target - baseline)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 90) return "bg-emerald-500";
    if (progress >= 70) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (progress: number): string => {
    if (progress >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (progress >= 70) return "text-blue-600 dark:text-blue-400";
    if (progress >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "CORPORATE":
        return <Building2 className="w-4 h-4" />;
      case "DIVISION":
        return <Briefcase className="w-4 h-4" />;
      case "DEPARTMENT":
        return <Users className="w-4 h-4" />;
      case "EMPLOYEE":
        return <User className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "CORPORATE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "DIVISION":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "DEPARTMENT":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "EMPLOYEE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300";
    }
  };

  const renderKpiNode = (kpi: any, level: number = 0, isLast: boolean = true) => {
    const children = getKpiChildren(kpi.kpiId);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(kpi.kpiId);
    const progress = calculateProgress(kpi);
    const indentClass = level > 0 ? `ml-${level * 8}` : "";

    return (
      <div key={kpi.kpiId} className="relative">
        {/* Tree line connector */}
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" 
               style={{ left: `${(level - 1) * 2}rem` }} />
        )}

        {/* KPI Card */}
        <div
          className={`mb-3 ${level > 0 ? 'ml-8' : ''}`}
          style={{ marginLeft: level > 0 ? `${level * 2}rem` : 0 }}
        >
          <Card className="hover:shadow-md transition-all border-l-4" 
                style={{ borderLeftColor: getProgressColor(progress).replace('bg-', '#') }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Expand/Collapse Button */}
                {hasChildren && (
                  <button
                    onClick={() => toggleNode(kpi.kpiId)}
                    className="flex-shrink-0 mt-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-7" />}

                {/* KPI Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`${getLevelColor(kpi.objective?.level)} flex items-center gap-1`}
                        >
                          {getLevelIcon(kpi.objective?.level)}
                          {kpi.objective?.level || "N/A"}
                        </Badge>
                        {hasChildren && (
                          <Badge variant="secondary" className="text-xs">
                            {children.length} {children.length === 1 ? "child" : "children"}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {kpi.name}
                      </h4>
                      {kpi.objective?.title && (
                        <p className="text-xs text-muted-foreground">
                          Objective: {kpi.objective.title}
                        </p>
                      )}
                    </div>

                    {/* Progress Score */}
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${getProgressTextColor(progress)}`}>
                        {progress.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <Progress
                      value={progress}
                      className="h-2"
                    />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Baseline</div>
                      <div className="font-semibold">
                        {kpi.baselineValue || 0} {kpi.measurementUnit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Target</div>
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {kpi.targetValue || 0} {kpi.measurementUnit}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Achieved</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {kpi.latestUpdate?.achievedValue || 0} {kpi.measurementUnit}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  {kpi.objective && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-xs text-muted-foreground">
                        {kpi.objective.assignedTo?.length > 0 ? (
                          <span>
                            Assigned to: {kpi.objective.assignedTo.map((a: any) => a.name || a.fullName).join(", ")}
                          </span>
                        ) : (
                          <span>No assignments</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-0">
            {children.map((child: any, index: number) =>
              renderKpiNode(child, level + 1, index === children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            KPI Cascade View
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View how KPIs cascade through the organizational hierarchy
          </p>
        </div>
        <TrendingUp className="w-8 h-8 text-primary" />
      </div>

      {/* Root KPI Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Root KPI</CardTitle>
          <CardDescription>
            Choose a corporate-level KPI to view its cascade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedRootKpi} onValueChange={setSelectedRootKpi}>
            <SelectTrigger>
              <SelectValue placeholder="Select a root KPI..." />
            </SelectTrigger>
            <SelectContent>
              {rootKpis.map((kpi: any) => (
                <SelectItem key={kpi.kpiId} value={kpi.kpiId}>
                  {kpi.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cascade Tree */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading KPI cascade...</p>
        </div>
      )}

      {!loading && selectedKpi && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Target className="w-4 h-4" />
            <span>
              Click on <ChevronRight className="w-4 h-4 inline" /> to expand and see
              cascaded KPIs
            </span>
          </div>
          {renderKpiNode(selectedKpi, 0, true)}
        </div>
      )}

      {!loading && !selectedKpi && selectedRootKpi && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">KPI not found</p>
          </CardContent>
        </Card>
      )}

      {!selectedRootKpi && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Select a root KPI above to view its cascade hierarchy
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
