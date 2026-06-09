"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GET_PERFORMANCE_WEIGHT_CONFIGS } from "@/lib/graphql/queries/unified-performance";
import {
  CREATE_PERFORMANCE_WEIGHT_CONFIG,
  UPDATE_PERFORMANCE_WEIGHT_CONFIG,
  DELETE_PERFORMANCE_WEIGHT_CONFIG,
} from "@/lib/graphql/mutations/performance-weights";
import { GET_STRATEGIC_PERIODS } from "@/lib/graphql/queries/strategicPeriods";
import { Plus, Edit, Trash2, Settings, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";

interface WeightConfigManagerProps {
  organizationId: string;
}

export default function WeightConfigManager({ organizationId }: WeightConfigManagerProps) {
  const user = useAuthStore((state) => state.user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  // Fetch weight configs
  const { data, loading, refetch } = useQuery(GET_PERFORMANCE_WEIGHT_CONFIGS, {
    variables: { organizationId },
    skip: !organizationId,
  });

  // Fetch strategic periods
  const { data: periodsData } = useQuery(GET_STRATEGIC_PERIODS, {
    variables: { page: 1, limit: 50 },
  });

  const configs = data?.performanceWeightConfigs || [];
  const periods = periodsData?.strategicPeriods?.items || [];

  const [createConfig] = useMutation(CREATE_PERFORMANCE_WEIGHT_CONFIG, {
    onCompleted: () => {
      toast.success("Weight configuration created successfully");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create configuration: ${error.message}`);
    },
  });

  const [updateConfig] = useMutation(UPDATE_PERFORMANCE_WEIGHT_CONFIG, {
    onCompleted: () => {
      toast.success("Weight configuration updated successfully");
      setIsEditOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });

  const [deleteConfig] = useMutation(DELETE_PERFORMANCE_WEIGHT_CONFIG, {
    onCompleted: () => {
      toast.success("Weight configuration deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete configuration: ${error.message}`);
    },
  });

  const handleCreate = (formData: any) => {
    createConfig({
      variables: {
        input: {
          organizationId,
          ...formData,
        },
      },
    });
  };

  const handleUpdate = (formData: any) => {
    updateConfig({
      variables: {
        input: {
          unifiedPerformanceWeightConfigId: selectedConfig.unifiedPerformanceWeightConfigId,
          ...formData,
        },
      },
    });
  };

  const handleDelete = (configId: string) => {
    if (confirm("Are you sure you want to delete this weight configuration?")) {
      deleteConfig({ variables: { configId } });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Loading weight configurations...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Performance Weight Configuration
            </CardTitle>
            <CardDescription>
              Configure how performance components are weighted in the final score
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <WeightConfigForm
                periods={periods}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {configs.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No weight configurations found. Create one to customize performance scoring.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {configs.map((config: any) => (
              <div
                key={config.unifiedPerformanceWeightConfigId}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {config.strategicPeriodId
                        ? periods.find((p: any) => p.strategicPeriodId === config.strategicPeriodId)?.name || "Period Configuration"
                        : "Organization Default"}
                    </h3>
                    {config.isActive && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">KPI Scorecard:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {config.kpiWeight}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">360° Evaluation:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {config.competencyWeight}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Activity Metrics:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">
                        {config.activityWeight}%
                      </span>
                    </div>
                  </div>

                  {config.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.notes}</p>
                  )}

                  <p className="text-xs text-gray-500">
                    Created: {new Date(config.createdAt).toLocaleDateString()}
                    {config.updatedAt !== config.createdAt && ` • Updated: ${new Date(config.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(config);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config.unifiedPerformanceWeightConfigId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            {selectedConfig && (
              <WeightConfigForm
                periods={periods}
                initialData={selectedConfig}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

interface WeightConfigFormProps {
  periods: any[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function WeightConfigForm({ periods, initialData, onSubmit, onCancel }: WeightConfigFormProps) {
  const [kpiWeight, setKpiWeight] = useState(initialData?.kpiWeight || 70);
  const [competencyWeight, setCompetencyWeight] = useState(initialData?.competencyWeight || 25);
  const [activityWeight, setActivityWeight] = useState(initialData?.activityWeight || 5);
  const [periodId, setPeriodId] = useState(initialData?.strategicPeriodId || "default");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const totalWeight = kpiWeight + competencyWeight + activityWeight;
  const isValid = Math.abs(totalWeight - 100) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Weights must sum to exactly 100%");
      return;
    }

    onSubmit({
      strategicPeriodId: periodId === "default" ? null : periodId,
      kpiWeight: parseFloat(kpiWeight.toFixed(2)),
      competencyWeight: parseFloat(competencyWeight.toFixed(2)),
      activityWeight: parseFloat(activityWeight.toFixed(2)),
      isActive,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit" : "Create"} Weight Configuration</DialogTitle>
        <DialogDescription>
          Configure the weight percentages for each performance component. Total must equal 100%.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="period">Strategic Period</Label>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Organization Default</SelectItem>
              {periods.map((period: any) => (
                <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Default applies to all periods without specific configuration
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kpiWeight">KPI Scorecard Weight (%)</Label>
          <Input
            id="kpiWeight"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={kpiWeight}
            onChange={(e) => setKpiWeight(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="competencyWeight">360° Evaluation Weight (%)</Label>
          <Input
            id="competencyWeight"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={competencyWeight}
            onChange={(e) => setCompetencyWeight(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activityWeight">Activity Metrics Weight (%)</Label>
          <Input
            id="activityWeight"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={activityWeight}
            onChange={(e) => setActivityWeight(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className={`p-3 rounded-lg ${isValid ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total Weight:</span>
            <span className={isValid ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
              {totalWeight.toFixed(2)}%
            </span>
          </div>
          {!isValid && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Must equal 100% (currently {totalWeight > 100 ? "over" : "under"} by {Math.abs(totalWeight - 100).toFixed(2)}%)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this configuration..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid}>
          {initialData ? "Update" : "Create"} Configuration
        </Button>
      </DialogFooter>
    </form>
  );
}
