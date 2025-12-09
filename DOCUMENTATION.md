# Strategize Web Application - Technical Documentation

**Version:** 0.1.0  
**Last Updated:** December 2025  
**Powered by:** iCapital Africa / FrontierTech

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder & File Structure](#2-folder--file-structure)
3. [Frontend Documentation](#3-frontend-documentation)
4. [Backend Documentation](#4-backend-documentation)
5. [Database Structure](#5-database-structure)
6. [API Documentation](#6-api-documentation)
7. [Environment Variables](#7-environment-variables)
8. [Setup & Installation Guide](#8-setup--installation-guide)
9. [Deployment Instructions](#9-deployment-instructions)
10. [Testing](#10-testing)
11. [Coding Guidelines & Conventions](#11-coding-guidelines--conventions)
12. [Common Issues & Debugging Guide](#12-common-issues--debugging-guide)

---

## 1. Project Overview

### What the App Does

**Strategize** is an enterprise strategic planning and performance management platform designed to help organizations:

- **Define Strategic Periods**: Create and manage multi-year strategic planning cycles
- **Manage Organizational Objectives**: Set corporate, division, department, and personnel-level objectives
- **Track Key Performance Indicators (KPIs)**: Define, assign, and monitor KPIs with quarterly/annual targets
- **Handle Approval Workflows**: Submit objectives and KPIs for hierarchical approval
- **Organizational Structure Management**: Manage divisions, departments, and employees
- **Analytics & Reporting**: View performance dashboards and analytics

### Core Features

| Feature                              | Description                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| **Strategic Period Management**      | Create multi-year strategic periods with defined start dates and lengths          |
| **Objective Management**             | CRUD operations for corporate, division, department, and personnel objectives     |
| **KPI Management**                   | Define KPIs with baselines, weights, unit types, and quarterly targets            |
| **Assignment System**                | Cascade objectives/KPIs from corporate → division → department → personnel        |
| **Approval Workflow**                | Submit objectives and KPIs for hierarchical approval with approval/rejection flow |
| **Role-Based Access Control (RBAC)** | Granular permissions based on employee roles                                      |
| **Organization Structure**           | Manage divisions, departments, and employee assignments                           |
| **Analytics Dashboard**              | Visual representation of objective completion and KPI performance                 |

### Target Users

- **Executives/Directors**: Create corporate objectives and strategic periods
- **Division Managers**: Manage division-level objectives and approve department submissions
- **Department Managers**: Handle department objectives and team assignments
- **Employees**: View and manage personal objectives and KPIs
- **System Administrators**: Manage users, roles, and system configuration

### Tech Stack Summary

| Layer                   | Technology                                             |
| ----------------------- | ------------------------------------------------------ |
| **Frontend Framework**  | Next.js 16 (App Router with Turbopack)                 |
| **UI Language**         | TypeScript 5                                           |
| **UI Library**          | React 19                                               |
| **Styling**             | Tailwind CSS 4                                         |
| **Component Library**   | shadcn/ui (Radix UI primitives)                        |
| **State Management**    | Zustand 5                                              |
| **Data Fetching**       | Apollo Client 3 (GraphQL)                              |
| **Charts**              | Chart.js + react-chartjs-2                             |
| **Icons**               | Lucide React                                           |
| **Animations**          | tw-animate-css                                         |
| **Drag & Drop**         | @dnd-kit                                               |
| **Date Handling**       | date-fns                                               |
| **Toast Notifications** | Sonner                                                 |
| **Authentication**      | JWT (js-cookie + jwt-decode)                           |
| **Package Manager**     | pnpm 10                                                |
| **Backend API**         | External GraphQL API (strategize-api.frontiertech.org) |

---

## 2. Folder & File Structure

```
strategize-web/
├── public/                      # Static assets
│   └── images/
│       ├── auth/               # Authentication page images
│       ├── choose-strategy/    # Strategy selection page images
│       ├── dashboard/          # Dashboard & sidebar icons
│       └── icons/              # Application icons
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication routes
│   │   │   ├── page.tsx       # Login page
│   │   │   ├── email-sent/    # Email confirmation
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── reset-success/
│   │   ├── dashboard/         # Main application (protected)
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── page.tsx       # Dashboard home
│   │   │   ├── admin/         # Admin panel
│   │   │   ├── approvals/     # Approval workflows
│   │   │   ├── departments/   # Department management
│   │   │   ├── divisions/     # Division management
│   │   │   ├── employees/     # Employee management
│   │   │   ├── objectives/    # Objectives & KPIs
│   │   │   └── settings/      # User settings
│   │   ├── strategy-period/   # Strategy period selection
│   │   ├── globals.css        # Global styles & CSS variables
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing/redirect page
│   ├── components/            # Reusable React components
│   │   ├── admin/            # Admin panel components
│   │   ├── approvals/        # Approval workflow components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard layout components
│   │   ├── departments/      # Department management UI
│   │   ├── divisions/        # Division management UI
│   │   ├── employees/        # Employee management UI
│   │   ├── objectives/       # Objective & KPI components
│   │   ├── settings/         # Settings components
│   │   ├── skeleton/         # Loading skeleton components
│   │   ├── strategy-period/  # Strategy selection components
│   │   ├── submissions/      # Submission handling components
│   │   └── ui/               # shadcn/ui primitives
│   ├── config/               # Configuration files
│   │   └── env.ts            # Environment variable management
│   ├── context/              # React Context providers
│   │   └── DepartmentSelectionContext.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── submissions/      # Submission-related hooks
│   │   └── *.ts              # Feature-specific hooks
│   ├── lib/                  # Utility libraries
│   │   ├── graphql/          # GraphQL queries & mutations
│   │   │   ├── queries/      # GraphQL queries
│   │   │   └── mutations/    # GraphQL mutations
│   │   ├── rbac/             # Role-Based Access Control
│   │   ├── apollo-client.ts  # Apollo Client configuration
│   │   ├── auth-utils.ts     # Authentication utilities
│   │   ├── logger.ts         # Logging utility
│   │   ├── permissions.ts    # Legacy permissions (deprecated)
│   │   └── utils.ts          # General utilities (cn function)
│   ├── stores/               # Zustand state stores
│   │   ├── authStore.ts      # Authentication state
│   │   ├── cacheStore.ts     # Apollo cache management
│   │   ├── orgUnitStore.ts   # Organization unit selection
│   │   ├── strategicPeriodStore.ts # Strategic period selection
│   │   ├── uiStore.ts        # UI state (sidebar, loading)
│   │   └── index.ts          # Centralized exports
│   ├── types/                # TypeScript type definitions
│   │   └── graphql.ts        # GraphQL types & interfaces
│   └── utils/                # Utility functions
│       ├── cleanup-objectives.ts
│       ├── fileUpload.ts
│       ├── smartSubmission.ts
│       └── unitTypeDetection.ts
├── components.json            # shadcn/ui configuration
├── Dockerfile                # Docker build configuration
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies
├── postcss.config.mjs        # PostCSS configuration
├── proxy.ts                  # Development proxy (if needed)
├── tsconfig.json             # TypeScript configuration
└── *.md                      # Documentation files
```

### Naming Conventions

| Type          | Convention                    | Example                           |
| ------------- | ----------------------------- | --------------------------------- |
| Components    | PascalCase                    | `LoginForm.tsx`, `Sidebar.tsx`    |
| Hooks         | camelCase with `use` prefix   | `useAuth.ts`, `usePermissions.ts` |
| Stores        | camelCase with `Store` suffix | `authStore.ts`, `uiStore.ts`      |
| GraphQL Files | kebab-case                    | `strategic-periods.ts`            |
| Types         | PascalCase                    | `Employee`, `Objective`           |
| Utilities     | camelCase                     | `auth-utils.ts`, `logger.ts`      |

### Architectural Patterns

- **Feature-based organization**: Components grouped by feature/domain
- **Co-location**: Related files (hooks, types, components) kept close together
- **Centralized exports**: Index files for cleaner imports
- **Separation of concerns**: Clear boundaries between UI, state, and data layers

---

## 3. Frontend Documentation

### Framework: Next.js 16 (App Router)

The application uses Next.js 16 with the App Router pattern:

- **Server Components** as default
- **Client Components** marked with `"use client"` directive
- **File-based routing** under `src/app/`
- **Layouts** for shared UI across routes
- **Turbopack** for fast development builds

### Component Structure

#### Root Layout (`src/app/layout.tsx`)

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ApolloWrapper>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
```

#### Dashboard Layout (`src/app/dashboard/layout.tsx`)

The dashboard layout provides:

- **Sidebar navigation** with permission-based menu items
- **Topbar** with user info and actions
- **Auth synchronization** via `AuthSync` component
- **Error boundaries** for graceful error handling
- **Department selection context** for multi-department users

### Routing Logic

| Route                    | Description                      | Access        |
| ------------------------ | -------------------------------- | ------------- |
| `/`                      | Landing page (redirects to auth) | Public        |
| `/auth`                  | Login page                       | Public        |
| `/auth/forgot-password`  | Password recovery                | Public        |
| `/auth/reset-password`   | Password reset                   | Public        |
| `/strategy-period`       | Strategy period selection        | Authenticated |
| `/strategy-period/new`   | Create new strategy              | Admin only    |
| `/dashboard`             | Main dashboard                   | Authenticated |
| `/dashboard/objectives`  | Objectives management            | Role-based    |
| `/dashboard/divisions`   | Division management              | Director+     |
| `/dashboard/departments` | Department management            | Director+     |
| `/dashboard/employees`   | Employee management              | Admin only    |
| `/dashboard/approvals`   | Approval workflows               | Manager+      |
| `/dashboard/admin`       | Admin panel                      | Admin only    |
| `/dashboard/settings`    | User settings                    | Authenticated |

### State Management

#### Zustand Stores

The application uses **Zustand** for lightweight, performant state management:

**1. Auth Store (`authStore.ts`)**

```typescript
interface AuthState {
  user: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: Employee | null) => void;
  login: (user: Employee, token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}
```

**2. Strategic Period Store (`strategicPeriodStore.ts`)**

```typescript
interface StrategicPeriodState {
  selectedPeriod: StrategicPeriod | null;
  annualTimeline: string | null;

  setSelectedPeriod: (period: StrategicPeriod | null) => void;
  setAnnualTimeline: (timeline: string | null) => void;
}
```

**3. Org Unit Store (`orgUnitStore.ts`)**

```typescript
interface OrgUnitState {
  selectedUnit: OrgUnit | null;

  selectDivision: (division: Division) => void;
  selectDepartment: (department: Department) => void;
  clearSelection: () => void;
}
```

**4. UI Store (`uiStore.ts`)**

```typescript
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  globalLoading: boolean;

  toggleSidebar: () => void;
  setGlobalLoading: (loading: boolean) => void;
}
```

**5. Cache Store (`cacheStore.ts`)**

- Manages Apollo cache invalidation
- Tracks pending refetch requests
- Provides helper functions for mutation-based invalidation

#### Usage Pattern

```typescript
// Import from centralized exports
import { useAuthStore, useSelectedStrategicPeriod } from "@/stores";

// In components
const user = useAuthStore((state) => state.user);
const period = useSelectedStrategicPeriod();
```

### UI Libraries

#### shadcn/ui Components

The application uses **shadcn/ui** with the "new-york" style:

| Component     | File                   | Usage              |
| ------------- | ---------------------- | ------------------ |
| Button        | `ui/button.tsx`        | Actions, links     |
| Input         | `ui/input.tsx`         | Form inputs        |
| Dialog        | `ui/dialog.tsx`        | Modal dialogs      |
| Select        | `ui/select.tsx`        | Dropdowns          |
| Table         | `ui/table.tsx`         | Data tables        |
| Tabs          | `ui/tabs.tsx`          | Tab navigation     |
| Card          | `ui/card.tsx`          | Content containers |
| Badge         | `ui/badge.tsx`         | Status indicators  |
| Checkbox      | `ui/checkbox.tsx`      | Boolean inputs     |
| Calendar      | `ui/calendar.tsx`      | Date picking       |
| Progress      | `ui/progress.tsx`      | Progress bars      |
| Skeleton      | `ui/skeleton.tsx`      | Loading states     |
| Avatar        | `ui/avatar.tsx`        | User avatars       |
| Alert Dialog  | `ui/alert-dialog.tsx`  | Confirmations      |
| Dropdown Menu | `ui/dropdown-menu.tsx` | Context menus      |

#### Icons: Lucide React

```typescript
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Plus,
  Trash,
} from "lucide-react";
```

### Important Custom Hooks

#### `useAuth` - Authentication Hook

```typescript
const {
  isAuthenticated,
  user,
  loading,
  tokenExpiresIn,
  login,
  logout,
  getToken,
} = useAuth();
```

#### `usePermissions` - RBAC Hook

```typescript
const {
  can, // Check single permission
  canAny, // Check any of multiple permissions
  canAll, // Check all permissions
  role, // Current user role
  guards, // Quick role checks
  employees, // Employee-specific checks
  objectives, // Objective-specific checks
  divisions, // Division-specific checks
  departments, // Department-specific checks
} = usePermissions();

// Usage
if (can("employees:create")) {
  /* ... */
}
if (guards.isAdmin) {
  /* ... */
}
if (objectives.canCreate("CORPORATE")) {
  /* ... */
}
```

#### `useObjectives` / `useObjective` - Objectives Data

```typescript
const { objectives, meta, loading, error, refetch } = useObjectives({
  page: 1,
  limit: 10,
  search: "revenue",
});

const { objective, loading, error } = useObjective({ objectiveId: "abc123" });
```

#### `useKPIs` / `useKPI` - KPI Data

```typescript
const { kpis, meta, loading, error, refetch } = useKPIs({
  page: 1,
  limit: 10,
});
```

### API Interactions

All API interactions use Apollo Client with GraphQL:

```typescript
// Query example
const { data, loading, error } = useQuery(GET_OBJECTIVES, {
  variables: { page: 1, limit: 10 },
  fetchPolicy: "cache-and-network",
});

// Mutation example
const [createObjective] = useMutation(CREATE_OBJECTIVE, {
  onCompleted: () => {
    toast.success("Objective created!");
    invalidateAfterMutation.objective();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

---

## 4. Backend Documentation

### Overview

The backend is an **external GraphQL API** hosted at `https://strategize-api.frontiertech.org`. The frontend communicates with it through a Next.js proxy for CORS handling.

### API Proxy Configuration

In `next.config.ts`:

```typescript
async rewrites() {
  return [
    {
      source: "/api/graphql",
      destination: "https://strategize-api.frontiertech.org/graphql",
    },
    {
      source: "/api/auth/:path*",
      destination: "https://strategize-api.frontiertech.org/auth/:path*",
    },
    {
      source: "/api/upload",
      destination: "https://strategize-api.frontiertech.org/upload",
    },
    {
      source: "/api/storage/:filename*",
      destination: "https://strategize-api.frontiertech.org/storage/:filename*",
    },
  ];
}
```

### Apollo Client Configuration

Located in `src/lib/apollo-client.ts`:

```typescript
const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          objectives: {
            keyArgs: ["search", "assigneeId"],
            merge(existing, incoming) {
              return incoming;
            },
          },
          // ... similar for kpis, submissions
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-and-network",
    },
  },
});
```

### Authentication Flow

1. **Login**: User submits credentials via `LOGIN_EMPLOYEE` mutation
2. **Token Storage**: JWT stored in secure cookie (`accessToken`)
3. **Request Authentication**: Auth link adds `Authorization: Bearer <token>` header
4. **Token Validation**: Client-side check for expiration before each request
5. **Error Handling**: 401/UNAUTHENTICATED errors redirect to login
6. **Session Expiry**: Automatic detection and handling of expired tokens

### Error Handling

The error link handles:

- **GraphQL Errors**: Logged and displayed to user
- **Authentication Errors**: Redirect to login page
- **Network Errors**: Display connectivity message
- **Not Found Errors**: Logged as debug (expected when data deleted)

### Role-Based Access Control (RBAC)

#### Role Hierarchy

```
NORMAL < COORDINATOR < MANAGER < DIRECTOR < ADMIN < SUPER_ADMIN
```

| Role        | Level | Description             |
| ----------- | ----- | ----------------------- |
| NORMAL      | 0     | Regular employee        |
| COORDINATOR | 1     | Department coordinator  |
| MANAGER     | 2     | Department manager      |
| DIRECTOR    | 3     | Division director       |
| ADMIN       | 4     | Corporate administrator |
| SUPER_ADMIN | 5     | System administrator    |

#### Permission Categories

- **employees**: `read_own`, `read_department`, `read_all`, `create`, `update`, `delete`
- **objectives**: `read`, `create`, `update`, `delete`, `submit`, `approve`, `assign`
- **kpis**: `read`, `create`, `update`, `delete`, `submit`, `approve`
- **divisions**: `read`, `create`, `update`, `delete`, `assign_manager`
- **departments**: `read`, `create`, `update`, `delete`, `add_employee`
- **submissions**: `read`, `create`, `approve`
- **admin**: `access_panel`, `manage_admins`, `view_audit_logs`
- **nav**: Route access permissions

---

## 5. Database Structure

> **Note**: The database is managed by the backend API. This documentation describes the data model as understood from the GraphQL schema.

### Core Entities

#### Employee

```typescript
interface Employee {
  employeeId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  picture: string;
  role: EmployeeRole; // NORMAL | COORDINATOR | MANAGER | DIRECTOR | ADMIN | SUPER_ADMIN
  startDate: string;
  status: EmployeeStatus; // ACTIVE | DISABLED | DELETED
  title: string;
  departments?: Department[];
  createdAt: string;
  updatedAt: string;
}
```

#### Division

```typescript
interface Division {
  divisionId: string;
  name: string;
  manager?: Employee;
  departments?: Department[];
  createdAt: string;
  updatedAt: string;
}
```

#### Department

```typescript
interface Department {
  departmentId: string;
  name: string;
  manager?: Employee;
  division?: Division;
  employees?: Employee[];
  createdAt: string;
  updatedAt: string;
}
```

#### Strategic Period

```typescript
interface StrategicPeriod {
  strategicPeriodId: string;
  startDate: string;
  length: number; // In years
  endDate: string;
  createdBy: Employee | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Objective

```typescript
interface Objective {
  objectiveId: string;
  name: string;
  type: ObjectiveType; // CORPORATE | DIVISION | DEPARTMENT | PERSONNEL
  status: ObjectiveStatus; // NOT_SUBMITTED | PENDING | APPROVED | REJECTED
  strategicPeriod: StrategicPeriod | null;
  createdBy?: Employee | null;
  assigneeId?: string;
  assignerId?: string;
  assigneeType?: string;
  parent?: Objective | null;
  kpis?: KPI[];
  createdAt: string;
  updatedAt: string;
}
```

#### KPI (Key Performance Indicator)

```typescript
interface Kpi {
  kpiId: string;
  name: string;
  baseline: number;
  weight: number; // Decimal, represents percentage
  unitType: KpiUnitType; // NUMBER | PERCENT
  status: KpiStatus; // NOT_SUBMITTED | PENDING | APPROVED | REJECTED
  targetStatus?: KpiTargetStatus;
  targets: KpiTarget[];
  parent?: Kpi | null;
  objective: Objective | null;
  createdAt: string;
  updatedAt: string;
}

interface KpiTarget {
  timeline: string; // e.g., "2025/26", "Q1 2025"
  target: number;
}
```

#### Submission

```typescript
interface Submission {
  submissionId: string;
  type: SubmissionType; // OBJECTIVE | KPI
  level: SubmissionLevel; // DEPARTMENT | DIVISION | PERSONNEL
  status: SubmissionStatus; // APPROVED | PENDING | REJECTED
  reason: string;
  submittedBy: Employee;
  objective?: Objective;
  kpi?: Kpi;
  createdAt: string;
  updatedAt?: string;
}
```

### Entity Relationships

```
StrategicPeriod (1) ←─── (∞) Objective
                              │
                              ├── type: CORPORATE (1) ←─── (∞) DIVISION
                              ├── type: DIVISION (1) ←─── (∞) DEPARTMENT
                              └── type: DEPARTMENT (1) ←─── (∞) PERSONNEL

Objective (1) ←─── (∞) KPI
                        │
                        └── parent: KPI (inheritance for assignments)

Division (1) ←─── (∞) Department (1) ←─── (∞) Employee

Employee ←─── Division.manager
Employee ←─── Department.manager
```

---

## 6. API Documentation

### GraphQL Endpoint

```
Production: https://strategize-api.frontiertech.org/graphql
Local Proxy: /api/graphql
```

### Authentication

All authenticated requests require:

```
Authorization: Bearer <JWT_TOKEN>
```

### Query: Get Current User

```graphql
query Me {
  me {
    employeeId
    email
    fullName
    phoneNumber
    picture
    role
    startDate
    status
    title
    departments {
      departmentId
      name
    }
  }
}
```

### Query: Get Employees

```graphql
query Employees($page: Int = 1, $limit: Int = 10, $search: String) {
  employees(page: $page, limit: $limit, search: $search) {
    items {
      employeeId
      email
      fullName
      role
      status
      title
    }
    meta {
      currentPage
      totalItems
      totalPages
      itemsPerPage
    }
  }
}
```

### Query: Get Objectives

```graphql
query GetObjectives($page: Int, $limit: Int, $search: String, $assigneeId: ID) {
  objectives(
    page: $page
    limit: $limit
    search: $search
    assigneeId: $assigneeId
  ) {
    items {
      objectiveId
      name
      type
      status
      strategicPeriod {
        strategicPeriodId
        startDate
        endDate
      }
      parent {
        objectiveId
        name
      }
      kpis {
        kpiId
        name
        status
      }
      assigneeId
      assigneeType
    }
    meta {
      currentPage
      totalItems
      totalPages
    }
  }
}
```

### Query: Get KPIs

```graphql
query GetKpis($page: Int, $limit: Int, $search: String) {
  kpis(page: $page, limit: $limit, search: $search) {
    items {
      kpiId
      name
      baseline
      weight
      unitType
      status
      targets {
        timeline
        target
      }
      objective {
        objectiveId
        name
        type
      }
    }
    meta {
      currentPage
      totalItems
      totalPages
    }
  }
}
```

### Mutation: Login

```graphql
mutation Login($input: LoginEmployeeInput!) {
  loginEmployee(loginInput: $input) {
    accessToken
    employee {
      employeeId
      email
      fullName
      role
    }
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

### Mutation: Create Objective

```graphql
mutation CreateObjective($input: CreateObjectiveInput!) {
  createObjective(createObjectiveInput: $input) {
    objectiveId
    name
    type
    status
  }
}

# Variables
{
  "input": {
    "name": "Increase Revenue",
    "type": "CORPORATE",
    "strategicPeriodId": "period-123"
  }
}
```

### Mutation: Create KPI

```graphql
mutation CreateKpi($input: CreateKpiInput!) {
  createKpi(createKpiInput: $input) {
    kpiId
    name
    baseline
    weight
    unitType
    targets { timeline target }
  }
}

# Variables
{
  "input": {
    "name": "Total Revenue",
    "baseline": 100,
    "weight": 0.25,
    "unitType": "NUMBER",
    "targets": [
      { "timeline": "Q1 2025", "target": 25 },
      { "timeline": "Q2 2025", "target": 30 }
    ],
    "objectiveId": "obj-123"
  }
}
```

### Mutation: Assign Objective

```graphql
mutation AssignObjective($input: AssignObjectiveInput!) {
  assignObjective(assignObjectiveInput: $input) {
    objectiveId
    name
    assigneeId
    assigneeType
  }
}

# Variables
{
  "input": {
    "objectiveId": "obj-123",
    "assigneeId": "div-456",
    "assignerId": "emp-789",
    "assigneeType": "DIVISION",
    "kpis": ["kpi-1", "kpi-2"]
  }
}
```

### Mutation: Create Submission

```graphql
mutation CreateSubmission($input: CreateSubmissionInput!) {
  createSubmission(createSubmissionInput: $input) {
    submissionId
    type
    level
    status
  }
}

# Variables
{
  "input": {
    "type": "OBJECTIVE",
    "level": "DEPARTMENT",
    "itemId": "obj-123",
    "reason": "Ready for approval"
  }
}
```

### Mutation: Update Submission (Approve/Reject)

```graphql
mutation UpdateSubmission($input: UpdateSubmissionInput!) {
  updateSubmission(updateSubmissionInput: $input) {
    submissionId
    status
    reason
  }
}

# Variables (Approve)
{
  "input": {
    "submissionId": "sub-123",
    "status": "APPROVED",
    "reason": "Looks good"
  }
}

# Variables (Reject)
{
  "input": {
    "submissionId": "sub-123",
    "status": "REJECTED",
    "reason": "Targets need adjustment"
  }
}
```

### Error Responses

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

Common error codes:

- `UNAUTHENTICATED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource doesn't exist
- `BAD_USER_INPUT`: Invalid input data
- `INTERNAL_SERVER_ERROR`: Server error

---

## 7. Environment Variables

### Required Variables

Create a `.env.local` file in the project root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql

# Authentication
NEXT_PUBLIC_AUTH_COOKIE_NAME=accessToken
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300

# Features
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Application
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=10
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=5
```

### Variable Descriptions

| Variable                              | Required | Default                                   | Description                   |
| ------------------------------------- | -------- | ----------------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_API_URL`                 | Yes      | `https://strategize-api.frontiertech.org` | Backend API base URL          |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT`        | No       | `/api/graphql`                            | GraphQL endpoint path         |
| `NEXT_PUBLIC_AUTH_COOKIE_NAME`        | No       | `accessToken`                             | Cookie name for JWT           |
| `NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD` | No       | `300`                                     | Seconds before expiry to warn |
| `NEXT_PUBLIC_ENABLE_DEBUG_LOGGING`    | No       | `false` (prod)                            | Enable console logging        |
| `NEXT_PUBLIC_ENABLE_ANALYTICS`        | No       | `true`                                    | Enable analytics dashboard    |
| `NEXT_PUBLIC_DEFAULT_PAGE_SIZE`       | No       | `10`                                      | Default pagination size       |
| `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB`      | No       | `5`                                       | Max file upload size in MB    |

### Environment Example Template

```bash
# .env.example

# === API Configuration ===
# Backend API URL - change this for different environments
NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org

# === Authentication ===
# JWT cookie name (don't change unless backend changes)
NEXT_PUBLIC_AUTH_COOKIE_NAME=accessToken

# Token refresh warning threshold (seconds)
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300

# === Feature Flags ===
# Enable debug logging (true in development)
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false

# === Application Settings ===
# Default items per page
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=10

# Maximum file upload size (MB)
NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB=5
```

### Security Instructions

1. **Never commit** `.env.local` or any file with sensitive values
2. **Use different values** for development vs production
3. **Rotate secrets** regularly in production
4. **Restrict API access** to known domains in production
5. **Use HTTPS** for all production API URLs

---

## 8. Setup & Installation Guide

### System Requirements

| Requirement | Minimum Version                    |
| ----------- | ---------------------------------- |
| Node.js     | 20.x or higher                     |
| pnpm        | 10.x                               |
| Git         | 2.x                                |
| RAM         | 4GB+ recommended                   |
| OS          | Windows 10+, macOS 12+, Ubuntu 20+ |

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/frontiertech/strategize-web.git
cd strategize-web
```

#### 2. Install Dependencies

```bash
# Install pnpm if not already installed
corepack enable pnpm

# Install project dependencies
pnpm install
```

#### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your configuration
# (Use VS Code or your preferred editor)
code .env.local
```

#### 4. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

#### 5. Verify Setup

1. Open `http://localhost:3000` in your browser
2. You should see the login page
3. Try logging in with valid credentials

### Development Commands

| Command      | Description                          |
| ------------ | ------------------------------------ |
| `pnpm dev`   | Start development server (Turbopack) |
| `pnpm build` | Build production bundle              |
| `pnpm start` | Start production server (port 4410)  |
| `pnpm lint`  | Run ESLint checks                    |

### IDE Setup (VS Code)

Recommended extensions:

- ESLint
- Tailwind CSS IntelliSense
- Prettier
- TypeScript Vue Plugin (Volar)
- Apollo GraphQL

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 9. Deployment Instructions

### Docker Deployment

#### Build Docker Image

```bash
docker build -t strategize-web .
```

#### Run Container

```bash
docker run -p 4410:4410 strategize-web
```

#### Docker Compose (Example)

```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "4410:4410"
    environment:
      - NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org
      - NODE_ENV=production
    restart: unless-stopped
```

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Project**:
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
3. **Add Environment Variables** in Vercel dashboard
4. **Deploy**: Push to main branch triggers deployment

### Environment-Specific Configuration

| Environment | API URL                                   | Debug Logging |
| ----------- | ----------------------------------------- | ------------- |
| Development | `https://strategize-api.frontiertech.org` | `true`        |
| Staging     | `https://staging-api.strategize.com`      | `true`        |
| Production  | `https://strategize-api.frontiertech.org` | `false`       |

### Post-Deployment Checklist

- [ ] Verify environment variables are set
- [ ] Test authentication flow (login/logout)
- [ ] Check API connectivity (dashboard loads data)
- [ ] Verify role-based access control
- [ ] Test file uploads (if applicable)
- [ ] Check analytics dashboard
- [ ] Verify mobile responsiveness
- [ ] Test error handling (invalid routes, API errors)

---

## 10. Testing

### Test Structure

Tests are located in `src/utils/`:

- `targetValidation.test.ts` - KPI target validation tests
- `unitTypeDetection.test.ts` - Unit type detection tests
- `targetAssignment.test.ts` - Target assignment tests

### Running Tests

Currently, the project uses manual testing and type checking:

```bash
# Type checking
pnpm tsc --noEmit

# Lint checking
pnpm lint
```

### Test Scenarios

#### Target Validation Tests

```typescript
describe("Target Validation System", () => {
  it("should validate corporate → division assignment", () => {
    // Corporate KPI: 227 million ETB
    // Division assigned: 150 million ETB
    // Quarterly sum should not exceed division target
  });

  it("should validate division → department assignment", () => {
    // Division: 150 million
    // Department: 80 million
    // Quarterly breakdown must sum to 80
  });
});
```

#### Permission Tests

```typescript
// Test role hierarchy
expect(hasMinimumRole("MANAGER", "COORDINATOR")).toBe(true);
expect(hasMinimumRole("NORMAL", "ADMIN")).toBe(false);

// Test permission checks
expect(can("employees:create")).toBe(false); // for NORMAL
expect(can("employees:create")).toBe(true); // for ADMIN
```

### Manual Testing Checklist

**Authentication**

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error message)
- [ ] Logout flow
- [ ] Session expiry handling
- [ ] Password reset flow

**Objectives**

- [ ] Create objective (by type)
- [ ] Edit objective
- [ ] Delete objective
- [ ] View objective details
- [ ] Submit for approval
- [ ] Assign to division/department

**KPIs**

- [ ] Create KPI with targets
- [ ] Edit KPI
- [ ] Delete KPI
- [ ] Set quarterly targets
- [ ] View KPI details

**Approvals**

- [ ] View pending submissions
- [ ] Approve submission
- [ ] Reject submission with reason
- [ ] Filter by status/type

---

## 11. Coding Guidelines & Conventions

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with default settings
- **Linting**: ESLint with Next.js recommended rules
- **Imports**: Absolute imports via `@/` alias

### Naming Conventions

| Type                  | Convention                    | Example                            |
| --------------------- | ----------------------------- | ---------------------------------- |
| **Components**        | PascalCase                    | `ObjectiveCard.tsx`                |
| **Hooks**             | camelCase with `use` prefix   | `useObjectives.ts`                 |
| **Stores**            | camelCase with `Store` suffix | `authStore.ts`                     |
| **Utilities**         | camelCase                     | `formatDate.ts`                    |
| **Constants**         | SCREAMING_SNAKE_CASE          | `MAX_FILE_SIZE`                    |
| **Types/Interfaces**  | PascalCase                    | `Employee`, `CreateObjectiveInput` |
| **GraphQL Queries**   | SCREAMING_SNAKE_CASE          | `GET_OBJECTIVES`                   |
| **GraphQL Mutations** | SCREAMING_SNAKE_CASE          | `CREATE_OBJECTIVE`                 |

### Component Structure

```tsx
"use client"; // If needed

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
// External imports

import { Button } from "@/components/ui/button";
// Internal UI imports

import { useAuthStore } from "@/stores";
// Store imports

import type { Employee } from "@/types/graphql";
// Type imports

interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  // State
  const [value, setValue] = useState("");

  // Stores
  const user = useAuthStore((state) => state.user);

  // Queries/Mutations
  const { data, loading } = useQuery(SOME_QUERY);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependency]);

  // Handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  if (loading) return <Skeleton />;

  return <div>{/* Component JSX */}</div>;
}
```

### Commit Message Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(objectives): add bulk assignment feature

fix(auth): resolve token refresh race condition

docs(readme): update installation instructions

refactor(rbac): simplify permission checks
```

### When to Create New Components

Create a new component when:

1. **Reusability**: UI pattern appears 2+ times
2. **Complexity**: Component exceeds ~100 lines
3. **Independence**: Logic is self-contained
4. **Testing**: Need isolated testing

### When to Create New Hooks

Create a custom hook when:

1. **Logic reuse**: Same logic in multiple components
2. **Separation**: Complex state/effect logic
3. **Abstraction**: Wrapping third-party hooks
4. **Testing**: Easier to test in isolation

---

## 12. Common Issues & Debugging Guide

### Known Issues

| Issue                             | Description                                   | Workaround                                   |
| --------------------------------- | --------------------------------------------- | -------------------------------------------- |
| Token expiration race             | Multiple requests during token refresh        | Implemented queue system in Apollo           |
| Department null in employees list | Backend returns null for unassigned employees | Excluded from list query, fetched separately |
| Submission FK constraints         | Can't delete objectives with submissions      | Archive instead of delete                    |

### Common Errors and Solutions

#### 1. "UNAUTHENTICATED" Error

**Symptoms**: Redirected to login, API calls fail

**Causes**:

- Token expired
- Token not set
- Token malformed

**Solutions**:

```typescript
// Check token manually
import { getAccessToken, isTokenExpired } from "@/lib/auth-utils";

const token = getAccessToken();
console.log("Token:", token);
console.log("Expired:", isTokenExpired(token));
```

#### 2. "Failed to fetch" Network Error

**Symptoms**: No API response, loading never ends

**Causes**:

- API server down
- CORS issues
- Network connectivity

**Solutions**:

1. Check API status: `curl https://strategize-api.frontiertech.org/graphql`
2. Verify proxy configuration in `next.config.ts`
3. Check browser network tab for details

#### 3. Stale Data After Mutation

**Symptoms**: Changes not reflected in UI

**Solutions**:

```typescript
// Use cache invalidation helpers
import { invalidateAfterMutation } from "@/stores";

// After creating/updating objective
invalidateAfterMutation.objective();

// After approval
invalidateAfterMutation.approval();
```

#### 4. Permission Denied (But Should Have Access)

**Symptoms**: Features hidden or blocked unexpectedly

**Solutions**:

```typescript
// Debug permissions
import { usePermissions } from "@/hooks/usePermissions";

const { role, permissions, guards } = usePermissions();
console.log("Role:", role);
console.log("Permissions:", permissions);
console.log("Guards:", guards);
```

#### 5. Hydration Mismatch Errors

**Symptoms**: React hydration warnings in console

**Causes**:

- Server/client state mismatch
- Date/time formatting differences
- Browser-only APIs used during SSR

**Solutions**:

1. Use `"use client"` directive for browser-specific components
2. Check for `typeof window !== "undefined"` before accessing browser APIs
3. Use `suppressHydrationWarning` for intentional differences

### Local Development Tips

1. **Enable debug logging**:

   ```bash
   NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true
   ```

2. **Use Apollo DevTools**: Install browser extension for GraphQL debugging

3. **Check stores in DevTools**: Zustand stores are accessible via:

   ```javascript
   // In browser console
   window.__ZUSTAND_AUTH_STORE__;
   ```

4. **Clear cache when stuck**:

   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   // Then refresh
   ```

5. **Network debugging**:
   - Open DevTools → Network tab
   - Filter by "graphql"
   - Check request/response payloads

### API Limitations

| Limitation       | Description                               |
| ---------------- | ----------------------------------------- |
| No refresh token | Must re-login when token expires (7 days) |
| Pagination max   | 100 items per page                        |
| File upload size | 5MB maximum                               |
| Bulk operations  | Limited to 50 items                       |
| Rate limiting    | Unknown (API-side)                        |

### Deployment Pitfalls

1. **Missing environment variables**: Always verify all required env vars are set
2. **Build cache issues**: Clear `.next/` folder if seeing stale code
3. **API URL mismatch**: Ensure production API URL is correct
4. **Cookie domain**: Check cookie settings for production domain
5. **CSP headers**: May need adjustment for external resources

---

## Support & Resources

- **Backend API Team**: Contact for API issues
- **Design System**: shadcn/ui documentation
- **GraphQL**: Apollo Client documentation
- **State Management**: Zustand documentation

---

_This documentation is maintained by the Frontend Team. Last updated: December 2025_
