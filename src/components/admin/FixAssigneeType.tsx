"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApolloClient } from "@apollo/client";
import { toast } from "sonner";
import { Wrench, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GET_OBJECTIVES } from "@/lib/graphql/queries/objectives";
import { gql } from "@apollo/client";

// Simplified update mutation that doesn't require strategicPeriod
const UPDATE_OBJECTIVE_ASSIGNEE_TYPE = gql`
  mutation UpdateObjectiveAssigneeType($input: UpdateObjectiveInput!) {
    updateObjective(updateObjectiveInput: $input) {
      objectiveId
      type
      assigneeType
      assigneeId
    }
  }
`;

interface FixResult {
  total: number;
  fixed: number;
  errors: number;
  details: string[];
}

export default function FixAssigneeType() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const apolloClient = useApolloClient();

  const handleFix = async () => {
    setIsLoading(true);
    const details: string[] = [];
    let fixed = 0;
    let errors = 0;

    try {
      // Fetch all objectives
      const { data } = await apolloClient.query({
        query: GET_OBJECTIVES,
        variables: { page: 1, limit: 1000 },
        fetchPolicy: "network-only",
      });

      const objectives = data?.objectives?.items || [];
      details.push(`📊 Found ${objectives.length} objectives in database`);

      // Find objectives that need fixing
      const needsFix = objectives.filter((obj: any) => {
        // Corporate objectives should NOT have assigneeType (they're not assigned)
        if (obj.type === "CORPORATE") {
          // If it has an assigneeType, it needs to be cleared
          return obj.assigneeType !== null && obj.assigneeType !== undefined;
        }
        
        // For non-corporate objectives:
        // Case 1: assigneeType is NULL but type is set
        if (!obj.assigneeType && obj.type) {
          return true;
        }
        // Case 2: assigneeType doesn't match type
        if (obj.assigneeType && obj.type && obj.assigneeType !== obj.type) {
          return true;
        }
        return false;
      });

      details.push(`🔧 Found ${needsFix.length} objectives that need fixing`);

      // Fix each objective
      for (const obj of needsFix) {
        try {
          const oldType = obj.type;
          const oldAssigneeType = obj.assigneeType || "NULL";
          
          // Corporate objectives should NOT have assigneeType
          if (obj.type === "CORPORATE") {
            await apolloClient.mutate({
              mutation: UPDATE_OBJECTIVE_ASSIGNEE_TYPE,
              variables: {
                input: {
                  objectiveId: obj.objectiveId,
                  assigneeType: null, // Clear assigneeType for corporate objectives
                },
              },
            });

            fixed++;
            details.push(
              `✅ Fixed "${obj.title || obj.objectiveId}": type=${oldType}, cleared assigneeType (was: ${oldAssigneeType})`
            );
          } else {
            // For non-corporate objectives, set assigneeType to match type
            await apolloClient.mutate({
              mutation: UPDATE_OBJECTIVE_ASSIGNEE_TYPE,
              variables: {
                input: {
                  objectiveId: obj.objectiveId,
                  assigneeType: obj.type, // Set assigneeType to match type
                },
              },
            });

            fixed++;
            details.push(
              `✅ Fixed "${obj.title || obj.objectiveId}": type=${oldType}, assigneeType: ${oldAssigneeType} → ${obj.type}`
            );
          }
        } catch (error: any) {
          errors++;
          details.push(
            `❌ Failed to fix "${obj.title || obj.objectiveId}": ${error.message}`
          );
        }
      }

      const finalResult: FixResult = {
        total: objectives.length,
        fixed,
        errors,
        details,
      };

      setResult(finalResult);

      if (errors === 0) {
        toast.success(
          `🎉 Fixed ${fixed} objectives! All assigneeType fields now match their type.`
        );
      } else {
        toast.warning(
          `⚠️ Fixed ${fixed} objectives, but ${errors} failed. Check details below.`
        );
      }
    } catch (error: any) {
      console.error("Fix error:", error);
      toast.error(`💥 Fix Error: ${error.message}`);
      details.push(`💥 Fatal error: ${error.message}`);
      setResult({
        total: 0,
        fixed,
        errors: errors + 1,
        details,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          {result.errors === 0 ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {result.errors === 0
                ? "✅ Fix Completed Successfully!"
                : "⚠️ Fix Completed with Errors"}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Fixed {result.fixed} of {result.total} objectives
              {result.errors > 0 && ` (${result.errors} errors)`}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-2">📋 Details:</h4>
          <ul className="text-sm text-gray-700 space-y-1 font-mono">
            {result.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => {
            setResult(null);
            window.location.reload();
          }}
          className="w-full"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Wrench className="w-6 h-6 text-blue-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔧 Fix Assignment Type Mismatch
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            This tool fixes objectives where <code className="bg-blue-100 px-1 rounded">assigneeType</code> doesn't match{" "}
            <code className="bg-blue-100 px-1 rounded">type</code>. This is required for proper filtering
            by role (Manager, Director, etc.).
          </p>

          <div className="bg-blue-100 border border-blue-300 rounded-md p-3 mb-4">
            <h4 className="font-medium text-blue-900 mb-1">
              🔍 This will fix:
            </h4>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Objectives with NULL <code>assigneeType</code> (except CORPORATE)</li>
              <li>
                Objectives where <code>assigneeType</code> doesn't match <code>type</code>
              </li>
              <li>
                CORPORATE objectives with <code>assigneeType</code> set (will be cleared)
              </li>
              <li>
                Example: <code>type=DIVISION</code> but <code>assigneeType=DEPARTMENT</code>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 mb-4">
            <h4 className="font-medium text-yellow-900 mb-1">
              ℹ️ Important:
            </h4>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
              <li>
                CORPORATE objectives should NOT have <code>assigneeType</code> (they're organization-wide)
              </li>
              <li>
                DIVISION/DEPARTMENT/PERSONNEL objectives must have matching <code>assigneeType</code>
              </li>
              <li>
                Valid <code>assigneeType</code> values: DIVISION, DEPARTMENT, PERSONNEL
              </li>
            </ul>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    Fix AssigneeType Fields
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>🔧 Confirm Fix</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update all objectives where <code>assigneeType</code> doesn't match <code>type</code>.
                  <br />
                  <br />
                  The fix will set <code>assigneeType = type</code> for each objective.
                  <br />
                  <br />
                  This is safe and reversible. Do you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFix}>
                  Yes, Fix Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
