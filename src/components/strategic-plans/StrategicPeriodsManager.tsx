"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Trash2, Edit2, Clock, CheckCircle2, XCircle, Archive } from "lucide-react";
import { useStrategicPeriods, useStrategicPeriodMutations } from "@/hooks/strategic-periods/useStrategicPeriods";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import type { StrategicPeriod } from "@/types/graphql";

interface StrategicPeriodsManagerProps {
  strategicPlanId: string;
  organizationId: string;
}

export default function StrategicPeriodsManager({
  strategicPlanId,
  organizationId,
}: StrategicPeriodsManagerProps) {
  const { strategicPeriods, loading, refetch } = useStrategicPeriods(1, 100, strategicPlanId, organizationId);
  const { createStrategicPeriod, updateStrategicPeriod, removeStrategicPeriod } = useStrategicPeriodMutations();
  const canManagePeriods = useAuthStore(
    (state) => state.user?.role === "SUPER_ADMIN",
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<StrategicPeriod | null>(null);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    periodType: "ANNUAL" as string,
  });

  const resetForm = () => {
    setForm({
      name: "",
      startDate: "",
      endDate: "",
      periodType: "ANNUAL",
    });
  };

  const handleCreate = async () => {
    if (!canManagePeriods) return;

    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createStrategicPeriod({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        periodType: form.periodType,
        strategicPlanId,
        organizationId,
      });
      setCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error creating strategic period:", error);
    }
  };

  const handleEdit = async () => {
    if (!canManagePeriods || !selectedPeriod) return;

    try {
      await updateStrategicPeriod({
        strategicPeriodId: selectedPeriod.strategicPeriodId,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        periodType: form.periodType,
      });
      setEditOpen(false);
      setSelectedPeriod(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error updating strategic period:", error);
    }
  };

  const handleDelete = async (periodId: string, periodName: string) => {
    if (!canManagePeriods) return;

    const toastId = toast(`Delete "${periodName}"?`, {
      description: "This action cannot be undone.",
      position: "top-center",
      duration: 10000,
      action: {
        label: "Delete",
        onClick: async () => {
          toast.dismiss(toastId);
          await removeStrategicPeriod(periodId);
          refetch();
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  const handleUpdateStatus = async (periodId: string, newStatus: string) => {
    if (!canManagePeriods) return;

    try {
      await updateStrategicPeriod({
        strategicPeriodId: periodId,
        status: newStatus,
        ...(newStatus === "ACTIVE" && { openedAt: new Date().toISOString() }),
        ...(newStatus === "ARCHIVED" && { closedAt: new Date().toISOString() }),
      });
      refetch();
    } catch (error) {
      console.error("Error updating period status:", error);
    }
  };

  const openEditDialog = (period: StrategicPeriod) => {
    if (!canManagePeriods) return;

    setSelectedPeriod(period);
    setForm({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      periodType: period.periodType ?? "ANNUAL",
    });
    setEditOpen(true);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "DRAFT":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "ARCHIVED":
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" /> Strategic Periods
          </h3>
          <p className="text-sm text-gray-500">Define time periods for this strategic plan</p>
        </div>
        {canManagePeriods && (
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Period
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading strategic periods...</div>
      ) : strategicPeriods.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No strategic periods defined yet</p>
            <p className="text-sm text-gray-500 mb-4">
              {canManagePeriods
                ? "Add periods to organize your strategic plan timeline"
                : "No periods are available for this strategic plan"}
            </p>
            {canManagePeriods && (
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Period
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategicPeriods.map((period: StrategicPeriod) => (
            <Card key={period.strategicPeriodId} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 w-1 h-full ${period.status === "ACTIVE" ? "bg-green-500" : period.status === "DRAFT" ? "bg-yellow-500" : "bg-gray-400"}`}></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {period.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(period.status)}>
                        {getStatusIcon(period.status)}
                        <span className="ml-1">{period.status}</span>
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {period.periodType}
                      </Badge>
                    </div>
                  </div>
                  {canManagePeriods && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-blue-500"
                        onClick={() => openEditDialog(period)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(period.strategicPeriodId, period.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                  </span>
                </div>

                {period.createdBy && (
                  <div className="text-xs text-gray-500">
                    Created by {period.createdBy.fullName}
                  </div>
                )}

                {/* Status Actions */}
                {canManagePeriods && (
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {period.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                      onClick={() => handleUpdateStatus(period.strategicPeriodId, "ACTIVE")}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  )}
                  {period.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                      onClick={() => handleUpdateStatus(period.strategicPeriodId, "ARCHIVED")}
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                  )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={canManagePeriods && createOpen}
        onOpenChange={setCreateOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Strategic Period</DialogTitle>
            <DialogDescription>
              Define a new time period for this strategic plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Period Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. FY 2026, Q1 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodType">
                Period Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.periodType}
                onValueChange={(value) => setForm({ ...form, periodType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={canManagePeriods && editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Strategic Period</DialogTitle>
            <DialogDescription>
              Update the strategic period details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Period Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-periodType">
                Period Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.periodType}
                onValueChange={(value) => setForm({ ...form, periodType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditOpen(false);
              setSelectedPeriod(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!form.name || !form.startDate || !form.endDate}
            >
              Update Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
