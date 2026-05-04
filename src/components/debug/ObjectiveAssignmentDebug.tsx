"use client";

import { useObjectives } from "@/hooks/objectives/useObjectives";
import { useAuthStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Debug component to diagnose objective assignment issues
 * Shows detailed information about objectives and their assignment fields
 */
export default function ObjectiveAssignmentDebug() {
  const user = useAuthStore((state) => state.user);
  const { guards, scope } = usePermissions();
  const { objectives, loading } = useObjectives({ page: 1, limit: 1000 });

  if (loading) return <div>Loading debug info...</div>;

  const myDeptIds = scope?.managedDepartmentIds || [];
  const myDivIds = scope?.managedDivisionIds || [];

  return (
    <Card className="bg-yellow-50 border-yellow-300">
      <CardHeader>
        <CardTitle className="text-yellow-900">🔍 Objective Assignment Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-yellow-900 mb-2">User Context:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>User ID:</strong> {user?.employeeId}</p>
            {guards.isManager && (
              <p><strong>Managed Departments:</strong> {myDeptIds.join(", ") || "NONE"}</p>
            )}
            {guards.isDirector && (
              <p><strong>Managed Divisions:</strong> {myDivIds.join(", ") || "NONE"}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-yellow-900 mb-2">All Objectives in Database ({objectives.length}):</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {objectives.map((obj) => (
              <div key={obj.objectiveId} className="bg-white p-3 rounded border text-xs">
                <p><strong>Title:</strong> {obj.title}</p>
                <p><strong>ID:</strong> {obj.objectiveId}</p>
                <p><strong>Type:</strong> <span className="font-mono bg-blue-100 px-1">{obj.type}</span></p>
                <p><strong>AssigneeType:</strong> <span className="font-mono bg-purple-100 px-1">{obj.assigneeType || "NULL"}</span></p>
                <p><strong>AssigneeId:</strong> <span className="font-mono bg-green-100 px-1">{obj.assigneeId || "NULL"}</span></p>
                <p><strong>Status:</strong> {obj.status}</p>
                
                {/* Show if this matches user's context */}
                {guards.isManager && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-semibold">Manager Match Check:</p>
                    <p>✓ Type is DEPARTMENT: {obj.type === "DEPARTMENT" ? "YES" : "NO"}</p>
                    <p>✓ AssigneeType is DEPARTMENT: {obj.assigneeType === "DEPARTMENT" ? "YES" : "NO"}</p>
                    <p>✓ AssigneeId matches my dept: {myDeptIds.includes(obj.assigneeId || "") ? "YES" : "NO"}</p>
                    <p className="font-bold mt-1">
                      Should I see this? {
                        obj.type === "DEPARTMENT" && 
                        obj.assigneeType === "DEPARTMENT" && 
                        myDeptIds.includes(obj.assigneeId || "")
                          ? "✅ YES" 
                          : "❌ NO"
                      }
                    </p>
                  </div>
                )}

                {guards.isDirector && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-semibold">Director Match Check:</p>
                    <p>✓ Type is DIVISION: {obj.type === "DIVISION" ? "YES" : "NO"}</p>
                    <p>✓ AssigneeType is DIVISION: {obj.assigneeType === "DIVISION" ? "YES" : "NO"}</p>
                    <p>✓ AssigneeId matches my div: {myDivIds.includes(obj.assigneeId || "") ? "YES" : "NO"}</p>
                    <p className="font-bold mt-1">
                      Should I see this? {
                        obj.type === "DIVISION" && 
                        obj.assigneeType === "DIVISION" && 
                        myDivIds.includes(obj.assigneeId || "")
                          ? "✅ YES" 
                          : "❌ NO"
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-3 rounded">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Common Issues:</h3>
          <ul className="text-sm space-y-1 text-red-800">
            <li>1. <strong>assigneeType is NULL</strong> - Objective was created without setting assigneeType</li>
            <li>2. <strong>assigneeId doesn't match</strong> - Objective assigned to different department/division</li>
            <li>3. <strong>type doesn't match assigneeType</strong> - Inconsistent data (e.g., type=DEPARTMENT but assigneeType=DIVISION)</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Solution:</h3>
          <p className="text-sm text-blue-800">
            When creating/assigning objectives, ensure BOTH <code className="bg-blue-200 px-1">type</code> and{" "}
            <code className="bg-blue-200 px-1">assigneeType</code> are set to the same value (DEPARTMENT, DIVISION, or PERSONNEL),
            and <code className="bg-blue-200 px-1">assigneeId</code> is set to the correct department/division/user ID.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
