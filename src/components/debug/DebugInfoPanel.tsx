"use client";

import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { ChevronDown, ChevronUp, Bug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnnualTimeline } from "@/stores/strategicPeriodStore";

import { getAccessToken } from "@/lib/auth-utils";
import { usePathname } from "next/navigation";

// !!! DEBUG COMPONENT - MUST BE REMOVED BEFORE PRODUCTION !!!
// This component provides transparency into the assignment and objective/KPI relationships.

const DEBUG_QUERY = gql`
  query DebugData {
    objectives(page: 1, limit: 1000) {
      items {
        objectiveId
        title
        type
        status
        assigneeId
        assigneeType
        parent {
          objectiveId
          title
        }
        strategicPeriod {
          strategicPeriodId
        }
        kpis {
          kpiId
          name
          status
          targets {
              timeline
          }
          parent {
            kpiId
            name
          }
        }
      }
    }
  }
`;

export default function DebugInfoPanel() {
    const [isMounted, setIsMounted] = React.useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timeline = useAnnualTimeline();
    const pathname = usePathname();
    const token = getAccessToken();

    const { data, loading, refetch, error } = useQuery(DEBUG_QUERY, {
        fetchPolicy: "network-only",
        skip: !token || pathname === "/auth",
    });

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg p-3"
                title="Open Debug Panel"
                suppressHydrationWarning
            >
                <Bug className="h-6 w-6" />
            </Button>
        );
    }

    // Filter objectives by timeline
    const allObjectives = data?.objectives?.items || [];
    const objectives = allObjectives.filter((obj: any) => {
        // If no timeline selected, show all (fallback) or none? User said "in that strategice time only"
        if (!timeline) return true;

        // Check if any KPI in this objective has a target in this timeline
        // Or if the objective itself is linked via strategicPeriod? 
        // Usually objectives are linked to a period.
        // Let's check for any KPI target matching timeline as a proxy if objective doesn't have it directly.
        // Actually, the Store has annualTimeline like "2025/26".

        return obj.kpis?.some((kpi: any) =>
            kpi.targets?.some((t: any) => t.timeline === timeline || t.timeline.startsWith(`${timeline}-`))
        );
    });

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-2/3 h-[60vh] z-50 bg-background border-t-4 border-red-500 shadow-2xl overflow-hidden flex flex-col transition-transform">
            <div className="bg-red-50 p-3 flex justify-between items-center border-b">
                <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-700">DEBUG PANEL: Assignment & Approval State</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">DEV ONLY</Badge>
                    {timeline && <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-2">Timeline: {timeline}</Badge>}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50">
                {error && <div className="text-red-500 mb-4">Error loading debug data: {error.message}</div>}

                <div className="grid gap-4">
                    {objectives.map((obj: any) => (
                        <Card key={obj.objectiveId} className="border-l-4 border-l-blue-500">
                            <CardHeader className="py-3 px-4 bg-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            {obj.name}
                                            <Badge variant="secondary" className="text-[10px]">{obj.type}</Badge>
                                            <Badge className={`${obj.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} text-[10px]`}>{obj.status}</Badge>
                                        </CardTitle>
                                        <div className="text-xs text-gray-500 mt-1">ID: {obj.objectiveId}</div>
                                    </div>
                                    <div className="text-right text-xs">
                                        {obj.parent ? (
                                            <div className="text-purple-600">Parent: {obj.parent.name}</div>
                                        ) : (
                                            <div className="text-gray-400">Root Objective</div>
                                        )}
                                        {obj.assigneeId && (
                                            <div className="mt-1 font-mono">
                                                Assigned To: {obj.assigneeType} ({obj.assigneeId.substring(0, 8)}...)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="py-3 px-4 text-xs border-t">
                                <div className="font-semibold mb-2 text-gray-700">Associated KPIs ({obj.kpis?.length || 0}):</div>
                                {obj.kpis && obj.kpis.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {obj.kpis.map((kpi: any) => (
                                            <div key={kpi.kpiId} className="bg-white p-2 border rounded flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{kpi.name}</div>
                                                    <div className="text-[10px] text-gray-400">{kpi.kpiId}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="outline" className="text-[10px]">{kpi.status}</Badge>
                                                    {kpi.parent && (
                                                        <div className="text-[10px] text-purple-600" title={`Parent KPI: ${kpi.parent.name}`}>
                                                            Linked (Child)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic">No KPIs found.</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
