"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, Users, Search, Plus, Eye, Trash2, Lock, Unlock } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CHECKINOUT_SESSIONS } from "@/lib/graphql/queries/checkins";
import { REMOVE_CHECKINOUT_SESSION, UPDATE_CHECKINOUT_SESSION } from "@/lib/graphql/mutations/checkins";
import { toast } from "sonner";
import {
  getLeadershipCheckinoutSessions,
  groupCheckinoutSessionsByWeek,
  type CheckinoutSessionWeekGroup,
  type CheckinoutSessionLike,
} from "@/utils/checkin-session-groups";
import {
  deduplicateCheckinoutSessions,
  isClosedCheckinoutSession,
  isHistoricalCheckinoutSession,
} from "@/utils/checkin-session-history";

interface SessionListViewProps {
  currentUser: any;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
}

export default function SessionListView({
  currentUser,
  onCreateSession,
  onSelectSession,
}: SessionListViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-team");
  const [employeeTab, setEmployeeTab] = useState("active");
  const today = useMemo(() => new Date(), []);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  const isManager = ["MANAGER", "DIRECTOR", "ADMIN", "SUPER_ADMIN"].includes(
    currentUser?.role,
  );
  const isAdminOrHR = ["ADMIN", "SUPER_ADMIN", "HR"].includes(currentUser?.role);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Query for team sessions (as supervisor)
  const {
    data: teamData,
    loading: teamLoading,
    refetch: refetchTeam,
  } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      supervisorUserId: currentUser?.employeeId,
      page: 1,
      limit: 100,
    },
    skip: !isManager || !currentUser?.employeeId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all", // Return partial data even if there are errors
  });

  // Query for own sessions (as employee)
  const {
    data: ownData,
    loading: ownLoading,
    refetch: refetchOwn,
  } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      employeeUserId: currentUser?.employeeId,
      page: 1,
      limit: 100,
    },
    skip: !currentUser?.employeeId,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all", // Return partial data even if there are errors
  });

  // Query for all sessions (admin/HR)
  const {
    data: allData,
    loading: allLoading,
    refetch: refetchAll,
  } = useQuery(GET_CHECKINOUT_SESSIONS, {
    variables: {
      page: 1,
      limit: 1000,
    },
    skip: !isAdminOrHR,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all", // Return partial data even if there are errors
  });

  const [deleteSession] = useMutation(REMOVE_CHECKINOUT_SESSION, {
    onCompleted: () => {
      toast.success("Session deleted successfully");
      refetchTeam();
      refetchOwn();
      refetchAll();
    },
    onError: (error) => {
      // Ignore the "Cannot return null" error as the deletion actually succeeds
      if (
        error.message?.includes("Cannot return null for non-nullable field")
      ) {
        toast.success("Session deleted successfully");
        refetchTeam();
        refetchOwn();
        refetchAll();
        return;
      }

      // Check if it's a foreign key constraint error
      if (
        error.message?.includes("foreign key constraint") ||
        error.message?.includes("CheckinoutTask")
      ) {
        toast.error(
          "Cannot delete session with existing tasks. Please delete all tasks first.",
          { duration: 5000 },
        );
      } else {
        toast.error(error.message || "Failed to delete session");
      }
    },
  });

  const [updateSession] = useMutation(UPDATE_CHECKINOUT_SESSION, {
    onCompleted: () => {
      toast.success("Session updated successfully");
      refetchTeam();
      refetchOwn();
      refetchAll();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update session");
    },
  });

  const teamSessions = useMemo<CheckinoutSessionLike[]>(
    () =>
      (teamData?.checkinoutSessions?.items || []).filter(
        (session: CheckinoutSessionLike) =>
          session.employee?.employeeId !== currentUser?.employeeId,
      ),
    [currentUser?.employeeId, teamData],
  );
  const ownSessions = useMemo<CheckinoutSessionLike[]>(
    () =>
      (ownData?.checkinoutSessions?.items || []).filter(
        (session: CheckinoutSessionLike) => session.employee,
      ),
    [ownData],
  );
  const allSessions = useMemo<CheckinoutSessionLike[]>(
    () =>
      (allData?.checkinoutSessions?.items || []).filter(
        (session: CheckinoutSessionLike) => session.employee,
      ),
    [allData],
  );
  const activeTeamSessions = useMemo(
    () =>
      teamSessions.filter(
        (session) => !isHistoricalCheckinoutSession(session, today),
      ),
    [teamSessions, today],
  );
  const activeOwnSessions = useMemo(
    () =>
      ownSessions.filter(
        (session) => !isHistoricalCheckinoutSession(session, today),
      ),
    [ownSessions, today],
  );
  const historicalOwnSessions = useMemo(
    () =>
      ownSessions.filter((session) =>
        isHistoricalCheckinoutSession(session, today),
      ),
    [ownSessions, today],
  );
  const activeAllSessions = useMemo(
    () =>
      allSessions.filter(
        (session) => !isHistoricalCheckinoutSession(session, today),
      ),
    [allSessions, today],
  );
  const historicalScopedSessions = useMemo(() => {
    const scopedSessions = isAdminOrHR
      ? [...allSessions, ...teamSessions, ...ownSessions]
      : [...teamSessions, ...ownSessions];
    return deduplicateCheckinoutSessions(scopedSessions).filter((session) =>
      isHistoricalCheckinoutSession(session, today),
    );
  }, [allSessions, isAdminOrHR, ownSessions, teamSessions, today]);
  const activeLeadershipSessions = useMemo(
    () => getLeadershipCheckinoutSessions(activeAllSessions),
    [activeAllSessions],
  );
  const visibleTeamSessions = isSuperAdmin
    ? activeLeadershipSessions
    : activeTeamSessions;
  const teamWeekGroups = useMemo(
    () => groupCheckinoutSessionsByWeek(visibleTeamSessions),
    [visibleTeamSessions],
  );
  const historyWeekGroups = useMemo(
    () => groupCheckinoutSessionsByWeek(historicalScopedSessions),
    [historicalScopedSessions],
  );

  // Filter peer managers' sessions (managers who are employees in sessions)
  const peerManagerSessions = useMemo(() => {
    if (!isManager) return [];
    return activeAllSessions.filter((session: any) => {
      const employeeRole = session.employee?.role;
      return (
        ["MANAGER", "DIRECTOR"].includes(employeeRole) &&
        session.employee?.employeeId !== currentUser?.employeeId
      );
    });
  }, [activeAllSessions, isManager, currentUser?.employeeId]);

  const getSprintTitle = (session: any, index: number) => {
    // Use custom title if available, otherwise generate from dates
    if (session.title) {
      return session.title;
    }

    const startDate = new Date(session.weekStartDate);
    const endDate = new Date(session.weekEndDate);
    return `Sprint ${index + 1} - ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700";
      case "SUBMITTED":
        return "bg-amber-100 text-amber-700";
      case "REVIEWED":
        return "bg-purple-100 text-purple-700";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "CLOSED":
        return "bg-slate-200 text-slate-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDeleteSession = async (
    sessionId: string,
    sessionTitle: string,
  ) => {
    console.log("🗑️ Delete requested for:", sessionId, sessionTitle);

    // Use Sonner toast for confirmation with centered position
    toast(
      <div className="flex flex-col gap-3 p-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Delete Session?</p>
            <p className="text-sm text-gray-600 mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
          {sessionTitle}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss();
              confirmDelete(sessionId);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Delete Session
          </button>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "top-center",
        className: "w-full max-w-md",
        style: {
          padding: "16px",
        },
      },
    );
  };

  const confirmDelete = async (sessionId: string) => {
    console.log("✅ Delete confirmed, calling mutation...");
    setDeletingSessionId(sessionId);

    try {
      await deleteSession({
        variables: { checkinoutSessionId: sessionId },
      });
      console.log("✅ Delete mutation completed");
    } catch (error: any) {
      console.error("❌ Delete mutation failed:", error);
      // Error handling is done in the mutation's onError callback
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleToggleLock = async (sessionId: string, currentLockState: boolean) => {
    try {
      await updateSession({
        variables: {
          input: {
            checkinoutSessionId: sessionId,
            isLocked: !currentLockState,
          },
        },
      });
    } catch (error) {
      console.error("Failed to toggle lock:", error);
    }
  };

  const filterSessions = (sessions: any[]) => {
    if (!searchQuery) return sessions;
    return sessions.filter((session: any) => {
      // Handle null employee gracefully
      const employeeName = session.employee?.fullName || "Unknown Employee";
      return (
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.weekStartDate.includes(searchQuery) ||
        session.weekEndDate.includes(searchQuery)
      );
    });
  };

  const filterWeekGroups = (
    groups: CheckinoutSessionWeekGroup<CheckinoutSessionLike>[],
  ) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;

    return groups.filter(({ representativeSession, participantSessions }) => {
      const searchableValues = [
        representativeSession.title,
        representativeSession.weekStartDate,
        representativeSession.weekEndDate,
        representativeSession.strategicPeriod?.name,
        representativeSession.supervisor?.fullName,
        ...participantSessions.map((session) => session.employee?.fullName),
      ];
      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  };

  const renderSessionCard = (
    session: any,
    index: number,
    showEmployee = true,
  ) => {
    const sprintTitle = getSprintTitle(session, index);

    // Handle null employee gracefully
    const employeeName = session.employee?.fullName || "Unknown Employee";
    const supervisorName = session.supervisor?.fullName || "Unknown Supervisor";
    const isSessionOwner = session.supervisor?.employeeId === currentUser?.employeeId;
    const isClosed = isClosedCheckinoutSession(session);
    const isHistorical = isHistoricalCheckinoutSession(session, today);
    const isLocked = Boolean(session.isLocked) || isClosed;

    return (
      <Card
        key={session.checkinoutSessionId}
        className="hover:shadow-md transition-shadow"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sprintTitle}
                </h3>
                {isLocked && (
                  <div
                    title={isClosed ? "Session is closed" : "Session is locked"}
                  >
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                )}
              </div>
              {showEmployee && (
                <p className="text-sm text-gray-600">
                  Employee: <span className="font-medium">{employeeName}</span>
                  {!session.employee && (
                    <span className="text-red-500 ml-1">(Deleted)</span>
                  )}
                </p>
              )}
              <p className="text-sm text-gray-600">
                Session creator / supervisor:{" "}
                <span className="font-medium">{supervisorName}</span>
              </p>
            </div>
            <Badge className={getStatusColor(session.overallStatus)}>
              {session.overallStatus}
            </Badge>
          </div>

          {isLocked && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-800 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {isClosed
                  ? "This session is closed and cannot be changed."
                  : "This session is locked. No tasks can be added or edited."}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(session.weekStartDate).toLocaleDateString()} -{" "}
                {new Date(session.weekEndDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {session.strategicPeriod && (
            <div className="mb-4">
              <Badge variant="outline" className="text-xs">
                {session.strategicPeriod.name}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onSelectSession(session.checkinoutSessionId)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Session
            </Button>
            {isSessionOwner && !isHistorical && (
              <Button
                size="sm"
                variant="outline"
                className={isLocked ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"}
                onClick={() => handleToggleLock(session.checkinoutSessionId, isLocked)}
              >
                {isLocked ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            )}
            {(isAdminOrHR || isSessionOwner) && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() =>
                  handleDeleteSession(session.checkinoutSessionId, sprintTitle)
                }
                disabled={deletingSessionId === session.checkinoutSessionId}
              >
                {deletingSessionId === session.checkinoutSessionId ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekGroupCard = (
    group: CheckinoutSessionWeekGroup<CheckinoutSessionLike>,
    index: number,
  ) => {
    const session = group.representativeSession;
    const sprintTitle = getSprintTitle(session, index);
    const statuses = new Set(
      group.participantSessions.map(
        (participant) => participant.overallStatus || "OPEN",
      ),
    );
    const groupStatus = statuses.size === 1 ? Array.from(statuses)[0] : "MIXED";
    const lockedCount = group.participantSessions.filter(
      (participant) =>
        participant.isLocked || isClosedCheckinoutSession(participant),
    ).length;

    return (
      <Card key={group.key} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sprintTitle}
                </h3>
                {lockedCount > 0 && (
                  <div title={`${lockedCount} participant session(s) locked`}>
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Session creator / supervisor:{" "}
                <span className="font-medium">
                  {session.supervisor?.fullName || "Unknown Supervisor"}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                {group.participantSessions.length}{" "}
                {group.participantSessions.length === 1
                  ? "participant"
                  : "participants"}
              </p>
            </div>
            <Badge className={getStatusColor(groupStatus)}>{groupStatus}</Badge>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(session.weekStartDate).toLocaleDateString()} -{" "}
              {new Date(session.weekEndDate).toLocaleDateString()}
            </span>
          </div>

          {session.strategicPeriod && (
            <div className="mb-4">
              <Badge variant="outline" className="text-xs">
                {session.strategicPeriod.name}
              </Badge>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {group.participantSessions.map((participant) => {
              const participantName =
                participant.employee?.fullName || "Unknown Employee";
              const isSessionOwner =
                participant.supervisor?.employeeId === currentUser?.employeeId;
              const isClosed = isClosedCheckinoutSession(participant);
              const isHistorical = isHistoricalCheckinoutSession(
                participant,
                today,
              );
              const isLocked = Boolean(participant.isLocked) || isClosed;

              return (
                <div
                  key={participant.checkinoutSessionId}
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {participantName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{participant.overallStatus || "OPEN"}</span>
                      {isLocked && (
                        <span className="flex items-center gap-1 text-amber-700">
                          <Lock className="h-3 w-3" />
                          {isClosed ? "Closed" : "Locked"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSessionOwner && !isHistorical && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={
                          isLocked
                            ? "h-8 w-8 p-0 text-green-600"
                            : "h-8 w-8 p-0 text-amber-600"
                        }
                        onClick={() =>
                          handleToggleLock(
                            participant.checkinoutSessionId,
                            isLocked,
                          )
                        }
                        title={isLocked ? "Unlock session" : "Lock session"}
                      >
                        {isLocked ? (
                          <Unlock className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {(isAdminOrHR || isSessionOwner) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() =>
                          handleDeleteSession(
                            participant.checkinoutSessionId,
                            `${sprintTitle} - ${participantName}`,
                          )
                        }
                        disabled={
                          deletingSessionId === participant.checkinoutSessionId
                        }
                        title="Delete participant session"
                      >
                        {deletingSessionId ===
                        participant.checkinoutSessionId ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onSelectSession(session.checkinoutSessionId)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Week
          </Button>
        </CardContent>
      </Card>
    );
  };

  const historyLoading =
    teamLoading || ownLoading || (isAdminOrHR && allLoading);

  const renderEmptyState = (message: string, showCreateButton = false) => (
    <div className="flex flex-col items-center justify-center h-64">
      <Users className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-gray-600 mb-4">{message}</p>
      {showCreateButton && isManager && (
        <Button
          onClick={onCreateSession}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Check-In Period
        </Button>
      )}
    </div>
  );

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  // Regular employee view
  if (!isManager) {
    const filteredActiveSessions = filterSessions(activeOwnSessions);
    const filteredHistoricalSessions = filterSessions(historicalOwnSessions);

    const renderEmployeeSessions = (
      sessions: CheckinoutSessionLike[],
      emptyMessage: string,
    ) =>
      sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session, index) =>
            renderSessionCard(session, index, false),
          )}
        </div>
      ) : (
        renderEmptyState(emptyMessage)
      );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Check-In Sessions
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              View and manage your weekly check-in sessions
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={employeeTab} onValueChange={setEmployeeTab}>
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Active ({activeOwnSessions.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              History ({historicalOwnSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {ownLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    Loading sessions...
                  </p>
                </div>
              </div>
            ) : (
              renderEmployeeSessions(
                filteredActiveSessions,
                "No active check-in sessions found",
              )
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {ownLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    Loading session history...
                  </p>
                </div>
              </div>
            ) : (
              renderEmployeeSessions(
                filteredHistoricalSessions,
                "No historical check-in sessions found",
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Manager/Admin view (with tabs)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Check-In Sessions
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage check-in sessions for your team
          </p>
        </div>
        {isManager && (
          <Button
            onClick={onCreateSession}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Check-In Period
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap bg-white border border-gray-200">
          <TabsTrigger
            value="my-team"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            My Team ({teamWeekGroups.length})
          </TabsTrigger>
          <TabsTrigger
            value="my-sessions"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            My Sessions ({activeOwnSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            History ({historyWeekGroups.length})
          </TabsTrigger>
          {isManager && (
            <TabsTrigger
              value="peer-managers"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              Peer Managers ({peerManagerSessions.length})
            </TabsTrigger>
          )}
          {isAdminOrHR && (
            <TabsTrigger
              value="all-sessions"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              All Sessions ({activeAllSessions.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Team Tab */}
        <TabsContent value="my-team" className="mt-6">
          {(isSuperAdmin ? allLoading : teamLoading) ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Loading sessions...
                </p>
              </div>
            </div>
          ) : filterWeekGroups(teamWeekGroups).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterWeekGroups(teamWeekGroups).map((group, index) =>
                renderWeekGroupCard(group, index),
              )}
            </div>
          ) : (
            renderEmptyState("No team sessions found", true)
          )}
        </TabsContent>

        {/* My Sessions Tab */}
        <TabsContent value="my-sessions" className="mt-6">
          {ownLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Loading sessions...
                </p>
              </div>
            </div>
          ) : filterSessions(activeOwnSessions).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterSessions(activeOwnSessions).map(
                (session: any, index: number) =>
                  renderSessionCard(session, index, false),
              )}
            </div>
          ) : (
            renderEmptyState("No personal sessions found")
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-600">
                  Loading session history...
                </p>
              </div>
            </div>
          ) : filterWeekGroups(historyWeekGroups).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterWeekGroups(historyWeekGroups).map((group, index) =>
                renderWeekGroupCard(group, index),
              )}
            </div>
          ) : (
            renderEmptyState("No historical sessions found")
          )}
        </TabsContent>

        {/* Peer Managers Tab */}
        {isManager && (
          <TabsContent value="peer-managers" className="mt-6">
            {allLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Loading sessions...
                  </p>
                </div>
              </div>
            ) : filterSessions(peerManagerSessions).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSessions(peerManagerSessions).map(
                  (session: any, index: number) =>
                    renderSessionCard(session, index),
                )}
              </div>
            ) : (
              renderEmptyState("No peer manager sessions found")
            )}
          </TabsContent>
        )}

        {/* All Sessions Tab (Admin/HR) */}
        {isAdminOrHR && (
          <TabsContent value="all-sessions" className="mt-6">
            {allLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Loading sessions...
                  </p>
                </div>
              </div>
            ) : filterSessions(activeAllSessions).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSessions(activeAllSessions).map(
                  (session: any, index: number) =>
                    renderSessionCard(session, index),
                )}
              </div>
            ) : (
              renderEmptyState("No sessions found")
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
