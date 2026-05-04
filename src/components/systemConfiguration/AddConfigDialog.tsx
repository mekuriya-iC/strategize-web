"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";

interface AddConfigDialogProps {
  onAdd: (data: {
    configKey: string;
    configValue: string;
    description?: string;
    isActive: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export default function AddConfigDialog({ onAdd, loading = false }: AddConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [configKey, setConfigKey] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!configKey.trim() || !configValue.trim()) {
      return;
    }

    await onAdd({
      configKey: configKey.trim(),
      configValue: configValue.trim(),
      description: description.trim() || undefined,
      isActive,
    });

    // Reset form
    setConfigKey("");
    setConfigValue("");
    setDescription("");
    setIsActive(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add System Configuration</DialogTitle>
            <DialogDescription>
              Create a new system configuration setting for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="configKey">
                Configuration Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="configKey"
                placeholder="e.g., email.smtp.host"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Use dot notation for hierarchical keys (e.g., email.smtp.host)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="configValue">
                Configuration Value <span className="text-red-500">*</span>
              </Label>
              <Input
                id="configValue"
                placeholder="Enter configuration value"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this configuration does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !configKey.trim() || !configValue.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Configuration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
