# Backend Integration Analysis & Implementation Plan

## 🔍 Schema Analysis

### Backend Endpoint
```
http://192.168.137.237:3000/graphql
```

### Current Frontend Status
- **Apollo Client**: ✅ Already configured with auth, error handling, and token refresh
- **Proxy Setup**: ✅ Using `/api/graphql` proxy to avoid CORS
- **GraphQL Structure**: ✅ Queries and mutations organized in separate folders
- **Mock Data**: ⚠️ Currently using mock/placeholder queries that don't match backend schema

---

## 📊 What's Already Implemented in Frontend

### ✅ 1. Check-In/Out Feature
**Frontend Status**: Fully implemented with mock data
**Backend Schema**: `CheckinoutSession` and `CheckinoutTask`

**Available Backend Types:**
```graphql
type CheckinoutSession {
  checkinoutSessionId: ID!
  employee: Employee!
  supervisor: Employee!
  strategicPeriod: StrategicPeriod!
  weekStartDate: String!
  weekEndDate: String!
  overallStatus: CheckinoutStatus!
  checkinSubmittedAt: DateTime
  checkoutSubmittedAt: DateTime
  supervisorReviewAt: DateTime
  supervisorComment: String
  overallRating: Float
}

type CheckinoutTask {
  checkinoutTaskId: ID!
  session: CheckinoutSession!
  taskTitle: String!
  taskLinkType: TaskLinkType!
  plannedDescription: String
  achievedDescription: String
  taskStatus: TaskStatus!
  evidenceUrl: String
  challenges: String
  nextSteps: String
  requiresApproval: Boolean!
  approvedBy: Employee
  approvedAt: DateTime
  autoRejectedAt: DateTime
}
```

**Mutations Available:**
- `createCheckinoutSession`
- `createCheckinoutTask`
- `updateCheckinoutSession`
- `updateCheckinoutTask`
- `removeCheckinoutSession`
- `removeCheckinoutTask`

**Queries Available:**
- `checkinoutSessions` (paginated)
- `checkinoutSession` (single)
- `checkinoutTasks` (paginated)
- `checkinoutTask` (single)

---

### ✅ 2. Logbook Feature
**Frontend Status**: Fully implemented with mock data
**Backend Schema**: `LogbookEntry`

**Available Backend Type:**
```graphql
type LogbookEntry {
  logbookEntryId: ID!
  owner: Employee!
  strategicPeriod: StrategicPeriod!
  entryDate: String!
  activityDescription: String!
  entryStatus: LogbookEntryStatus!
  kpiTargetValue: Float
  kpiAchievedValue: Float
  kpiCompletionPercent: Float
  evidenceUrl: String
  evidenceDescription: String
  decisionsMade: String
  risksIssues: String
  lessonsLearned: String
  submittedAt: DateTime
  approvedBy: Employee
  approvedAt: DateTime
  rejectionReason: String
}

enum LogbookEntryStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}
```

**Mutations Available:**
- `createLogbookEntry`
- `updateLogbookEntry`
- `removeLogbookEntry`

**Queries Available:**
- `logbookEntries` (paginated)
- `logbookEntry` (single)

---

### ✅ 3. Objectives Feature
**Frontend Status**: Partially implemented
**Backend Schema**: `Objective`

**Available Backend Type:**
```graphql
type Objective {
  objectiveId: ID!
  title: String!
  description: String
  level: ObjectiveLevel!
  type: ObjectiveType
  status: ObjectiveStatus!
  cascadeStatus: CascadeStatus!
  assigneeType: AssigneeType
  assigneeId: String
  assignerId: String
  ownerUser: Employee
  parent: Objective
  kpis: [Kpi!]
  strategicPeriod: StrategicPeriod!
  weight: Float
  dueDate: String
  approvedBy: Employee
  approvedAt: DateTime
}
```

---

### ✅ 4. KPI Management
**Frontend Status**: Partially implemented
**Backend Schema**: `Kpi`, `KpiUpdate`, `KpiAssignment*`

**Available Backend Types:**
```graphql
type Kpi {
  kpiId: ID!
  name: String!
  description: String
  kpiType: KpiType!
  measurementUnit: KpiMeasurementUnit!
  targetValue: Float!
  baseline: Float
  frequency: KpiFrequency!
  weight: Float
  status: KpiStatus
  targetStatus: KpiTargetStatus
  objective: Objective
  parent: Kpi
  targets: [KpiTarget!]
}

type KpiUpdate {
  kpiUpdateId: ID!
  kpi: Kpi!
  reportingDate: String!
  achievedValue: Float!
  progressPercentage: Float!
  progressStatus: KpiProgressStatus!
  evidenceUrl: String
  notes: String
  reportedBy: Employee!
  approvedBy: Employee
  approvedAt: DateTime
}
```

---

### ✅ 5. Approvals System
**Frontend Status**: Basic implementation
**Backend Schema**: `ApprovalWorkflow`, `Submission`

**Available Backend Types:**
```graphql
type ApprovalWorkflow {
  approvalWorkflowId: ID!
  entityType: String!
  entityId: ID!
  submittedBy: Employee!
  submittedAt: DateTime!
  reviewedBy: Employee
  reviewedAt: DateTime
  action: ApprovalAction!
  comments: String
}

type Submission {
  submissionId: ID!
  type: SubmissionType!
  level: SubmissionLevel!
  status: SubmissionStatus!
  objective: Objective
  kpi: Kpi
  submittedBy: Employee!
  actionedBy: Employee!
  reason: String
}
```

---

### ✅ 6. Organization Structure
**Frontend Status**: Implemented
**Backend Schema**: `Division`, `Department`, `Employee`

**Available Backend Types:**
```graphql
type Division {
  divisionId: ID!
  name: String!
  description: String
  head: Employee
  parentDivision: Division
  departments: [Department!]!
  isActive: Boolean!
}

type Department {
  departmentId: ID!
  name: String!
  description: String
  division: Division
  head: Employee
  employees: [Employee!]!
  isActive: Boolean!
}

type Employee {
  employeeId: ID!
  fullName: String!
  email: String!
  role: EmployeeRole!
  status: EmployeeStatus!
  title: String!
  phoneNumber: String!
  picture: String!
  departments: [Department!]!
}
```

---

## 🔧 Integration Steps

### Step 1: Configure Apollo Client

**File**: `src/lib/apollo-client.ts`

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://192.168.137.237:3000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Get token from localStorage or cookie
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          objectives: {
            keyArgs: ['organizationId', 'assigneeId'],
            merge(existing, incoming, { args }) {
              if (!existing) return incoming;
              if (args?.page === 1) return incoming;
              
              return {
                ...incoming,
                items: [...existing.items, ...incoming.items],
              };
            },
          },
          // Add similar policies for other paginated queries
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

---

### Step 2: Update Environment Variables

**File**: `.env.local`

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://192.168.137.237:3000/graphql
NEXT_PUBLIC_API_URL=http://192.168.137.237:3000
```

---

### Step 3: Update GraphQL Queries for Check-In

**File**: `src/lib/graphql/queries/checkins.ts`

```typescript
import { gql } from '@apollo/client';

export const GET_MY_CHECKINS = gql`
  query GetMyCheckins($limit: Int!, $page: Int!, $employeeUserId: ID, $strategicPeriodId: ID) {
    checkinoutSessions(
      limit: $limit
      page: $page
      employeeUserId: $employeeUserId
      strategicPeriodId: $strategicPeriodId
    ) {
      items {
        checkinoutSessionId
        weekStartDate
        weekEndDate
        overallStatus
        checkinSubmittedAt
        checkoutSubmittedAt
        overallRating
        supervisorComment
        supervisorReviewAt
        employee {
          employeeId
          fullName
          email
        }
        supervisor {
          employeeId
          fullName
        }
        strategicPeriod {
          strategicPeriodId
          name
        }
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
      }
    }
  }
`;

export const GET_CHECKIN_TASKS = gql`
  query GetCheckinTasks($sessionId: ID!, $limit: Int!, $page: Int!) {
    checkinoutTasks(sessionId: $sessionId, limit: $limit, page: $page) {
      items {
        checkinoutTaskId
        taskTitle
        taskLinkType
        plannedDescription
        achievedDescription
        taskStatus
        evidenceUrl
        challenges
        nextSteps
        requiresApproval
        approvedAt
        approvedBy {
          employeeId
          fullName
        }
        createdAt
        updatedAt
      }
      meta {
        currentPage
        totalPages
        totalItems
      }
    }
  }
`;
```

---

### Step 4: Update GraphQL Mutations for Check-In

**File**: `src/lib/graphql/mutations/checkins.ts`

```typescript
import { gql } from '@apollo/client';

export const CREATE_CHECKIN_SESSION = gql`
  mutation CreateCheckinSession($input: CreateCheckinoutSessionInput!) {
    createCheckinoutSession(createCheckinoutSessionInput: $input) {
      checkinoutSessionId
      weekStartDate
      weekEndDate
      overallStatus
    }
  }
`;

export const CREATE_CHECKIN_TASK = gql`
  mutation CreateCheckinTask($input: CreateCheckinoutTaskInput!) {
    createCheckinoutTask(createCheckinoutTaskInput: $input) {
      checkinoutTaskId
      taskTitle
      taskLinkType
      taskStatus
      plannedDescription
    }
  }
`;

export const UPDATE_CHECKIN_TASK = gql`
  mutation UpdateCheckinTask($input: UpdateCheckinoutTaskInput!) {
    updateCheckinoutTask(updateCheckinoutTaskInput: $input) {
      checkinoutTaskId
      taskTitle
      achievedDescription
      taskStatus
    }
  }
`;

export const DELETE_CHECKIN_TASK = gql`
  mutation DeleteCheckinTask($checkinoutTaskId: ID!) {
    removeCheckinoutTask(checkinoutTaskId: $checkinoutTaskId) {
      checkinoutTaskId
    }
  }
`;
```

---

### Step 5: Update Logbook Queries

**File**: `src/lib/graphql/queries/logbook.ts`

```typescript
import { gql } from "@apollo/client";

export const GET_MY_LOGBOOK = gql`
  query GetMyLogbook($limit: Int!, $page: Int!, $ownerUserId: ID, $strategicPeriodId: ID, $entryStatus: LogbookEntryStatus) {
    logbookEntries(
      limit: $limit
      page: $page
      ownerUserId: $ownerUserId
      strategicPeriodId: $strategicPeriodId
      entryStatus: $entryStatus
    ) {
      items {
        logbookEntryId
        entryDate
        activityDescription
        entryStatus
        kpiTargetValue
        kpiAchievedValue
        kpiCompletionPercent
        evidenceUrl
        evidenceDescription
        decisionsMade
        risksIssues
        lessonsLearned
        submittedAt
        approvedAt
        rejectionReason
        owner {
          employeeId
          fullName
          email
        }
        approvedBy {
          employeeId
          fullName
        }
        strategicPeriod {
          strategicPeriodId
          name
        }
        createdAt
        updatedAt
      }
      meta {
        currentPage
        totalPages
        totalItems
        itemsPerPage
      }
    }
  }
`;

export const GET_LOGBOOK_ENTRY = gql`
  query GetLogbookEntry($logbookEntryId: ID!) {
    logbookEntry(logbookEntryId: $logbookEntryId) {
      logbookEntryId
      entryDate
      activityDescription
      entryStatus
      kpiTargetValue
      kpiAchievedValue
      kpiCompletionPercent
      evidenceUrl
      evidenceDescription
      decisionsMade
      risksIssues
      lessonsLearned
      submittedAt
      approvedAt
      rejectionReason
      owner {
        employeeId
        fullName
      }
      approvedBy {
        employeeId
        fullName
      }
      createdAt
      updatedAt
    }
  }
`;
```

---

### Step 6: Update Logbook Mutations

**File**: `src/lib/graphql/mutations/logbook.ts`

```typescript
import { gql } from "@apollo/client";

export const CREATE_LOGBOOK_ENTRY = gql`
  mutation CreateLogbookEntry($input: CreateLogbookEntryInput!) {
    createLogbookEntry(createLogbookEntryInput: $input) {
      logbookEntryId
      entryDate
      activityDescription
      entryStatus
      kpiTargetValue
      kpiAchievedValue
      kpiCompletionPercent
    }
  }
`;

export const UPDATE_LOGBOOK_ENTRY = gql`
  mutation UpdateLogbookEntry($input: UpdateLogbookEntryInput!) {
    updateLogbookEntry(updateLogbookEntryInput: $input) {
      logbookEntryId
      entryStatus
      submittedAt
    }
  }
`;

export const SUBMIT_FOR_APPROVAL = gql`
  mutation SubmitLogbookForApproval($input: UpdateLogbookEntryInput!) {
    updateLogbookEntry(updateLogbookEntryInput: $input) {
      logbookEntryId
      entryStatus
      submittedAt
    }
  }
`;

export const DELETE_LOGBOOK_ENTRY = gql`
  mutation DeleteLogbookEntry($logbookEntryId: ID!) {
    removeLogbookEntry(logbookEntryId: $logbookEntryId) {
      logbookEntryId
    }
  }
`;
```

---

### Step 7: Create Authentication Hook

**File**: `src/hooks/auth/useAuth.ts`

```typescript
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { LOGIN_EMPLOYEE } from '@/lib/graphql/mutations/auth';

export function useAuth() {
  const router = useRouter();
  const [loginMutation, { loading, error }] = useMutation(LOGIN_EMPLOYEE);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: {
          loginInput: { email, password },
        },
      });

      if (data?.loginEmployee) {
        // Store token
        localStorage.setItem('accessToken', data.loginEmployee.accessToken);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify(data.loginEmployee.employee));
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        return data.loginEmployee;
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/auth');
  };

  const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  return {
    login,
    logout,
    getCurrentUser,
    loading,
    error,
  };
}
```

---

### Step 8: Create Auth Mutations

**File**: `src/lib/graphql/mutations/auth.ts`

```typescript
import { gql } from '@apollo/client';

export const LOGIN_EMPLOYEE = gql`
  mutation LoginEmployee($loginInput: LoginEmployeeInput!) {
    loginEmployee(loginInput: $loginInput) {
      accessToken
      employee {
        employeeId
        fullName
        email
        role
        status
        title
        phoneNumber
        picture
        departments {
          departmentId
          name
        }
      }
    }
  }
`;
```

---

### Step 9: Update Check-In Page to Use Real Data

**File**: `src/app/dashboard/checkin/page.tsx` (Update)

```typescript
// Replace mock data toggle with real data
const { data, loading, refetch } = useQuery(GET_MY_CHECKINS, {
  variables: {
    limit: 10,
    page: 1,
    employeeUserId: currentUser?.employeeId,
    strategicPeriodId: currentPeriod?.strategicPeriodId,
  },
  skip: !currentUser,
});

// Remove useMockData state and use real data
const currentWeekData = useMemo(() => {
  if (!data?.checkinoutSessions?.items || data.checkinoutSessions.items.length === 0) {
    return null;
  }
  return data.checkinoutSessions.items[0];
}, [data]);
```

---

### Step 10: Update Logbook Page to Use Real Data

**File**: `src/app/dashboard/logbook/page.tsx` (Update)

```typescript
const { data, loading, refetch } = useQuery(GET_MY_LOGBOOK, {
  variables: {
    limit: itemsPerPage,
    page: currentPage,
    ownerUserId: currentUser?.employeeId,
    strategicPeriodId: currentPeriod?.strategicPeriodId,
  },
  skip: !currentUser,
});

const logbookData = useMemo(() => {
  return data?.logbookEntries?.items || [];
}, [data]);
```

---

## 📝 Implementation Checklist

### Phase 1: Setup (Week 1)
- [ ] Configure Apollo Client with authentication
- [ ] Set up environment variables
- [ ] Create authentication hooks and mutations
- [ ] Implement login/logout functionality
- [ ] Test GraphQL connection

### Phase 2: Check-In Integration (Week 2)
- [ ] Update check-in queries with real schema
- [ ] Update check-in mutations
- [ ] Remove mock data from check-in page
- [ ] Connect create/update/delete operations
- [ ] Test check-in workflow end-to-end

### Phase 3: Logbook Integration (Week 3)
- [ ] Update logbook queries
- [ ] Update logbook mutations
- [ ] Remove mock data from logbook page
- [ ] Connect submit for approval
- [ ] Test logbook workflow

### Phase 4: Objectives & KPIs (Week 4)
- [ ] Update objectives queries
- [ ] Update KPI queries and mutations
- [ ] Connect assignment workflows
- [ ] Test cascading and approvals

### Phase 5: Organization Structure (Week 5)
- [ ] Update division/department queries
- [ ] Update employee queries
- [ ] Connect org structure builder
- [ ] Test hierarchy management

### Phase 6: Testing & Optimization (Week 6)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation updates

---

## 🚀 Quick Start Commands

```bash
# Install additional dependencies
npm install @apollo/client graphql

# Set up environment
cp .env.example .env.local
# Edit .env.local with backend URL

# Test GraphQL connection
npm run dev
# Navigate to /dashboard and check console
```

---

## 📚 Additional Resources

### GraphQL Playground
Access at: `http://192.168.137.237:3000/graphql`

### Schema Documentation
All types, queries, and mutations are documented in the schema above.

### Testing Queries
Use GraphQL Playground to test queries before implementing in frontend.

---

## ⚠️ Important Notes

1. **Authentication**: Backend uses JWT tokens - store securely
2. **Pagination**: All list queries support pagination - use meta fields
3. **Permissions**: Check user role before showing UI elements
4. **Error Handling**: Implement proper error boundaries
5. **Loading States**: Show loading indicators for better UX
6. **Optimistic Updates**: Use Apollo's optimistic responses for instant feedback

---

## 🔗 Next Steps

1. Review this document with the team
2. Set up development environment
3. Start with Phase 1 (Setup)
4. Test each phase before moving to next
5. Document any issues or changes needed

