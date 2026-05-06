"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { UPDATE_OBJECTIVE } from "@/lib/graphql/mutations/objectives";

interface BrokenObjective {
  objectiveId: string;
  title: string;
  type: string;
  assigneeType: string | null;
  assigneeId: string | null;
  parentId: string | null;
  assignerId: string | null;
}

export default function FixAssignmentData() {
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<{
    fixed: number;
    failed: number;
    skipped: number;
    details: string[];
  } | null>(null);

  // Fetch all objectives
  const { data, loading, refetch } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 1000 },
    fetchPolicy: "network-only",
  });

  const [updateObjective] = useMutation(UPDATE_OBJECTIVE);

  const objectives = data?.objectives?.items || [];

  // Find broken objectives
  const brokenObjectives: BrokenObjective[] = objectives.filter(
    (obj: any) =>
      obj.assigneeType && !obj.assigneeId && obj.type !== "CORPORATE"
  );

  // Find objectives with mismatched type and assigneeType
  const mismatchedObjectives: BrokenObjective[] = objectives.filter(
    (obj: any) =>
      obj.type &&
      obj.assigneeId &&
      (!obj.assigneeType || obj.assigneeType !== obj.type) &&
      obj.type !== "CORPORATE"
  );

  const totalIssues = brokenObjectives.length + mismatchedObjectives.length;

  const handleFix = async () => {
    setFixing(true);
    setResults(null);

    let fixed = 0;
    let failed = 0;
    let skipped = 0;
    const details: string[] = [];

    try {
      // Fix broken objectives (assigneeType but no assigneeId)
      for (const obj of brokenObjectives) {
        try {
          // Strategy 1: Try to inherit from parent
          if (obj.parentId) {
            const parent = objectives.find(
              (o: any) => o.objectiveId === obj.parentId
            );
            if (parent?.assigneeId) {
              await updateObjective({
                variables: {
                  input: {
                    objectiveId: obj.objectiveId,
                    assigneeId: parent.assigneeId,
                  },
                },
              });
              fixed++;
              details.push(
                `✅ Fixed "${obj.title || "Untitled"}" - inherited assigneeId from parent`
              );
              continue;
            }
          }

          // Strategy 2: Try to use assigner's context
          if (obj.assignerId) {
            // For now, we can't automatically determine the correct assigneeId
            // without more context, so we skip
            skipped++;
            details.push(
              `⚠️ Skipped "${obj.title || "Untitled"}" - needs manual assignment`
            );
          } else {
            skipped++;
            details.push(
              `⚠️ Skipped "${obj.title || "Untitled"}" - no parent or assigner info`
            );
          }
        } catch (error) {
          failed++;
          details.push(
            `❌ Failed to fix "${obj.title || "Untitled"}" - ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Fix mismatched objectives (type and assigneeType don't match)
      for (const obj of mismatchedObjectives) {
        try {
          await updateObjective({
            variables: {
              input: {
                objectiveId: obj.objectiveId,
                assigneeType: obj.type,
              },
            },
          });
          fixed++;
          details.push(
            `✅ Fixed "${obj.title || "Untitled"}" - set assigneeType to match type`
          );
        } catch (error) {
          failed++;
          details.push(
            `❌ Failed to fix "${obj.title || "Untitled"}" - ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      setResults({ fixed, failed, skipped, details });

      if (fixed > 0) {
        toast.success(`Fixed ${fixed} objective(s)`);
        await refetch();
      }

      if (skipped > 0) {
        toast.warning(`${skipped} objective(s) need manual assignment`);
      }

      if (failed > 0) {
        toast.error(`Failed to fix ${failed} objective(s)`);
      }
    } catch (error) {
      toast.error("Fix operation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fix Assignment Data</CardTitle>
          <CardDescription>Loading objectives...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Assignment Data</CardTitle>
        <CardDescription>
          Repair objectives with missing or incorrect assignment fields
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {objectives.length}
            </div>
            <div className="text-sm text-gray-600">Total Objectives</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {brokenObjectives.length}
            </div>
            <div className="text-sm text-red-600">Missing assigneeId</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {mismatchedObjectives.length}
            </div>
            <div className="text-sm text-yellow-600">Mismatched Type</div>
          </div>
        </div>

        {/* Issues Found */}
        {totalIssues > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {totalIssues} objective(s) with assignment issues that need
              to be fixed.
            </AlertDescription>
          </Alert>
        )}

        {/* Broken Objectives List */}
        {brokenObjectives.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">
              Objectives with Missing assigneeId:
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
              {brokenObjectives.map((obj) => (
                <div
                  key={obj.objectiveId}
                  className="flex items-center justify-between p-2 bg-red-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {obj.title || "Untitled Objective"}
                    </div>
                    <div className="text-xs text-gray-600">
                      Type: {obj.type} | AssigneeType: {obj.assigneeType} |
                      AssigneeId: <span className="text-red-600">NULL</span>
                    </div>
                  </div>
                  <Badge variant="destructive">Broken</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mismatched Objectives List */}
        {mismatchedObjectives.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">
              Objectives with Mismatched Type:
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
              {mismatchedObjectives.map((obj) => (
                <div
                  key={obj.objectiveId}
                  className="flex items-center justify-between p-2 bg-yellow-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {obj.title || "Untitled Objective"}
                    </div>
                    <div className="text-xs text-gray-600">
                      Type: {obj.type} | AssigneeType:{" "}
                      <span className="text-yellow-600">
                        {obj.assigneeType || "NULL"}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow-600">
                    Mismatch
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fix Button */}
        {totalIssues > 0 && (
          <Button
            onClick={handleFix}
            disabled={fixing}
            className="w-full"
            size="lg"
          >
            {fixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              <>Fix {totalIssues} Issue(s)</>
            )}
          </Button>
        )}

        {/* No Issues */}
        {totalIssues === 0 && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All objectives have correct assignment data! No fixes needed.
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3 mt-6 pt-6 border-t">
            <h3 className="font-semibold">Fix Results:</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-600">
                  {results.fixed}
                </div>
                <div className="text-xs text-green-600">Fixed</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {results.skipped}
                </div>
                <div className="text-xs text-yellow-600">Skipped</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-red-600">
                  {results.failed}
                </div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
            </div>

            {/* Details */}
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-3 bg-gray-50">
              {results.details.map((detail, index) => (
                <div key={index} className="text-xs font-mono">
                  {detail}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This tool can only fix objectives that
            have parent objectives with valid assigneeId. Objectives without
            parent context will need manual assignment. Make sure you've also
            fixed the backend code to prevent this issue from happening again!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
