"use client";

import { use } from "react";
import { useTeam } from "@/hooks/teams/useTeams";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "@/lib/graphql/queries/employees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Building2, User, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { team, loading: teamLoading } = useTeam(id);

  // Fetch all employees to show team members
  // Note: In a real implementation, you'd have a teamMembers query
  const { data: empsData, loading: empsLoading } = useQuery(GET_EMPLOYEES, {
    variables: { page: 1, limit: 200 },
  });
  const allEmployees = empsData?.employees?.items || [];

  // Filter employees by department (as a proxy for team membership)
  const teamMembers = team?.department
    ? allEmployees.filter(
        (emp: any) => emp.department?.departmentId === team.department?.departmentId
      )
    : [];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (teamLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
          <div className="h-32 bg-gray-100 dark:bg-gray-900 rounded-xl mb-6" />
          <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Team not found
        </h2>
        <p className="text-gray-500 mb-4">
          The team you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button variant="outline" onClick={() => router.push("/dashboard/teams")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/teams")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Teams
      </Button>

      {/* Team Header */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {team.name}
                </h1>
                {team.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {team.description}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  team.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {team.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {team.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>
                    <strong>{team.department.name}</strong>
                    {team.department.division && ` • ${team.department.division.name}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(team.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Lead */}
      {team.teamLead && (
        <Card>
          <CardHeader>
            <CardTitle>Team Lead</CardTitle>
            <CardDescription>Person responsible for leading this team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <UserAvatar
                user={{
                  fullName: team.teamLead.fullName,
                  picture: team.teamLead.picture,
                }}
                size="lg"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {team.teamLead.fullName}
                </p>
                {team.teamLead.title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.teamLead.title}
                  </p>
                )}
                {team.teamLead.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {team.teamLead.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          <CardDescription>
            Employees in the {team.department?.name || "team"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {empsLoading ? (
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
          ) : teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member: any) => (
                <div
                  key={member.employeeId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/employees/${member.employeeId}`)}
                >
                  <UserAvatar
                    user={{
                      fullName: member.fullName,
                      picture: member.picture,
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.fullName}
                    </p>
                    {member.title && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {member.title}
                      </p>
                    )}
                  </div>
                  {member.employeeId === team.teamLead?.employeeId && (
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                      Lead
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No team members found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.department ? team.department.name : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {team.department?.division?.name || "No division"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Lead</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.teamLead ? "Assigned" : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {team.teamLead?.fullName || "No lead assigned"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
