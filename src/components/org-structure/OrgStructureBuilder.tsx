"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import OrgNode from "./OrgNode";
import AddNodeDialog from "./AddNodeDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

export default function OrgStructureBuilder({ topEntityName }: OrgStructureBuilderProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
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
      console.error("No parent selected");
      toast.error("No parent node selected");
      return;
    }

    // Adding node with parentId: ${selectedParentId}

    const colors = ["#8B5CF6", "#EC4899", "#F43F5E"];
    const newNode: OrgNodeData = {
      id: `node-${Date.now()}`,
      name,
      subtitle,
      color: colors[Math.floor(Math.random() * colors.length)],
      level: 1,
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

  const handleSave = () => {
    // Save the org structure
    sessionStorage.setItem("orgStructure", JSON.stringify(orgStructure));
    toast.success("Organization structure saved!");
    router.push("/strategy-period");
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
          onEdit={() => {
            // Edit functionality for node ${node.id}
          }}
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
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            Save
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
    </>
  );
}
