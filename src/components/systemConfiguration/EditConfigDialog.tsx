"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { SystemConfiguration } from "@/hooks/systemConfiguration/useSystemConfiguration";

interface EditConfigDialogProps {
  config: SystemConfiguration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: {
    systemConfigurationId: string;
    configKey?: string;
    configValue?: string;
    description?: string;
    isActive?: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export default function EditConfigDialog({
  config,
  open,
  onOpenChange,
  onUpdate,
  loading = false,
}: EditConfigDialogProps) {
  const [configKey, setConfigKey] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (config) {
      const cfg = config as any;
      setConfigKey(cfg.configKey);
      setConfigValue(cfg.configValue);
      setDescription(cfg.description || "");
      setIsActive(cfg.isActive);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config || !configKey.trim() || !configValue.trim()) {
      return;
    }

    await onUpdate({
      systemConfigurationId: config.systemConfigurationId,
      configKey: configKey.trim(),
      configValue: configValue.trim(),
      description: description.trim() || undefined,
      isActive,
    });

    onOpenChange(false);
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit System Configuration</DialogTitle>
            <DialogDescription>
              Update the configuration settings for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-configKey">
                Configuration Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-configKey"
                placeholder="e.g., email.smtp.host"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-configValue">
                Configuration Value <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-configValue"
                placeholder="Enter configuration value"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this configuration does"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Active</Label>
              <Switch
                id="edit-isActive"
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !configKey.trim() || !configValue.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Configuration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
