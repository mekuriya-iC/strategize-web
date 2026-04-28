# 📊 Strategize Web Application - Complete Project Analysis & Implementation Plan

**Date**: April 27, 2026  
**Project**: Strategize Web (Frontend)  
**Backend API**: GraphQL @ https://strategize-api.frontiertech.org  
**Status**: Frontend Implemented, Backend Integration Needed

---

## 🎯 Executive Summary

**Strategize** is an enterprise strategic planning and performance management platform built with:
- **Frontend**: Next.js 16 (App Router), TypeScript, Apollo Client, Tailwind CSS
- **Backend**: GraphQL API with comprehensive schema (60+ types, 100+ queries, 150+ mutations)
- **State**: Zustand for global state management
- **Auth**: JWT-based authentication with automatic token refresh

### Current Status
✅ **Frontend**: 90% complete with UI components and mock data  
⚠️ **Backend Integration**: 20% complete - needs GraphQL query/mutation implementation  
🔄 **Next Steps**: Replace mock data with real GraphQL operations

---

## 📁 Project Structure Analysis

### Directory Overview
```
strategize-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Authentication pages (login, forgot password, reset)
│   │   ├── dashboard/          # Main application dashboard
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── approvals/      # Approval workflows
│   │   │   ├── checkin/        # Check-in/out feature ✅
│   │   │   ├── departments/    # Department management
│   │   │   ├── divisions/      # Division management
│   │   │   ├── employees/      # Employee management
│   │   │   ├── logbook/        # Logbook entries ✅
│   │   │   ├── objectives/     # Strategic objectives
│   │   │   ├── reports/        # Reports & analytics
│   │   │   ├── settings/       # User settings
│   │   │   └── structure/      # Org structure builder
│   │   ├── org-structure/      # Organization setup wizard
│   │   └── strategy-period/    # Strategic period management
│   ├── components/             # React components (organized by feature)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core utilities & Apollo client
│   ├── stores/                 # Zustand state stores
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── docs/                       # Comprehensive documentation
├── scripts/                    # Build & utility scripts
└── public/                     # Static assets
```

---

## 🗄️ Backend GraphQL Schema Overview

### Core Entities (60+ Types)

#### 1. **Organization Structure**
- `Organization` - Company/organization entity
- `Division` - Top-level organizational units
- `Department` - Sub-units within divisions
- `Team` - Cross-functional teams
- `Employee` - User accounts with roles
- `Position` - Job positions/titles

#### 2. **Strategic Planning**
- `StrategicPlan` - Multi-year strategic plans
- `StrategicPeriod` - Time periods (annual, quarterly, monthly)
- `StrategicPillar` - Strategic themes/pillars
- `Objective` - Strategic objectives (corporate, division, department, individual)
- `Initiative` - Action items to achieve objectives

#### 3. **Performance Management**
- `Kpi` - Key Performance Indicators
- `KpiUpdate` - Progress updates on KPIs
- `KpiAssignmentDepartment` - KPI assignments to departments
- `KpiAssignmentDivision` - KPI assignments to divisions
- `KpiAssignmentEmployee` - KPI assignments to employees
- `SharedKpiParticipant` - Shared KPI contributors

#### 4. **Check-In/Out System** ✅
- `CheckinoutSession` - Weekly check-in sessions
- `CheckinoutTask` - Tasks within check-in sessions
- Task linking to objectives, KPIs, initiatives

#### 5. **Logbook** ✅
- `LogbookEntry` - Daily/weekly activity logs
- Evidence tracking
- Approval workflows

#### 6. **Approvals & Submissions**
- `ApprovalWorkflow` - Generic approval system
- `Submission` - Objective/KPI submissions
- Multi-level approval chains

#### 7. **Competency Management**
- `CoreCompetency` - Organization-wide competencies
- `Competency` - Specific competency definitions
- `CompetencyIndicator` - Measurable indicators
- `CompetencyAssessment` - Employee assessments
- `CompetencyPositionAssignment` - Position requirements

#### 8. **Evaluation System**
- `EvaluationCycle` - Performance review cycles
- `EvaluationWeightConfig` - Scoring weights
- `AggregatePerformanceResult` - Computed scores

#### 9. **Access Control**
- `Role` - User roles (system & custom)
- `PermissionDefinition` - Granular permissions
- `RolePermission` - Role-permission mappings
- `UserRoleAssignment` - User-role assignments
- `UserPermissionOverride` - Individual permission overrides

#### 10. **Audit & Logging**
- `ActivityLog` - System activity tracking
- `AuditLog` - Audit trail
- `RoleAuditLog` - Role change history
- `Notification` - User notifications

#### 11. **File Management**
- `FileAttachment` - Document attachments
- Evidence uploads
- Public/private file access

#### 12. **System Configuration**
- `SystemConfiguration` - Organization settings
- Check-in/out schedules
- Rating scales
- Feature toggles

---

## 🔍 Implementation Status by Feature

### ✅ **Fully Implemented (Frontend + UI)**

#### 1. Check-In/Out System
**Location**: `src/app/dashboard/checkin/`  
**Components**: 
- `CheckinWeekView.tsx` - Weekly task view
- `AddTaskDialog.tsx` - Task creation
- `TaskCard.tsx` - Individual task display
- `CheckinSummary.tsx` - Week summary

**Status**: 
- ✅ UI Complete
- ✅ Mock data working
- ⚠️ Needs GraphQL integration

**Backend Schema Available**:
```graphql
type CheckinoutSession {
  checkinoutSessionId: ID!
  employee: Employee!
  supervisor: Employee!
  weekStartDate: String!
  weekEndDate: String!
  overallStatus: CheckinoutStatus!
  checkinSubmittedAt: DateTime
  checkoutSubmittedAt: DateTime
}

type CheckinoutTask {
  checkinoutTaskId: ID!
  taskTitle: String!
  taskLinkType: TaskLinkType!
  plannedDescription: String
  achievedDescription: String
  taskStatus: TaskStatus!
  evidenceUrl: String
  challenges: String
  nextSteps: String
}
```

**Required Mutations**:
- `createCheckinoutSession`
- `createCheckinoutTask`
- `updateCheckinoutTask`
- `removeCheckinoutTask`

**Required Queries**:
- `checkinoutSessions(employeeUserId, strategicPeriodId, limit, page)`
- `checkinoutTasks(sessionId, limit, page)`

---

#### 2. Logbook System
**Location**: `src/app/dashboard/logbook/`  
**Components**:
- `LogbookTable.tsx` - Entry list
- `LogbookEntryDialog.tsx` - Create/edit entries
- `LogbookFilters.tsx` - Filtering options

**Status**:
- ✅ UI Complete
- ✅ Mock data working
- ⚠️ Needs GraphQL integration

**Backend Schema Available**:
```graphql
type LogbookEntry {
  logbookEntryId: ID!
  owner: Employee!
  entryDate: String!
  activityDescription: String!
  entryStatus: LogbookEntryStatus!
  kpiTargetValue: Float
  kpiAchievedValue: Float
  evidenceUrl: String
  decisionsMade: String
  risksIssues: String
  lessonsLearned: String
  submittedAt: DateTime
  approvedBy: Employee
  approvedAt: DateTime
}
```

**Required Mutations**:
- `createLogbookEntry`
- `updateLogbookEntry`
- `removeLogbookEntry`

**Required Queries**:
- `logbookEntries(ownerUserId, strategicPeriodId, entryStatus, limit, page)`
- `logbookEntry(logbookEntryId)`

---

### 🔄 **Partially Implemented**

#### 3. Objectives Management
**Location**: `src/app/dashboard/objectives/`  
**Status**:
- ✅ List view implemented
- ✅ Create/edit forms
- ⚠️ Cascading logic needs backend
- ⚠️ Approval workflow needs backend

**Backend Schema**:
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
  parent: Objective
  kpis: [Kpi!]
  weight: Float
  dueDate: String
}
```

**Required Implementation**:
- Cascading objectives (parent-child relationships)
- Approval workflows
- KPI assignment to objectives
- Progress tracking

---

#### 4. KPI Management
**Location**: Integrated in objectives  
**Status**:
- ✅ Basic CRUD UI
- ⚠️ Assignment logic needs backend
- ⚠️ Update tracking needs backend
- ⚠️ Shared KPI participants needs backend

**Backend Schema**:
```graphql
type Kpi {
  kpiId: ID!
  name: String!
  kpiType: KpiType!
  measurementUnit: KpiMeasurementUnit!
  targetValue: Float!
  frequency: KpiFrequency!
  status: KpiStatus
  targets: [KpiTarget!]
}

type KpiUpdate {
  kpiUpdateId: ID!
  reportingDate: String!
  achievedValue: Float!
  progressPercentage: Float!
  progressStatus: KpiProgressStatus!
}
```

---

#### 5. Organization Structure
**Location**: `src/app/dashboard/structure/`  
**Status**:
- ✅ Visual org chart
- ✅ Division/Department CRUD
- ⚠️ Employee assignment needs backend
- ⚠️ Hierarchy management needs backend

**Backend Schema**:
```graphql
type Division {
  divisionId: ID!
  name: String!
  head: Employee
  parentDivision: Division
  departments: [Department!]!
}

type Department {
  departmentId: ID!
  name: String!
  division: Division
  head: Employee
  employees: [Employee!]!
}
```

---

#### 6. Approvals System
**Location**: `src/app/dashboard/approvals/`  
**Status**:
- ✅ Approval queue UI
- ⚠️ Workflow engine needs backend
- ⚠️ Multi-level approvals needs backend

**Backend Schema**:
```graphql
type ApprovalWorkflow {
  approvalWorkflowId: ID!
  entityType: String!
  entityId: ID!
  submittedBy: Employee!
  reviewedBy: Employee
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
}
```

---

### ❌ **Not Implemented**

#### 7. Reports & Analytics
**Location**: `src/app/dashboard/reports/`  
**Status**: Placeholder only

**Backend Capabilities**:
- Performance aggregation
- KPI progress reports
- Objective completion rates
- Department/Division comparisons

**Required Implementation**:
- Chart components (Chart.js already installed)
- Data aggregation queries
- Export functionality
- Custom report builder

---

#### 8. Competency Management
**Location**: Not started  
**Backend Schema Available**:
```graphql
type Competency {
  competencyId: ID!
  name: String!
  description: String
  coreCompetency: CoreCompetency!
}

type CompetencyAssessment {
  competencyAssessmentId: ID!
  evaluatee: Employee!
  evaluator: Employee!
  evaluationCycle: EvaluationCycle!
  status: EvaluationStatus!
}
```

**Required Implementation**:
- Competency library UI
- Assessment forms
- Position-competency mapping
- Evaluation workflows

---

#### 9. Evaluation Cycles
**Location**: Not started  
**Backend Schema Available**:
```graphql
type EvaluationCycle {
  evaluationCycleId: ID!
  name: String!
  startDate: String!
  endDate: String!
  status: EvaluationCycleStatus!
}

type AggregatePerformanceResult {
  aggregateScore: Float!
  individualKpiScore: Float
  sharedKpiScore: Float
  competencyScore: Float
}
```

**Required Implementation**:
- Cycle management UI
- Weight configuration
- Score calculation display
- Performance dashboards

---

#### 10. Admin Panel
**Location**: `src/app/dashboard/admin/`  
**Status**: Basic structure only

**Required Implementation**:
- User management
- Role management
- Permission configuration
- System settings
- Audit log viewer

---

## 🔧 Technical Implementation Details

### Apollo Client Configuration

**File**: `src/lib/apollo-client.ts`

**Current Setup**:
- ✅ HTTP link configured
- ✅ Auth link with JWT token
- ✅ Error handling link
- ✅ Token refresh logic
- ✅ Cache policies for pagination

**Proxy Configuration**:
```typescript
// Uses Next.js API route as proxy
uri: "/api/graphql"

// Proxies to backend
// Configured in next.config.ts
```

---

### Authentication Flow

**Current Implementation**:
1. User enters credentials
2. `loginEmployee` mutation called
3. JWT token stored in cookie
4. Token attached to all GraphQL requests
5. Automatic refresh before expiration
6. Redirect to login on 401/UNAUTHENTICATED

**Files**:
- `src/lib/auth-utils.ts` - Token management
- `src/stores/authStore.ts` - Auth state
- `src/hooks/auth/useAuth.ts` - Auth hook

---

### State Management (Zustand)

**Stores**:
1. **authStore** - User session, permissions
2. **orgUnitStore** - Selected division/department
3. **strategicPeriodStore** - Active period
4. **uiStore** - Sidebar, loading states
5. **cacheStore** - Client-side caching

**Usage Pattern**:
```typescript
import { useAuthStore } from '@/stores';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

---

### GraphQL Code Generation

**Tool**: GraphQL Code Generator  
**Config**: `codegen.ts`

**Process**:
1. Fetch schema from backend
2. Generate TypeScript types
3. Generate React hooks
4. Create type-safe queries/mutations

**Commands**:
```bash
pnpm run schema:fetch      # Fetch + generate
pnpm run schema:generate   # Generate only
pnpm run schema:clean      # Clean old files
```

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Establish backend connectivity and authentication

**Tasks**:
1. ✅ Configure environment variables
2. ✅ Test GraphQL endpoint connectivity
3. ✅ Implement login/logout
4. ✅ Set up token refresh
5. ✅ Create auth guards for routes
6. ✅ Test authentication flow

**Deliverables**:
- Working login system
- Protected dashboard routes
- Token management
- Error handling

---

### Phase 2: Check-In System (Week 3-4)
**Goal**: Replace mock data with real GraphQL operations

**Tasks**:
1. Create GraphQL queries:
   - `GET_MY_CHECKINS`
   - `GET_CHECKIN_TASKS`
   - `GET_CHECKIN_SESSION`

2. Create GraphQL mutations:
   - `CREATE_CHECKIN_SESSION`
   - `CREATE_CHECKIN_TASK`
   - `UPDATE_CHECKIN_TASK`
   - `DELETE_CHECKIN_TASK`
   - `SUBMIT_CHECKIN`

3. Update components:
   - Remove mock data toggle
   - Connect to real queries
   - Handle loading states
   - Handle errors
   - Implement optimistic updates

4. Test workflows:
   - Create weekly session
   - Add tasks
   - Link to objectives/KPIs
   - Submit for review
   - Supervisor approval

**Files to Update**:
- `src/app/dashboard/checkin/page.tsx`
- `src/components/checkin/CheckinWeekView.tsx`
- `src/components/checkin/AddTaskDialog.tsx`
- `src/components/checkin/TaskCard.tsx`

---

### Phase 3: Logbook System (Week 5-6)
**Goal**: Implement full logbook functionality

**Tasks**:
1. Create GraphQL queries:
   - `GET_MY_LOGBOOK`
   - `GET_LOGBOOK_ENTRY`
   - `GET_LOGBOOK_STATS`

2. Create GraphQL mutations:
   - `CREATE_LOGBOOK_ENTRY`
   - `UPDATE_LOGBOOK_ENTRY`
   - `DELETE_LOGBOOK_ENTRY`
   - `SUBMIT_FOR_APPROVAL`

3. Update components:
   - Connect to real data
   - Implement filtering
   - Add evidence upload
   - Implement approval workflow

4. Test workflows:
   - Create entry
   - Link to KPIs/objectives
   - Upload evidence
   - Submit for approval
   - Approval/rejection

**Files to Update**:
- `src/app/dashboard/logbook/page.tsx`
- `src/components/logbook/LogbookTable.tsx`
- `src/components/logbook/LogbookEntryDialog.tsx`

---

### Phase 4: Objectives & KPIs (Week 7-10)
**Goal**: Implement strategic planning features

**Tasks**:
1. Objectives:
   - CRUD operations
   - Cascading logic
   - Assignment workflows
   - Approval workflows
   - Progress tracking

2. KPIs:
   - CRUD operations
   - Assignment to objectives
   - Target setting
   - Progress updates
   - Shared KPI management

3. Integration:
   - Link objectives to KPIs
   - Link to check-ins
   - Link to logbook
   - Approval chains

**Files to Update**:
- `src/app/dashboard/objectives/`
- `src/components/objectives/`
- Create KPI-specific components

---

### Phase 5: Organization Structure (Week 11-12)
**Goal**: Implement org structure management

**Tasks**:
1. Division management
2. Department management
3. Employee assignment
4. Hierarchy visualization
5. Org chart builder

**Files to Update**:
- `src/app/dashboard/structure/`
- `src/app/dashboard/divisions/`
- `src/app/dashboard/departments/`
- `src/app/dashboard/employees/`

---

### Phase 6: Approvals System (Week 13-14)
**Goal**: Implement approval workflows

**Tasks**:
1. Approval queue
2. Multi-level approvals
3. Delegation
4. Notifications
5. Audit trail

**Files to Update**:
- `src/app/dashboard/approvals/`
- `src/components/approvals/`

---

### Phase 7: Reports & Analytics (Week 15-16)
**Goal**: Implement reporting features

**Tasks**:
1. Performance dashboards
2. KPI progress reports
3. Objective completion
4. Department comparisons
5. Export functionality

**Files to Create**:
- `src/components/reports/`
- Chart components
- Export utilities

---

### Phase 8: Advanced Features (Week 17-20)
**Goal**: Implement remaining features

**Tasks**:
1. Competency management
2. Evaluation cycles
3. Admin panel
4. System configuration
5. Audit logs

---

### Phase 9: Testing & Optimization (Week 21-22)
**Goal**: Ensure quality and performance

**Tasks**:
1. Unit tests
2. Integration tests
3. E2E tests
4. Performance optimization
5. Security audit
6. Accessibility audit

---

### Phase 10: Documentation & Deployment (Week 23-24)
**Goal**: Prepare for production

**Tasks**:
1. API documentation
2. User guides
3. Admin guides
4. Deployment scripts
5. Monitoring setup
6. Production deployment

---

## 🎯 Priority Order for Implementation

### High Priority (Must Have)
1. ✅ Authentication & Authorization
2. 🔄 Check-In/Out System
3. 🔄 Logbook System
4. 🔄 Objectives Management
5. 🔄 KPI Management
6. 🔄 Organization Structure

### Medium Priority (Should Have)
7. Approvals System
8. Employee Management
9. Department/Division Management
10. Strategic Period Management

### Low Priority (Nice to Have)
11. Reports & Analytics
12. Competency Management
13. Evaluation Cycles
14. Admin Panel
15. Audit Logs

---

## 📊 GraphQL Schema Statistics

### Types
- **Total Types**: 60+
- **Input Types**: 50+
- **Enums**: 25+
- **Scalars**: 2 (DateTime, ID)

### Operations
- **Queries**: 100+
- **Mutations**: 150+
- **Subscriptions**: 0 (not implemented)

### Pagination
- All list queries support pagination
- Standard pagination meta:
  ```graphql
  type PaginationMeta {
    currentPage: Int!
    totalPages: Int!
    totalItems: Int!
    itemsPerPage: Int!
    itemCount: Int!
  }
  ```

---

## 🔐 Authentication & Authorization

### Roles
```graphql
enum EmployeeRole {
  SUPER_ADMIN
  ADMIN
  DIRECTOR
  MANAGER
  COORDINATOR
  NORMAL
}
```

### Permission System
- **Modules**: 18 system modules
- **Actions**: 11 permission actions (CREATE, READ, UPDATE, DELETE, APPROVE, etc.)
- **Scopes**: 6 permission scopes (OWN, TEAM, DEPARTMENT, DIVISION, ORGANIZATION, PLATFORM)

### Implementation
- Role-based access control (RBAC)
- Permission overrides per user
- Custom roles support
- Audit logging for all actions

---

## 🚀 Quick Start for Backend Integration

### 1. Environment Setup
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
GRAPHQL_SCHEMA_URL=https://strategize-api.frontiertech.org/graphql
```

### 2. Generate Schema
```bash
pnpm run schema:fetch
```

### 3. Test Connection
```typescript
// Test in browser console
fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: '{ __typename }'
  })
}).then(r => r.json()).then(console.log)
```

### 4. Implement First Query
```typescript
// src/lib/graphql/queries/test.ts
import { gql } from '@apollo/client';

export const GET_ME = gql`
  query GetMe {
    me {
      employeeId
      fullName
      email
      role
    }
  }
`;

// Use in component
const { data, loading } = useQuery(GET_ME);
```

---

## 📝 Development Guidelines

### GraphQL Best Practices
1. **Always use fragments** for reusable fields
2. **Implement pagination** for all lists
3. **Handle loading states** properly
4. **Implement error boundaries**
5. **Use optimistic updates** for better UX
6. **Cache management** - invalidate on mutations

### Code Organization
```
src/lib/graphql/
├── fragments/
│   ├── employee.ts
│   ├── objective.ts
│   └── kpi.ts
├── queries/
│   ├── checkins.ts
│   ├── logbook.ts
│   └── objectives.ts
└── mutations/
    ├── checkins.ts
    ├── logbook.ts
    └── objectives.ts
```

### Testing Strategy
1. **Unit Tests**: Individual components
2. **Integration Tests**: GraphQL operations
3. **E2E Tests**: Complete workflows
4. **Performance Tests**: Load testing

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution**: Use Next.js API proxy (`/api/graphql`)

### Issue 2: Token Expiration
**Solution**: Implemented automatic refresh in `auth-utils.ts`

### Issue 3: Cache Inconsistency
**Solution**: Proper cache policies in Apollo Client config

### Issue 4: Pagination Issues
**Solution**: Use `keyArgs` in cache policies

### Issue 5: Optimistic Updates
**Solution**: Implement optimistic response in mutations

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Apollo Client Docs](https://www.apollographql.com/docs/react)
- [GraphQL Docs](https://graphql.org/learn)
- [Zustand Docs](https://github.com/pmndrs/zustand)

### Internal Docs
- `docs/getting-started/START_HERE.md`
- `docs/schema-generation/QUICK_START.md`
- `BACKEND_INTEGRATION_ANALYSIS.md`

---

## ✅ Next Steps

1. **Review this document** with the development team
2. **Set up development environment** with backend access
3. **Start with Phase 1** (Authentication)
4. **Implement Phase 2** (Check-In System)
5. **Test thoroughly** before moving to next phase
6. **Document any issues** or schema changes needed

---

## 📞 Support

For questions or issues:
1. Check the `docs/` directory
2. Review `BACKEND_INTEGRATION_ANALYSIS.md`
3. Test queries in GraphQL Playground
4. Check Apollo Client DevTools

---

**Last Updated**: April 27, 2026  
**Version**: 1.0  
**Status**: Ready for Backend Integration
