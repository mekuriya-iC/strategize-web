"use client";

import { useState } from "react";
import {
  useSharedKpiParticipants,
  useSharedKpiMutations,
  type SharedKpiParticipant,
} from "@/hooks/sharedKpis/useSharedKpis";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users, Loader2, UserPlus } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface SharedKpiParticipantsProps {
  kpiId: string;
  strategicPeriodId: string;
}

export default function SharedKpiParticipants({
  kpiId,
  strategicPeriodId,
}: SharedKpiParticipantsProps) {
  const { participants, loading, refetch } = useSharedKpiParticipants({
    kpiId,
    strategicPeriodId,
    limit: 100,
  });

  const { createParticipant, removeParticipant, loading: mutLoading } =
    useSharedKpiMutations();

  const [showAdd, setShowAdd] = useState(false);
  const [deleteParticipant, setDeleteParticipant] = useState<SharedKpiParticipant | null>(
    null
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [contributionWeight, setContributionWeight] = useState("100");

  // Fetch employees for dropdown
  const { data: empsData, loading: empsLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 200 },
  });
  const allEmployees = empsData?.employees?.items || [];

  // Filter out already-added participants
  const participantIds = new Set(participants.map((p) => p.participant.employeeId));
  const availableEmployees = allEmployees.filter(
    (emp: any) => !participantIds.has(emp.employeeId)
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    try {
      await createParticipant({
        kpiId,
        participantUserId: selectedEmployeeId,
        strategicPeriodId,
        contributionWeight: parseFloat(contributionWeight) || undefined,
      });
      setSelectedEmployeeId("");
      setContributionWeight("100");
      setShowAdd(false);
      refetch();
    } catch {
      /* handled */
    }
  };

  const handleRemove = async () => {
    if (!deleteParticipant) return;
    try {
      await removeParticipant(deleteParticipant.sharedKpiParticipantId);
      setDeleteParticipant(null);
      refetch();
    } catch {
      /* handled */
    }
  };

  const totalWeight = participants.reduce(
    (sum, p) => sum + (p.contributionWeight || 0),
    0
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shared KPI Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shared KPI Participants ({participants.length})</CardTitle>
              <CardDescription>
                Employees contributing to this shared KPI
                {totalWeight > 0 && ` • Total weight: ${totalWeight.toFixed(0)}%`}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Participant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No participants yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add employees to share responsibility for this KPI
              </p>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Add First Participant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.sharedKpiParticipantId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  <UserAvatar
                    user={{
                      fullName: participant.participant.fullName,
                      picture: participant.participant.picture,
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {participant.participant.fullName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {participant.participant.title && (
                        <span>{participant.participant.title}</span>
                      )}
                      {participant.participant.department && (
                        <>
                          <span>•</span>
                          <span>{participant.participant.department.name}</span>
                        </>
                      )}
                      {participant.contributionWeight && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {participant.contributionWeight.toFixed(0)}% weight
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteParticipant(participant)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Add an employee to share responsibility for this KPI
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={empsLoading ? "Loading..." : "Select an employee"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((emp: any) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      <div className="flex flex-col">
                        <span>{emp.fullName}</span>
                        {emp.title && (
                          <span className="text-xs text-gray-400">{emp.title}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableEmployees.length === 0 && !empsLoading && (
                <p className="text-xs text-gray-500">
                  All employees have been added as participants
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Contribution Weight (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={contributionWeight}
                onChange={(e) => setContributionWeight(e.target.value)}
                placeholder="e.g. 50"
              />
              <p className="text-xs text-gray-500">
                Optional: Percentage of responsibility for this KPI (0-100)
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutLoading.create || !selectedEmployeeId}
              >
                {mutLoading.create && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Participant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteParticipant}
        onOpenChange={(open) => !open && setDeleteParticipant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>&quot;{deleteParticipant?.participant.fullName}&quot;</strong> from
              this shared KPI? They will no longer be responsible for contributing to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={mutLoading.remove}
            >
              {mutLoading.remove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
