"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Plus, Edit, Calendar } from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  GET_SEMI_ANNUAL_PERIODS,
  GET_SEMI_ANNUAL_CONFIG,
  GET_SHARED_KPIS,
  CREATE_SEMI_ANNUAL_PERIOD,
  CREATE_OR_UPDATE_CONFIG,
  CREATE_SHARED_KPI,
  UPDATE_SHARED_KPI_SCORE,
} from "@/lib/graphql/queries/semiAnnualPerformance";
import { toast } from "sonner";

export default function SemiAnnualConfigPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [sharedKPIDialogOpen, setSharedKPIDialogOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<any>(null);

  // Form states
  const [ownPerformanceWeight, setOwnPerformanceWeight] = useState("70");
  const [kpiName, setKpiName] = useState("");
  const [kpiDescription, setKpiDescription] = useState("");
  const [achievementScore, setAchievementScore] = useState("0");

  const fullAccessRoles = ["SUPER_ADMIN", "ADMIN", "CEO"];
  const hasFullAccess = fullAccessRoles.includes(user?.role as string);

  // Fetch strategic periods
  const { data: periodsData } = useQuery(gql`
    query GetStrategicPeriods($organizationId: ID!) {
      strategicPeriods(organizationId: $organizationId) {
        items {
          strategicPeriodId
          name
          periodType
          startDate
          endDate
          status
        }
      }
    }
  `, {
    variables: { organizationId: user?.organizationId },
    skip: !user?.organizationId,
  });

  const periods = periodsData?.strategicPeriods?.items || [];

  // Fetch configuration
  const { data: configData, refetch: refetchConfig } = useQuery(
    GET_SEMI_ANNUAL_CONFIG,
    {
      variables: {
        semiAnnualPeriodId: selectedPeriodId,
        organizationId: user?.organizationId,
      },
      skip: !selectedPeriodId || !user?.organizationId,
    }
  );

  const config = configData?.semiAnnualPerformanceConfig;

  // Fetch shared KPIs
  const { data: kpisData, refetch: refetchKPIs } = useQuery(GET_SHARED_KPIS, {
    variables: {
      semiAnnualPeriodId: selectedPeriodId,
      organizationId: user?.organizationId,
    },
    skip: !selectedPeriodId || !user?.organizationId,
  });

  const sharedKPIs = kpisData?.sharedKPIs || [];

  // Mutations
  const [createOrUpdateConfig] = useMutation(CREATE_OR_UPDATE_CONFIG);
  const [createSharedKPI] = useMutation(CREATE_SHARED_KPI);
  const [updateSharedKPIScore] = useMutation(UPDATE_SHARED_KPI_SCORE);

  const handleSaveConfig = async () => {
    try {
      // First, ensure semi-annual period exists (auto-create from strategic period)
      const strategicPeriod = periods.find((p: any) => p.strategicPeriodId === selectedPeriodId);
      
      if (!strategicPeriod) {
        toast.error("Strategic period not found");
        return;
      }

      // Create semi-annual period if it doesn't exist (idempotent)
      // The backend will handle this - just use strategic period ID
      await createOrUpdateConfig({
        variables: {
          input: {
            semiAnnualPeriodId: selectedPeriodId, // Use strategic period ID directly
            organizationId: user?.organizationId,
            ownPerformanceWeight: parseFloat(ownPerformanceWeight),
            createdBy: user?.employeeId,
          },
        },
      });

      await refetchConfig();
      setConfigDialogOpen(false);
      toast.success("Configuration saved successfully");
    } catch (error: any) {
      toast.error("Failed to save configuration", {
        description: error.message,
      });
    }
  };

  const handleSaveSharedKPI = async () => {
    try {
      if (editingKPI) {
        // Update existing
        await updateSharedKPIScore({
          variables: {
            sharedKpiId: editingKPI.sharedKpiId,
            achievementScore: parseFloat(achievementScore),
          },
        });
        toast.success("Shared KPI updated successfully");
      } else {
        // Create new
        await createSharedKPI({
          variables: {
            input: {
              name: kpiName,
              description: kpiDescription,
              achievementScore: parseFloat(achievementScore),
              semiAnnualPeriodId: selectedPeriodId,
              organizationId: user?.organizationId,
            },
          },
        });
        toast.success("Shared KPI created successfully");
      }

      await refetchKPIs();
      setSharedKPIDialogOpen(false);
      resetKPIForm();
    } catch (error: any) {
      toast.error("Failed to save shared KPI", {
        description: error.message,
      });
    }
  };

  const resetKPIForm = () => {
    setKpiName("");
    setKpiDescription("");
    setAchievementScore("0");
    setEditingKPI(null);
  };

  const openEditKPI = (kpi: any) => {
    setEditingKPI(kpi);
    setKpiName(kpi.name);
    setKpiDescription(kpi.description || "");
    setAchievementScore(kpi.achievementScore.toString());
    setSharedKPIDialogOpen(true);
  };

  if (!hasFullAccess) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You do not have permission to configure semi-annual performance settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Semi-Annual Performance Configuration
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure weight distribution and shared KPIs
        </p>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Strategic Period
          </CardTitle>
          <CardDescription>
            Select the strategic period to configure semi-annual performance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select strategic period" />
            </SelectTrigger>
            <SelectContent>
              {periods.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No strategic periods found. Please create one first.
                </div>
              ) : (
                periods.map((period: any) => (
                  <SelectItem key={period.strategicPeriodId} value={period.strategicPeriodId}>
                    {period.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPeriodId && (
        <>
          {/* Weight Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Performance Weight Configuration
                  </CardTitle>
                  <CardDescription>
                    Set the weight distribution between own and shared performance
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setOwnPerformanceWeight(config?.ownPerformanceWeight?.toString() || "70");
                  setConfigDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {config ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Own Performance Weight</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {config.ownPerformanceWeight}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Shared Performance Weight</p>
                    <p className="text-3xl font-bold text-green-600">
                      {config.sharedPerformanceWeight}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No configuration set. Click Configure to set up weight distribution.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shared KPIs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shared KPIs</CardTitle>
                  <CardDescription>
                    Manage shared KPIs that can be assigned to employees
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  resetKPIForm();
                  setSharedKPIDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shared KPI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sharedKPIs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No shared KPIs created yet. Click "Add Shared KPI" to create one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Achievement Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedKPIs.map((kpi: any) => (
                      <TableRow key={kpi.sharedKpiId}>
                        <TableCell className="font-medium">{kpi.name}</TableCell>
                        <TableCell>{kpi.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            {kpi.achievementScore}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditKPI(kpi)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Performance Weights</DialogTitle>
            <DialogDescription>
              Set the weight distribution for own and shared performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ownWeight">Own Performance Weight (%)</Label>
              <Input
                id="ownWeight"
                type="number"
                min="0"
                max="100"
                value={ownPerformanceWeight}
                onChange={(e) => setOwnPerformanceWeight(e.target.value)}
              />
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Shared Performance Weight</p>
              <p className="text-2xl font-bold text-green-600">
                {100 - parseFloat(ownPerformanceWeight || "0")}%
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared KPI Dialog */}
      <Dialog open={sharedKPIDialogOpen} onOpenChange={setSharedKPIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKPI ? "Edit Shared KPI" : "Create Shared KPI"}
            </DialogTitle>
            <DialogDescription>
              {editingKPI
                ? "Update the shared KPI details and achievement score"
                : "Add a new shared KPI that can be assigned to employees"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kpiName">KPI Name *</Label>
              <Input
                id="kpiName"
                placeholder="e.g., OD, CMS, F&P"
                value={kpiName}
                onChange={(e) => setKpiName(e.target.value)}
                disabled={!!editingKPI}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kpiDesc">Description</Label>
              <Input
                id="kpiDesc"
                placeholder="Brief description of this shared KPI"
                value={kpiDescription}
                onChange={(e) => setKpiDescription(e.target.value)}
                disabled={!!editingKPI}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="achievementScore">Achievement Score (%) *</Label>
              <Input
                id="achievementScore"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={achievementScore}
                onChange={(e) => setAchievementScore(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSharedKPIDialogOpen(false);
                resetKPIForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSharedKPI}>
              {editingKPI ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
