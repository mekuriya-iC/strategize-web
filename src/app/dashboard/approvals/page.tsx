"use client";
import { useState } from "react";
// import ApprovalsTable from "@/components/approvals/ApprovalsTable";
import SubmissionApprovalsTable from "@/components/approvals/SubmissionApprovalsTable";
import { useUser } from "@/context/UserContext";

export default function ApprovalsPage() {
  const { user } = useUser();
  // const [activeTab, setActiveTab] = useState("all");
  // const [workflowType, setWorkflowType] = useState("submissions"); // "submissions" or "direct"
  const [submissionTab, setSubmissionTab] = useState(
    user?.role === "NORMAL" ? "personnel" : "division"
  );

  // const tabs = [
  //   { id: "all", label: "All Objectives", isActive: true },
  //   { id: "department", label: "Department Objectives", isActive: false },
  //   { id: "personnel", label: "Personnel Objectives", isActive: false },
  // ];

  // Tab labels depending on level
  const submissionTabs =
    user?.role === "NORMAL"
      ? [{ id: "personnel", label: "My Personal Objectives" }]
      : [
          { id: "division", label: "Department Objectives" },
          { id: "department", label: "Personal Objectives" },
        ];

  return (
    <>
      <div className="min-h-[70vh]">
        {/* Main Workflow Tabs - Commented out for now */}
        {/* <div className="border-b border-gray-200 mb-6">
          <nav className="flex justify-center space-x-12">
            <button
              onClick={() => setWorkflowType("submissions")}
              className={`py-3 px-4 border-b-2 font-medium text-xl transition-colors ${
                workflowType === "submissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Submission-Based Approval
            </button>
            <button
              onClick={() => setWorkflowType("direct")}
              className={`py-3 px-4 border-b-2 font-medium text-xl transition-colors ${
                workflowType === "direct"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Direct Approval
            </button>
          </nav>
        </div> */}

        {/* Page Content */}
        <div className="space-y-6">
          {/* Page Header */}
          <div className="px-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {user?.role === "NORMAL" ? "My Submissions" : "Approval Requests"}
            </h1>
            <p className="text-gray-600">
              {user?.role === "NORMAL"
                ? "Track the status of your objective and KPI submissions"
                : "Review and approve submissions from your divisions, departments, or employees"}
            </p>

            {/* Info Box for Managers/Admins */}
            {user?.role !== "NORMAL" && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Approval Flow
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        <strong>Division Objectives:</strong> Submissions from
                        divisions requesting corporate approval
                        <br />
                        <strong>Department Objectives:</strong> Submissions from
                        departments requesting approval from their division or
                        corporate
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Workflow Content - Only Submission-Based Approval */}
          <div className="px-6">
            {/* Submission Type Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex justify-center space-x-8">
                {submissionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSubmissionTab(tab.id)}
                    className={`py-2 px-4 border-b-2 font-medium text-lg transition-colors ${
                      submissionTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <SubmissionApprovalsTable />
          </div>
        </div>
      </div>
    </>
  );
}
