"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AddNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, subtitle: string) => void;
}

export default function AddNodeDialog({ isOpen, onClose, onAdd }: AddNodeDialogProps) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSubtitle("");
    } else {
      // Focus input after a small delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), subtitle.trim());
      // Reset form
      setName("");
      setSubtitle("");
    }
  };

  const handleClose = () => {
    setName("");
    setSubtitle("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
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
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-2">
            <label 
              htmlFor="nodeName" 
              className="text-sm font-medium text-[#11181C] dark:text-gray-100 block"
            >
              Node Name
            </label>
            <input
              ref={inputRef}
              id="nodeName"
              type="text"
              placeholder="E.g: Division 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#09090b] text-[#11181C] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label 
              htmlFor="nodeSubtitle" 
              className="text-sm font-medium text-[#11181C] dark:text-gray-100 block"
            >
              Subtitle (Optional)
            </label>
            <input
              id="nodeSubtitle"
              type="text"
              placeholder="E.g: Department"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#09090b] text-[#11181C] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-[#11181C] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
