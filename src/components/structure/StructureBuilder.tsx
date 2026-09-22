"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Save } from "lucide-react";
import StructureNode from "./StructureNode";
import AddNodeDialog from "./AddNodeDialog";
import { toast } from "sonner";
import type { OrgChartNode } from "@/hooks/orgChart/useOrgChart";
import { useOrgChartMutations } from "@/hooks/orgChart/useOrgChartMutations";
import type { OrgChartNodeInput } from "@/hooks/orgChart/useOrgChartMutations";

interface NodeData {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  level: number;
  parentId?: string;
  children: NodeData[];
}

interface StructureBuilderProps {
  templateId: string;
  liveData?: OrgChartNode | null;
  liveLoading?: boolean;
  canManage: boolean;
}

const LEVEL_COLORS = ["#5B5BF7", "#8B5CF6", "#EC4899", "#F43F5E", "#EF4444"];

function mapLiveNode(node: OrgChartNode): NodeData {
  return {
    id: node.id,
    name: node.name,
    subtitle: node.subtitle ?? undefined,
    color: node.color ?? LEVEL_COLORS[Math.min(node.level, LEVEL_COLORS.length - 1)],
    level: node.level,
    parentId: node.parentId ?? undefined,
    children: node.children.map(mapLiveNode),
  };
}

function toInput(node: NodeData): OrgChartNodeInput {
  return {
    id: node.id,
    name: node.name,
    subtitle: node.subtitle,
    color: node.color,
    level: node.level,
    parentId: node.parentId,
    children: node.children.map(toInput),
  };
}

const SAMPLE_STRUCTURE: NodeData = {
  id: "root", name: "Corporate", subtitle: "CEO", color: "#5B5BF7", level: 0,
  children: [
    {
      id: "div1", name: "Division 1", subtitle: "Supervisor", color: "#8B5CF6", level: 1, parentId: "root",
      children: [
        {
          id: "dept1", name: "Department", subtitle: "Manager", color: "#EC4899", level: 2, parentId: "div1",
          children: [
            {
              id: "unit1", name: "Unit", subtitle: "Team Leader", color: "#F43F5E", level: 3, parentId: "dept1",
              children: [{ id: "emp1", name: "Employee", subtitle: "", color: "#EF4444", level: 4, parentId: "unit1", children: [] }],
            },
          ],
        },
      ],
    },
    {
      id: "div2", name: "Division 2", subtitle: "Director", color: "#8B5CF6", level: 1, parentId: "root",
      children: [
        { id: "dept2", name: "Department", subtitle: "Manager", color: "#EC4899", level: 2, parentId: "div2", children: [] },
        { id: "dept3", name: "Department", subtitle: "Manager", color: "#EC4899", level: 2, parentId: "div2", children: [] },
      ],
    },
    { id: "div3", name: "Division 3", subtitle: "", color: "#8B5CF6", level: 1, parentId: "root", children: [] },
  ],
};

export default function StructureBuilder({ templateId, liveData, liveLoading, canManage }: StructureBuilderProps) {
  const [zoom, setZoom] = useState(100);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [structure, setStructure] = useState<NodeData>(SAMPLE_STRUCTURE);
  const [isDirty, setIsDirty] = useState(false);

  const { saveOrgChart, loading: saving } = useOrgChartMutations();

  // Start slightly zoomed out on narrow screens so the tree fits better
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) setZoom(70);
  }, []);

  // Sync live API data into local state
  useEffect(() => {
    if (liveData) {
      setStructure(mapLiveNode(liveData));
      setIsDirty(false);
    }
  }, [liveData]);

  const handleAddChild = useCallback((parentId: string) => {
    if (!canManage) return;
    setSelectedParentId(parentId);
    setShowAddDialog(true);
  }, [canManage]);

  const handleAddNode = useCallback(
    (name: string, subtitle: string) => {
      if (!canManage || !selectedParentId) return;

      const findLevel = (node: NodeData): number => {
        if (node.id === selectedParentId) return node.level;
        for (const child of node.children) {
          const found = findLevel(child);
          if (found >= 0) return found;
        }
        return -1;
      };
      const parentLevel = findLevel(structure);

      const newNode: NodeData = {
        id: `node-${Date.now()}`, name, subtitle,
        color: LEVEL_COLORS[Math.min(parentLevel + 1, LEVEL_COLORS.length - 1)],
        level: parentLevel + 1,
        parentId: selectedParentId, children: [],
      };
      const addToTree = (node: NodeData): NodeData =>
        node.id === selectedParentId
          ? { ...node, children: [...node.children, newNode] }
          : { ...node, children: node.children.map(addToTree) };
      setStructure(addToTree(structure));
      setIsDirty(true);
      setShowAddDialog(false);
      setSelectedParentId(null);
      toast.success("Node added — click Save to persist");
    },
    [canManage, selectedParentId, structure]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!canManage) return;
      const deleteFromTree = (node: NodeData): NodeData => ({
        ...node,
        children: node.children.filter((c) => c.id !== nodeId).map(deleteFromTree),
      });
      setStructure(deleteFromTree(structure));
      setIsDirty(true);
      toast.success("Node removed — click Save to persist");
    },
    [canManage, structure]
  );

  const handleSave = async () => {
    if (!canManage) return;

    try {
      await saveOrgChart([toInput(structure)]);
      setIsDirty(false);
      toast.success("Structure saved");
    } catch {
      // error already toasted by the hook
    }
  };

  const renderNode = (node: NodeData): React.ReactNode => (
    <div key={node.id} className="flex flex-col items-center">
      <StructureNode
        id={node.id}
        name={node.name}
        subtitle={node.subtitle}
        color={node.color}
        level={node.level}
        isSelected={canManage && selectedNodeId === node.id}
        onAddChild={canManage ? () => handleAddChild(node.id) : undefined}
        onEdit={canManage ? () => setSelectedNodeId(node.id) : undefined}
        onDelete={canManage && node.level > 0 ? () => handleDeleteNode(node.id) : undefined}
        onDuplicate={canManage ? () => toast.info("Duplicate coming soon") : undefined}
      />
      {node.children.length > 0 && (
        <div className="flex flex-col items-center mt-6">
          <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
          <div className="flex gap-6 sm:gap-16 relative">
            {node.children.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-gray-300 dark:bg-gray-600"
                style={{ left: "50%", transform: "translateX(-50%)", width: "calc(100% - 80px)" }}
              />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {renderNode(child)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/50 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {canManage && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 size={16} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 size={16} /></Button>
                <div className="mx-1 hidden h-6 w-px bg-gray-300 dark:bg-gray-600 sm:mx-2 sm:block" />
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(zoom + 10, 150))}><ZoomIn size={16} /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(zoom - 10, 50))}><ZoomOut size={16} /></Button>
            <span className="ml-1 text-xs text-gray-600 dark:text-gray-400 sm:ml-2 sm:text-sm">{zoom}%</span>
            <Button variant="ghost" size="icon" className="ml-1 h-8 w-8 sm:ml-2" onClick={() => setZoom(100)}><Maximize2 size={16} /></Button>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="hidden text-xs text-amber-500 dark:text-amber-400 sm:inline">Unsaved changes</span>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="h-8 gap-2 bg-primary px-3 text-sm text-white hover:bg-primary/90 sm:px-6"
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Canvas — pan/zoom friendly on touch devices */}
        <div className="flex-1 overflow-auto overscroll-contain bg-gray-50 p-4 [-webkit-overflow-scrolling:touch] dark:bg-[#09090b] sm:p-8 lg:p-12">
          {liveLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading structure...</span>
              </div>
            </div>
          ) : (
            <div
              className="flex min-h-full min-w-max items-start justify-center"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              {renderNode(structure)}
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <AddNodeDialog
          isOpen={showAddDialog}
          onClose={() => { setShowAddDialog(false); setSelectedParentId(null); }}
          onAdd={handleAddNode}
        />
      )}
    </>
  );
}
