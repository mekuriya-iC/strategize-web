import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import {
  getAccessToken,
  isTokenExpired,
  handleSessionExpired,
  refreshAccessToken,
} from "@/lib/auth-utils";
import { apolloLogger } from "@/lib/logger";
import { isExpectedGraphqlBusinessError } from "@/lib/graphql/error-classification";
import { paginatedResultPolicies } from "@/lib/graphql/paginatedResultPolicies";

// Browser requests stay on the current web origin. The Next.js route proxies
// them to the API, avoiding stale LAN addresses and browser CORS preflights.
const httpLink = createHttpLink({
  uri: "/api/graphql",
});

// Auth link - adds token to every request
const authLink = setContext(async (_, { headers }) => {
  let token = getAccessToken();

  // Check if token is expired before making request
  if (token && isTokenExpired(token)) {
    apolloLogger.warn("Token expired, attempting refresh...");

    // Try to refresh the token
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
    } else {
      // Refresh failed, will let the request fail and error link will handle it
      apolloLogger.warn("Token refresh failed, proceeding with expired token");
    }
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Error link - handles GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError, operation, response }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for "not found" errors - these are expected when data is deleted
      // Log as debug instead of error to reduce noise
      const isNotFoundError = err.message.toLowerCase().includes("not found");
      
      if (isNotFoundError) {
        apolloLogger.debug(
          `[GraphQL]: ${err.message} (Path: ${err.path?.join(".")})`,
          { operation: operation.operationName }
        );
        continue; // Skip further processing for not-found errors
      }

      // Skip logging errors if the mutation actually succeeded
      // This happens when there's a refetch race condition
      if (response?.data && operation.operationName?.toLowerCase().includes('create')) {
        apolloLogger.debug(
          `[GraphQL warning]: Operation succeeded but encountered validation on refetch: ${err.message}`,
          { operation: operation.operationName }
        );
        continue;
      }

      const operationName = operation.operationName || "UnknownOperation";
      if (isExpectedGraphqlBusinessError(err.message)) {
        apolloLogger.warn(
          `[GraphQL validation]: Operation: ${operationName}, Message: ${err.message}`,
          { operation: operationName },
        );
        continue;
      }

      apolloLogger.error(
        `[GraphQL error]: Operation: ${operationName}, Message: ${err.message}, Path: ${err.path?.join(".")}`,
        { operation: operationName },
      );

      // Check for authentication errors
      if (
        err.extensions?.code === "UNAUTHENTICATED" ||
        err.message.toLowerCase().includes("unauthorized") ||
        err.message.toLowerCase().includes("not authenticated") ||
        err.message.toLowerCase().includes("jwt expired")
      ) {
        apolloLogger.warn("Authentication error detected, redirecting to login");
        handleSessionExpired("Your session has expired. Please log in again.");
        return;
      }

      // Note: User-facing errors are now handled in the component's catch block
      // We no longer show global toasts here to avoid duplicate error messages
    }
  }

  if (networkError) {
    apolloLogger.error(`[Network error]: ${networkError.message}`);

    // Check for 401 Unauthorized
    if ("statusCode" in networkError && networkError.statusCode === 401) {
      apolloLogger.warn("401 Unauthorized, redirecting to login");
      handleSessionExpired("Your session has expired. Please log in again.");
      return;
    }

    // Check for network connectivity issues
    if (networkError.message === "Failed to fetch") {
      apolloLogger.error("Network connectivity issue - server may be down");
    }
  }
});

const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Employee: { keyFields: ["employeeId"] },
      Department: { keyFields: ["departmentId"] },
      Division: { keyFields: ["divisionId"] },
      Objective: { keyFields: ["objectiveId"] },
      Initiative: { keyFields: ["initiativeId"] },
      Activity: { keyFields: ["activityId"] },
      Submission: { keyFields: ["submissionId"] },
      Position: { keyFields: ["positionId"] },
      Team: { keyFields: ["teamId"] },
      Notification: { keyFields: ["notificationId"] },
      LogbookEntry: { keyFields: ["logbookEntryId"] },
      StrategicPeriod: { keyFields: ["strategicPeriodId"] },
      KpiUpdate: { keyFields: ["kpiUpdateId"] },
      KpiQuarterPlan: { keyFields: ["kpiQuarterPlanId"] },
      KpiQuarterResult: { keyFields: ["kpiQuarterResultId"] },
      CheckinoutTask: { keyFields: ["checkinoutTaskId"] },
      CheckinoutSchedule: { keyFields: ["scheduleId"] },
      CheckinoutScheduleWeek: { keyFields: ["scheduleWeekId"] },
      CheckinoutScheduleWeekCoverage: {
        keyFields: ["scheduleWeekCoverageId"],
      },
      ...paginatedResultPolicies,
      // KPI with all nested relationships properly merged
      Kpi: {
        keyFields: ["kpiId"],
        fields: {
          quarterPlans: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming; // Replace with fresh data from server
            },
          },
          quarterResults: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming; // Replace with fresh data from server
            },
          },
          logbookEntries: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming; // Replace with fresh data from server
            },
          },
          updates: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming; // Replace with fresh data from server
            },
          },
          sharedKpiParticipants: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming; // Replace with fresh data from server
            },
          },
        },
      },
      // CheckinoutSession with nested relationships
      CheckinoutSession: {
        keyFields: ["checkinoutSessionId"],
        fields: {
          tasks: {
            merge(_existing = [], incoming = []) {
              void _existing;
              return incoming;
            },
          },
        },
      },
      // Query root fields with cache invalidation strategy
      Query: {
        fields: {
          // User-specific queries should use cache-first for performance
          me: {
            read(existing, { canRead }) {
              return canRead(existing) ? existing : undefined;
            },
          },
          myFlaggedKpis: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          myFlaggedKpiCount: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          teamFlaggedKpis: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          teamFlaggedKpiCount: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          // Notification queries with proper merge
          notifications: {
            keyArgs: ["recipientId", "isRead"],
            merge(_existing, incoming) {
              return incoming;
            },
          },
          unreadNotificationCount: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          // Dashboard and performance queries - cache-friendly
          unifiedPerformance: {
            keyArgs: ["employeeId", "strategicPeriodId"],
            merge(_existing, incoming) {
              return incoming;
            },
          },
          teamUnifiedPerformance: {
            keyArgs: ["managerId", "strategicPeriodId"],
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      // Query fields intentionally use Apollo's default keyArgs behavior. Every
      // pagination and filter argument is part of the cache key, so pages and
      // filtered variants cannot overwrite one another.
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-first", // Prioritize cache for better performance
      nextFetchPolicy: "cache-first", // Keep using cache after initial load
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-first", // Use cache for fast initial loads in production
    },
    // Mutations must reject GraphQL errors. Using "all" here caused callers
    // to receive data: undefined and show success even when the API rejected
    // the write.
    mutate: {
      errorPolicy: "none",
      fetchPolicy: "network-only", // Ensure mutations always hit the network
    },
  },
});

export default apolloClient;
