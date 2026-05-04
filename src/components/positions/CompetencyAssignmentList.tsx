"use client";

import { useState } from "react";
import {
  type CompetencyPositionAssignment,
  usePositionMutations,
} from "@/hooks/positions/usePositions";
import { useQuery } from "@apollo/client";
import { GET_COMPETENCIES } from "@/lib/graphql/queries/competencies";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Loader2,
  Trash2,
  Shield,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

interface CompetencyAssignmentListProps {
  assignments: CompetencyPositionAssignment[];
  positionId: string;
  loading: boolean;
}

interface Competency {
  competencyId: string;
  name: string;
  description?: string;
  coreCompetency?: {
    coreCompetencyId: string;
    name: string;
  };
}

export default function CompetencyAssignmentList({
  assignments,
  positionId,
  loading,
}: CompetencyAssignmentListProps) {
  const { assignCompetency, updateAssignment, removeAssignment, loading: mutLoading } =
    usePositionMutations();

  const [showAssign, setShowAssign] = useState(false);
  const [deleteAssignment, setDeleteAssignment] = useState<CompetencyPositionAssignment | null>(null);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);

  // Fetch all competencies for the dropdown
  const { data: compData, loading: compLoading } = useQuery(GET_COMPETENCIES, {
    variables: { page: 1, limit: 200 },
    fetchPolicy: "cache-and-network",
  });

  const allCompetencies = (compData?.competencies?.items || []) as Competency[];

  // Filter out already-assigned competencies
  const assignedIds = new Set(assignments.map((a) => a.competency.competencyId));
  const availableCompetencies = allCompetencies.filter(
    (c) => !assignedIds.has(c.competencyId)
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetencyId) return;
    try {
      await assignCompetency({
        positionId,
        competencyId: selectedCompetencyId,
        isMandatory,
      });
      setSelectedCompetencyId("");
      setIsMandatory(false);
      setShowAssign(false);
    } catch { /* handled */ }
  };

  const handleToggleMandatory = async (assignment: CompetencyPositionAssignment) => {
    try {
      await updateAssignment({
        competencyPositionAssignmentId: assignment.competencyPositionAssignmentId,
        isMandatory: !assignment.isMandatory,
      });
    } catch { /* handled */ }
  };

  const handleRemove = async () => {
    if (!deleteAssignment) return;
    try {
      await removeAssignment(deleteAssignment.competencyPositionAssignmentId, positionId);
      setDeleteAssignment(null);
    } catch { /* handled */ }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Required Competencies ({assignments.length})
        </h3>
        <Button size="sm" onClick={() => setShowAssign(true)} disabled={availableCompetencies.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" /> Assign Competency
        </Button>
      </div>

      {!assignments.length ? (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No competencies assigned yet. Assign competencies that are required for this position.
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowAssign(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Assign First Competency
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                <TableHead className="font-semibold">Competency</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Mandatory</TableHead>
                <TableHead className="font-semibold">Added By</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.competencyPositionAssignmentId} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        {assignment.isMandatory ? (
                          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {assignment.competency.name}
                        </p>
                        {assignment.competency.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {assignment.competency.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.competency.coreCompetency ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.competency.coreCompetency.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleMandatory(assignment)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                        assignment.isMandatory
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
                      }`}
                      disabled={mutLoading.updateAssignment}
                    >
                      {assignment.isMandatory ? "Required" : "Optional"}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {assignment.createdBy?.fullName || "System"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteAssignment(assignment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Assign Competency Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Competency</DialogTitle>
            <DialogDescription>
              Select a competency to assign to this position.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Competency *</Label>
              <Select value={selectedCompetencyId} onValueChange={setSelectedCompetencyId}>
                <SelectTrigger>
                  <SelectValue placeholder={compLoading ? "Loading..." : "Select a competency"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCompetencies.map((comp) => (
                    <SelectItem key={comp.competencyId} value={comp.competencyId}>
                      <div className="flex flex-col">
                        <span>{comp.name}</span>
                        {comp.coreCompetency && (
                          <span className="text-xs text-gray-400">{comp.coreCompetency.name}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="mandatory"
                checked={isMandatory}
                onCheckedChange={(v) => setIsMandatory(!!v)}
              />
              <Label htmlFor="mandatory" className="text-sm cursor-pointer">
                Mark as mandatory for this position
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAssign(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutLoading.assign || !selectedCompetencyId}>
                {mutLoading.assign && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Competency
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog */}
      <AlertDialog open={!!deleteAssignment} onOpenChange={(open) => !open && setDeleteAssignment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Competency</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>&quot;{deleteAssignment?.competency.name}&quot;</strong> from this position?
              This won&apos;t delete the competency itself, only the assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700 text-white" disabled={mutLoading.removeAssignment}>
              {mutLoading.removeAssignment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
