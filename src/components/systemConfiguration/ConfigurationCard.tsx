"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

interface ConfigurationCardProps {
  title: string;
  description: string;
  configKey: string;
  currentValue?: string;
  isActive?: boolean;
  onSave: (configKey: string, configValue: string, isActive: boolean) => Promise<void>;
  loading?: boolean;
  type?: "text" | "textarea" | "number" | "email";
  placeholder?: string;
}

export default function ConfigurationCard({
  title,
  description,
  configKey,
  currentValue = "",
  isActive = true,
  onSave,
  loading = false,
  type = "text",
  placeholder,
}: ConfigurationCardProps) {
  const [value, setValue] = useState(currentValue);
  const [active, setActive] = useState(isActive);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setValue(currentValue);
    setActive(isActive);
  }, [currentValue, isActive]);

  useEffect(() => {
    setHasChanges(value !== currentValue || active !== isActive);
  }, [value, active, currentValue, isActive]);

  const handleSave = async () => {
    await onSave(configKey, value, active);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${configKey}`} className="text-sm text-gray-600">
              {active ? "Active" : "Inactive"}
            </Label>
            <Switch
              id={`active-${configKey}`}
              checked={active}
              onCheckedChange={setActive}
              disabled={loading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={configKey} className="text-sm font-medium">
              Configuration Value
            </Label>
            {type === "textarea" ? (
              <Textarea
                id={configKey}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder || `Enter ${title.toLowerCase()}`}
                disabled={loading}
                className="mt-1.5"
                rows={4}
              />
            ) : (
              <Input
                id={configKey}
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder || `Enter ${title.toLowerCase()}`}
                disabled={loading}
                className="mt-1.5"
              />
            )}
          </div>
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
