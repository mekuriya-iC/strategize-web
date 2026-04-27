"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import StructureNode from "./StructureNode";
import AddNodeDialog from "./AddNodeDialog";
import { toast } from "sonner";

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
}

export default function StructureBuilder({ templateId }: StructureBuilderProps) {
  const [zoom, setZoom] = useState(100);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const [structure, setStructure] = useState<NodeData>({
    id: "root",
    name: "Corporate",
    subtitle: "CEO",
    color: "#5B5BF7",
    level: 0,
    children: [
      {
        id: "div1",
        name: "Division 1",
        subtitle: "Supervisor",
        color: "#8B5CF6",
        level: 1,
        parentId: "root",
        children: [
          {
            id: "dept1",
            name: "Department",
            subtitle: "Manager",
            color: "#EC4899",
            level: 2,
            parentId: "div1",
            children: [
              {
                id: "unit1",
                name: "Unit",
                subtitle: "Team Leader",
                color: "#F43F5E",
                level: 3,
                parentId: "dept1",
                children: [
                  {
                    id: "emp1",
                    name: "Employee",
                    subtitle: "",
                    color: "#EF4444",
                    level: 4,
                    parentId: "unit1",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "div2",
        name: "Division 2",
        subtitle: "Director",
        color: "#8B5CF6",
        level: 1,
        parentId: "root",
        children: [
          {
            id: "dept2",
            name: "Department",
            subtitle: "Manager",
            color: "#EC4899",
            level: 2,
            parentId: "div2",
            children: [],
          },
          {
            id: "dept3",
            name: "Department",
            subtitle: "Manager",
            color: "#EC4899",
            level: 2,
            parentId: "div2",
            children: [],
          },
          {
            id: "dept4",
            name: "Department",
            subtitle: "Manager",
            color: "#EC4899",
            level: 2,
            parentId: "div2",
            children: [],
          },
        ],
      },
      {
        id: "div3",
        name: "Division 3",
        subtitle: "",
        color: "#8B5CF6",
        level: 1,
        parentId: "root",
        children: [],
      },
    ],
  });

  const handleAddChild = useCallback((parentId: string) => {
    setSelectedParentId(parentId);
    setShowAddDialog(true);
  }, []);

  const handleAddNode = useCallback(
    (name: string, subtitle: string) => {
      if (!selectedParentId) {
        toast.error("No parent node selected");
        return;
      }

      const colors = ["#8B5CF6", "#EC4899", "#F43F5E", "#EF4444"];
      const newNode: NodeData = {
        id: `node-${Date.now()}`,
        name,
        subtitle,
        color: colors[Math.floor(Math.random() * colors.length)],
        level: 1,
        parentId: selectedParentId,
        children: [],
      };

      const addNodeToTree = (node: NodeData): NodeData => {
        if (node.id === selectedParentId) {
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

      setStructure(addNodeToTree(structure));
      setShowAddDialog(false);
      setSelectedParentId(null);

      setTimeout(() => {
        toast.success("Node added successfully!");
      }, 100);
    },
    [selectedParentId, structure]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const deleteNodeFromTree = (node: NodeData): NodeData => {
        return {
          ...node,
          children: node.children
            .filter((child) => child.id !== nodeId)
            .map(deleteNodeFromTree),
        };
      };

      setStructure(deleteNodeFromTree(structure));
      toast.success("Node deleted");
    },
    [structure]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      // Find and duplicate the node
      toast.success("Node duplicated");
    },
    []
  );

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowRoleDropdown(true);
  }, []);

  const renderNode = (node: NodeData): React.ReactNode => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <StructureNode
          id={node.id}
          name={node.name}
          subtitle={node.subtitle}
          color={node.color}
          level={node.level}
          isSelected={selectedNodeId === node.id}
          onAddChild={() => handleAddChild(node.id)}
          onEdit={() => handleSelectNode(node.id)}
          onDelete={node.level > 0 ? () => handleDeleteNode(node.id) : undefined}
          onDuplicate={() => handleDuplicateNode(node.id)}
        />

        {hasChildren && (
          <div className="flex flex-col items-center mt-6">
            {/* Vertical connector */}
            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>

            {/* Children container */}
            <div className="flex gap-16 relative">
              {/* Horizontal connector line */}
              {node.children.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-gray-300 dark:bg-gray-600"
                  style={{
                    left: "50%",
                    right: "50%",
                    transform: "translateX(-50%)",
                    width: `calc(100% - 128px)`,
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Undo2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Redo2 size={16} />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
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

          <Button className="bg-primary hover:bg-primary/90 text-white px-6 h-8 text-sm">
            Save
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-12 bg-gray-50 dark:bg-[#09090b]">
          <div
            className="flex justify-center items-start min-h-full"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
          >
            {renderNode(structure)}
          </div>
        </div>
      </div>

      {/* Role Dropdown Overlay */}
      {showRoleDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRoleDropdown(false)}
        />
      )}

      <AddNodeDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setSelectedParentId(null);
        }}
        onAdd={handleAddNode}
      />
    </>
  );
}
