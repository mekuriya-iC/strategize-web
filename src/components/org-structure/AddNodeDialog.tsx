"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, subtitle: string) => void;
}

export default function AddNodeDialog({ isOpen, onClose, onAdd }: AddNodeDialogProps) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSubtitle("");
    } else {
      // Focus input after a small delay to avoid the React error
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), subtitle.trim());
    }
  };

  const handleClose = () => {
    setName("");
    setSubtitle("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#18181b] rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          type="button"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold mb-4 text-[#11181C] dark:text-gray-100">
          Add New Node
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nodeName" className="text-sm font-medium">
              Node Name
            </Label>
            <Input
              ref={inputRef}
              id="nodeName"
              type="text"
              placeholder="E.g: Division 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nodeSubtitle" className="text-sm font-medium">
              Subtitle (Optional)
            </Label>
            <Input
              id="nodeSubtitle"
              type="text"
              placeholder="E.g: Department"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Add Node
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
