"use client";

import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, Building2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CREATE_SUPPORT_OBJECTIVE_ASSIGNMENT } from "@/lib/graphql/mutations/supportRelationships";
import { GET_DEPARTMENTS } from "@/lib/graphql/queries/departments";
import { GET_DIVISIONS } from "@/lib/graphql/queries/divisions";
import type { Kpi, Objective } from "@/types/graphql";

type AssigneeType = "DIVISION" | "DEPARTMENT";

type AssigneePage = {
  items: Array<{ divisionId?: string; departmentId?: string; name: string }>;
  meta: { currentPage: number; totalPages: number; totalItems: number };
};

interface SupportAssignmentFormProps {
  objective: Objective;
  kpi: Kpi;
  onSuccess?: () => void;
  onClose: () => void;
}

const PAGE_LIMIT = 20;

export function SupportAssignmentForm({
  objective,
  kpi,
  onSuccess,
  onClose,
}: SupportAssignmentFormProps) {
  const [assigneeType, setAssigneeType] = React.useState<AssigneeType>("DIVISION");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [instruction, setInstruction] = React.useState("");
  const [expectedImpact, setExpectedImpact] = React.useState("");

  const queryOptions = {
    variables: { page, limit: PAGE_LIMIT },
    fetchPolicy: "cache-and-network" as const,
  };
  const { data: divisionsData, loading: divisionsLoading, error: divisionsError } = useQuery<{ divisions: AssigneePage }>(
    GET_DIVISIONS,
    { ...queryOptions, skip: assigneeType !== "DIVISION" },
  );
  const { data: departmentsData, loading: departmentsLoading, error: departmentsError } = useQuery<{ departments: AssigneePage }>(
    GET_DEPARTMENTS,
    { ...queryOptions, skip: assigneeType !== "DEPARTMENT" },
  );
  const [createSupportAssignment, { loading: isSubmitting }] = useMutation(
    CREATE_SUPPORT_OBJECTIVE_ASSIGNMENT,
  );

  const result = assigneeType === "DIVISION" ? divisionsData?.divisions : departmentsData?.departments;
  const loading = assigneeType === "DIVISION" ? divisionsLoading : departmentsLoading;
  const queryError = assigneeType === "DIVISION" ? divisionsError : departmentsError;
  const items = result?.items ?? [];
  const totalPages = result?.meta.totalPages ?? 1;

  const changeAssigneeType = (value: string) => {
    setAssigneeType(value as AssigneeType);
    setAssigneeId("");
    setPage(1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assigneeId) {
      toast.error(`Select a ${assigneeType.toLowerCase()} to continue`);
      return;
    }

    try {
      await createSupportAssignment({
        variables: {
          input: {
            parentObjectiveId: objective.objectiveId,
            assigneeType,
            assigneeId,
            title: title.trim() || undefined,
            description: description.trim() || undefined,
            sources: [
              {
                sourceCorporateKpiId: kpi.kpiId,
                instruction: instruction.trim() || undefined,
                expectedImpact: expectedImpact.trim() || undefined,
              },
            ],
          },
        },
      });
      toast.success("Support objective assigned successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to assign support objective", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This is a support relationship. No corporate target or weight is allocated. The assigned manager creates a local KPI later.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label>Assignee type</Label>
        <Tabs value={assigneeType} onValueChange={changeAssigneeType}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="DIVISION" className="gap-2">
              <Building2 className="h-4 w-4" /> Division
            </TabsTrigger>
            <TabsTrigger value="DEPARTMENT" className="gap-2">
              <Building2 className="h-4 w-4" /> Department
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Label htmlFor="support-assignee">Assign to one {assigneeType.toLowerCase()}</Label>
        <Select value={assigneeId} onValueChange={setAssigneeId} disabled={loading || Boolean(queryError)}>
          <SelectTrigger id="support-assignee">
            <SelectValue placeholder={loading ? "Loading options..." : `Select ${assigneeType.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => {
              const id = assigneeType === "DIVISION" ? item.divisionId : item.departmentId;
              return id ? <SelectItem key={id} value={id}>{item.name}</SelectItem> : null;
            })}
          </SelectContent>
        </Select>
        {queryError && <p className="text-sm text-destructive">Unable to load assignees. Please try again.</p>}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{result?.meta.totalItems ?? 0} available</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || loading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages || loading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Corporate KPI source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="font-medium">{kpi.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">Preselected and read-only</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="support-title">Support objective title (optional)</Label>
        <Input id="support-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Leave blank to use the default title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-description">Description (optional)</Label>
        <Textarea id="support-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the support objective" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-instruction">Instruction (optional)</Label>
        <Textarea id="support-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="Guidance for the assigned manager" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-impact">Expected impact (optional)</Label>
        <Textarea id="support-impact" value={expectedImpact} onChange={(event) => setExpectedImpact(event.target.value)} placeholder="How this support should contribute" />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || loading || !assigneeId}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create support assignment
        </Button>
      </div>
    </form>
  );
}
