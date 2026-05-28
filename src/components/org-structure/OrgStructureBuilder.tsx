"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import OrgNode from "./OrgNode";
import AddNodeDialog from "./AddNodeDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrgChartMutations } from "@/hooks/orgChart/useOrgChartMutations";
import type { OrgChartNodeInput } from "@/hooks/orgChart/useOrgChartMutations";

interface OrgNodeData {
  id: string;
  name: string;
  subtitle?: string;
  color: string;
  level: number;
  parentId?: string;
  children: OrgNodeData[];
}

interface OrgStructureBuilderProps {
  topEntityName: string;
}

/** Recursively map local OrgNodeData to the API input shape */
function toInput(node: OrgNodeData): OrgChartNodeInput {
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

export default function OrgStructureBuilder({ topEntityName }: OrgStructureBuilderProps) {
  const router = useRouter();
  const { saveOrgChart, loading: saving } = useOrgChartMutations();
  const [zoom, setZoom] = useState(100);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState<OrgNodeData | null>(null);
  
  const [orgStructure, setOrgStructure] = useState<OrgNodeData>({
    id: "root",
    name: topEntityName,
    subtitle: "CEO",
    color: "#5B5BF7",
    level: 0,
    children: [],
  });

  const handleAddChild = (parentId: string) => {
    setSelectedParentId(parentId);
    setShowAddDialog(true);
  };

  const handleAddNode = (name: string, subtitle: string) => {
    if (!selectedParentId) {
      toast.error("No parent node selected");
      return;
    }

    // Find the parent's level so we can set the child's level correctly
    const findLevel = (node: OrgNodeData): number => {
      if (node.id === selectedParentId) return node.level;
      for (const child of node.children) {
        const found = findLevel(child);
        if (found >= 0) return found;
      }
      return -1;
    };
    const parentLevel = findLevel(orgStructure);

    const colors = ["#8B5CF6", "#EC4899", "#F43F5E", "#EF4444"];
    const newNode: OrgNodeData = {
      id: `node-${Date.now()}`,
      name,
      subtitle,
      color: colors[Math.min(parentLevel, colors.length - 1)],
      level: parentLevel + 1,
      parentId: selectedParentId,
      children: [],
    };

    // Add node to structure
    const addNodeToTree = (node: OrgNodeData): OrgNodeData => {
      if (node.id === selectedParentId) {
        // Found parent, adding child
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
      return {
        ...node,
        children: node.children.map(addNodeToTree),
      };
    };

    const updatedStructure = addNodeToTree(orgStructure);
    // Structure updated successfully
    setOrgStructure(updatedStructure);
    
    // Close dialog and reset state FIRST
    setShowAddDialog(false);
    setSelectedParentId(null);
    
    // Show success toast after closing
    setTimeout(() => {
      toast.success("Node added successfully!");
    }, 100);
  };

  const handleDeleteNode = (nodeId: string) => {
    const deleteNodeFromTree = (node: OrgNodeData): OrgNodeData => {
      return {
        ...node,
        children: node.children
          .filter((child) => child.id !== nodeId)
          .map(deleteNodeFromTree),
      };
    };

    setOrgStructure(deleteNodeFromTree(orgStructure));
    toast.success("Node deleted");
  };

  const handleEditNode = (nodeId: string) => {
    // Find the node to edit
    const findNode = (node: OrgNodeData): OrgNodeData | null => {
      if (node.id === nodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    const nodeToEdit = findNode(orgStructure);
    if (nodeToEdit) {
      setSelectedNodeForEdit(nodeToEdit);
      setShowEditDialog(true);
    }
  };

  const handleUpdateNode = (name: string, subtitle: string) => {
    if (!selectedNodeForEdit) {
      toast.error("No node selected for editing");
      return;
    }

    // Update node in structure
    const updateNodeInTree = (node: OrgNodeData): OrgNodeData => {
      if (node.id === selectedNodeForEdit.id) {
        return {
          ...node,
          name,
          subtitle,
        };
      }
      return {
        ...node,
        children: node.children.map(updateNodeInTree),
      };
    };

    const updatedStructure = updateNodeInTree(orgStructure);
    setOrgStructure(updatedStructure);
    
    // Close dialog and reset state
    setShowEditDialog(false);
    setSelectedNodeForEdit(null);
    
    // Show success toast
    setTimeout(() => {
      toast.success("Node updated successfully!");
    }, 100);
  };

  const handleSave = async () => {
    try {
      console.log("🎯 Saving org structure from builder");
      await saveOrgChart([toInput(orgStructure)]);
      sessionStorage.setItem("orgStructure", JSON.stringify(orgStructure));
      console.log("✅ Org structure saved, navigating to /setup/strategic-plan");
      toast.success("Organization structure saved!");
      
      // Navigate to the setup wizard to create strategic plan, pillars, and periods
      window.location.href = "/setup/strategic-plan";
    } catch (error) {
      console.error("❌ Error saving org structure:", error);
      // error already toasted by the hook
    }
  };

  const renderNode = (node: OrgNodeData): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    
    return (
      <div key={node.id} className="flex flex-col items-center">
        <OrgNode
          id={node.id}
          name={node.name}
          subtitle={node.subtitle}
          color={node.color}
          level={node.level}
          onAddChild={() => handleAddChild(node.id)}
          onEdit={() => handleEditNode(node.id)}
          onDelete={node.level > 0 ? () => handleDeleteNode(node.id) : undefined}
        />
        
        {hasChildren && (
          <div className="flex flex-col items-center mt-4">
            {/* Vertical connector */}
            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Children container */}
            <div className="flex gap-12 relative">
              {/* Horizontal connector line */}
              {node.children.length > 1 && (
                <div 
                  className="absolute top-0 h-0.5 bg-gray-300 dark:bg-gray-600"
                  style={{
                    left: '50%',
                    right: '50%',
                    transform: 'translateX(-50%)',
                    width: `calc(100% - 96px)`,
                  }}
                />
              )}
              
              {node.children.map((child) => (
                <div key={child.id} className="relative">
                  {/* Vertical connector to child */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-0 w-0.5 h-0 bg-gray-300 dark:bg-gray-600" />
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-white dark:bg-[#18181b] rounded-lg shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                // Undo functionality
              }}
            >
              <Undo2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                // Redo functionality
              }}
            >
              <Redo2 size={16} />
            </Button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.min(zoom + 10, 150))}
            >
              <ZoomIn size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.max(zoom - 10, 50))}
            >
              <ZoomOut size={16} />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={() => setZoom(100)}
            >
              <Maximize2 size={16} />
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : "Save"}
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-12 bg-[#FAFAFA] dark:bg-[#09090b]">
          <div
            className="flex justify-center items-start min-h-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            {renderNode(orgStructure)}
          </div>
        </div>
      </div>

      <AddNodeDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedParentId(null);
        }}
        onAdd={(name, subtitle) => {
          handleAddNode(name, subtitle);
        }}
      />

      <AddNodeDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedNodeForEdit(null);
        }}
        onAdd={(name, subtitle) => {
          handleUpdateNode(name, subtitle);
        }}
        initialName={selectedNodeForEdit?.name}
        initialSubtitle={selectedNodeForEdit?.subtitle}
        title="Edit Node"
        submitLabel="Update"
      />
    </>
  );
}
