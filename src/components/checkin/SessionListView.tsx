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
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  const isManager = ["MANAGER", "DIRECTOR", "ADMIN", "SUPER_ADMIN"].includes(
    currentUser?.role,
  );
  const isAdminOrHR = ["ADMIN", "SUPER_ADMIN", "HR"].includes(currentUser?.role);

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
    fetchPolicy: "cache-and-network",
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
    fetchPolicy: "cache-and-network",
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
      limit: 100,
    },
    skip: !isAdminOrHR,
    fetchPolicy: "cache-and-network",
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

  const teamSessions = (teamData?.checkinoutSessions?.items || []).filter(
    (s: any) =>
      s.employee && s.employee?.employeeId !== currentUser?.employeeId,
  );
  const ownSessions = (ownData?.checkinoutSessions?.items || []).filter(
    (s: any) => s.employee,
  );
  const allSessions = (allData?.checkinoutSessions?.items || []).filter(
    (s: any) => s.employee,
  );

  // Filter peer managers' sessions (managers who are employees in sessions)
  const peerManagerSessions = useMemo(() => {
    if (!isManager) return [];
    return allSessions.filter((session: any) => {
      const employeeRole = session.employee?.role;
      return (
        ["MANAGER", "DIRECTOR"].includes(employeeRole) &&
        session.employee?.employeeId !== currentUser?.employeeId
      );
    });
  }, [allSessions, isManager, currentUser?.employeeId]);

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
    const isLocked = session.isLocked || false;

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
                  <div title="Session is locked">
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
                Supervisor:{" "}
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
                This session is locked. No tasks can be added or edited.
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
            {isSessionOwner && (
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

  // Regular employee view (no tabs)
  if (!isManager) {
    const filteredSessions = filterSessions(ownSessions);

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

        {/* Sessions Grid */}
        {ownLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading sessions...</p>
            </div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session: any, index: number) =>
              renderSessionCard(session, index, false),
            )}
          </div>
        ) : (
          renderEmptyState("No check-in sessions found")
        )}
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
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger
            value="my-team"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            My Team ({teamSessions.length})
          </TabsTrigger>
          <TabsTrigger
            value="my-sessions"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
          >
            My Sessions ({ownSessions.length})
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
              All Sessions ({allSessions.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Team Tab */}
        <TabsContent value="my-team" className="mt-6">
          {teamLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Loading sessions...
                </p>
              </div>
            </div>
          ) : filterSessions(teamSessions).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterSessions(teamSessions).map((session: any, index: number) =>
                renderSessionCard(session, index),
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
          ) : filterSessions(ownSessions).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterSessions(ownSessions).map((session: any, index: number) =>
                renderSessionCard(session, index, false),
              )}
            </div>
          ) : (
            renderEmptyState("No personal sessions found")
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
            ) : filterSessions(allSessions).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSessions(allSessions).map(
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
