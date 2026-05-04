"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Target,
  Building2,
  Users,
  User,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Objective {
  objectiveId: string;
  title: string;
  type: string;
  level: string;
  status: string;
  cascadeStatus?: string;
  assigneeType?: string;
  assigneeId?: string;
  weight?: number;
  order?: number;
  parent?: {
    objectiveId: string;
    title: string;
  };
  ownerUser?: {
    employeeId: string;
    fullName: string;
  };
  kpis?: Array<{
    kpiId: string;
    name: string;
    targetValue?: number;
    measurementUnit?: string;
  }>;
}

interface ObjectiveHierarchyViewProps {
  objectives: Objective[];
  strategicPeriodId?: string;
}

interface TreeNode extends Omit<Objective, 'level'> {
  children: TreeNode[];
  level: number;
}

export default function ObjectiveHierarchyView({
  objectives,
  strategicPeriodId,
}: ObjectiveHierarchyViewProps) {
  const router = useRouter();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = useMemo(() => {
    const objectiveMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    objectives.forEach((obj) => {
      objectiveMap.set(obj.objectiveId, {
        ...obj,
        children: [],
        level: 0,
      });
    });

    // Second pass: build parent-child relationships
    objectives.forEach((obj) => {
      const node = objectiveMap.get(obj.objectiveId)!;

      if (obj.parent?.objectiveId) {
        const parentNode = objectiveMap.get(obj.parent.objectiveId);
        if (parentNode) {
          parentNode.children.push(node);
          node.level = parentNode.level + 1;
        } else {
          // Parent not in current view, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent, this is a root node
        rootNodes.push(node);
      }
    });

    // Sort children by order
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => (a.order || 0) - (b.order || 0));
      node.children.forEach(sortChildren);
    };

    rootNodes.forEach(sortChildren);
    rootNodes.sort((a, b) => (a.order || 0) - (b.order || 0));

    return rootNodes;
  }, [objectives]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(objectives.map((o) => o.objectiveId));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "CORPORATE":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case "DIVISION":
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case "DEPARTMENT":
        return <Users className="w-4 h-4 text-green-600" />;
      case "PERSONNEL":
        return <User className="w-4 h-4 text-orange-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "NOT_SUBMITTED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCascadeStatusColor = (status?: string) => {
    switch (status) {
      case "FULLY_CASCADED":
        return "bg-green-50 text-green-700 border-green-200";
      case "PARTIALLY_CASCADED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "NOT_CASCADED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.objectiveId);
    const hasChildren = node.children.length > 0;
    const indentLevel = node.level;

    return (
      <div key={node.objectiveId} className="relative">
        {/* Connecting Lines */}
        {indentLevel > 0 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"
              style={{ left: `${(indentLevel - 1) * 32 + 16}px` }}
            />
            <div
              className="absolute top-6 w-4 h-px bg-gray-300"
              style={{ left: `${(indentLevel - 1) * 32 + 16}px` }}
            />
          </>
        )}

        {/* Node Content */}
        <div
          className="flex items-start gap-3 p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
          style={{ marginLeft: `${indentLevel * 32}px` }}
          onClick={() => router.push(`/dashboard/objectives/${node.objectiveId}`)}
        >
          {/* Expand/Collapse Button */}
          <div className="flex-shrink-0 pt-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.objectiveId);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>

          {/* Type Icon */}
          <div className="flex-shrink-0 pt-1">{getTypeIcon(node.type)}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                {node.title}
              </h4>
              <div className="flex gap-1 flex-shrink-0">
                <Badge variant="outline" className={getStatusColor(node.status)}>
                  {node.status.replace(/_/g, " ")}
                </Badge>
                {node.cascadeStatus && (
                  <Badge
                    variant="outline"
                    className={getCascadeStatusColor(node.cascadeStatus)}
                  >
                    {node.cascadeStatus.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {node.type}
              </span>

              {node.ownerUser && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {node.ownerUser.fullName}
                </span>
              )}

              {node.weight !== undefined && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Weight: {node.weight}%
                </span>
              )}

              {node.kpis && node.kpis.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {node.kpis.length} KPI{node.kpis.length !== 1 ? "s" : ""}
                </span>
              )}

              {hasChildren && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {node.children.length} child objective{node.children.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">{node.children.map(renderNode)}</div>
        )}
      </div>
    );
  };

  if (objectives.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No objectives found for this strategic period
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Objective Hierarchy
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={expandAll}>
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">{tree.map(renderNode)}</div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Legend
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Corporate</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Division</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span>Department</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span>Personnel</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
