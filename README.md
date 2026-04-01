# Strategize Web Application

> **Version:** 0.1.0  
> **Documentation:** [Full Technical Documentation](./DOCUMENTATION.md)

> **Guides:**
> - [Objectives & KPIs E2E Guide](./docs/OBJECTIVES_KPIS.md)

Strategize is an enterprise strategic planning and performance management platform designed to help organizations manage strategic periods, objectives, KPIs, and approval workflows.

This guide is designed to help new developers get up and running quickly. for more in-depth details, please refer to the `DOCUMENTATION.md` file in this repository.

---

## 🚀 Quick Start Guide

Follow these steps to set up your development environment.

### 1. Prerequisites

Ensure your system meets the following requirements:
- **Node.js**: v20.x or higher
- **Package Manager**: pnpm v10.x
- **Git**: v2.x

### 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd strategize-web

# Enable pnpm (if not already enabled)
corepack enable pnpm

# Install dependencies
pnpm install
```

### 3. Environment Configuration

Create a local environment file. You can start by copying the example or using the template below.

```bash
# Create .env.local file
cp .env.example .env.local
```

**Required `.env.local` Variables:**

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org

# GraphQL Endpoint (Local Proxy)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql

# Authentication
NEXT_PUBLIC_AUTH_COOKIE_NAME=accessToken
NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true
NEXT_PUBLIC_DEFAULT_PAGE_SIZE=10
```

> **Note:** Never commit `.env.local` to version control.

### 4. Running the Project

Start the development server with Turbopack:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏗️ Project Architecture

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand 5
- **Data**: Apollo Client 3 (GraphQL)
- **Auth**: JWT (js-cookie + jwt-decode)

### Key Directories

```
src/
├── app/                  # App Router pages & layouts
│   ├── auth/             # Login & Recovery pages
│   └── dashboard/        # Protected application routes
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui primitives
│   └── [feature]/        # Feature-specific components
├── lib/                  # Core utilities
│   ├── graphql/          # Queries & Mutations
│   └── apollo-client.ts  # Client configuration
├── stores/               # Zustand state stores
│   ├── authStore.ts      # Auth state
│   └── uiStore.ts        # UI state
└── hooks/                # Custom hooks (useAuth, usePermissions)
```

---

## 🧑‍💻 Development Workflows

### 1. Authentication & Permissions
Authentication is handled via `useAuth` hook and centrally managed in `authStore.ts`.
- **Login**: `useAuth().login()` calls the `LOGIN_EMPLOYEE` mutation.
- **RBAC**: Use `usePermissions()` to check access rights.

```typescript
const { can } = usePermissions();
if (can('objectives:create')) { /* ... */ }
```

### 2. Data Fetching (GraphQL)
We use Apollo Client. Requests are proxied through Next.js to avoid CORS issues.
- **Queries**: Define in `src/lib/graphql/queries`.
- **Mutations**: Define in `src/lib/graphql/mutations`.

**Example Usage:**
```typescript
const { data, loading } = useQuery(GET_OBJECTIVES, {
  variables: { page: 1 }
});
```

### 3. State Management (Zustand)
Global state is divided into stores located in `src/stores/`.
- `authStore`: User session.
- `orgUnitStore`: Selection of Division/Department.
- `uiStore`: Sidebar & Global loading states.

---

## 🛠️ Troubleshooting & Debugging

### Common Issues

1.  **UNAUTHENTICATED Error on API Calls**
    *   **Cause**: Token expired or missing.
    *   **Fix**: Check `Application > Cookies` in DevTools. Ensure `accessToken` is present.

2.  **CORS / Network Errors**
    *   **Cause**: Proxy misconfiguration.
    *   **Fix**: Verify `next.config.ts` rewrites match `NEXT_PUBLIC_API_URL`.

3.  **Hydration Errors**
    *   **Cause**: Server/Client mismatch (often Dates).
    *   **Fix**: checking for `typeof window !== 'undefined'` or using `suppressHydrationWarning`.

### Recommended Tools
- **Apollo DevTools**: For inspecting GraphQL cache.
- **React Developer Tools**: For component hierarchy.
- **Redux DevTools**: Can be connected to Zustand for state debugging.

---

## 📚 Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run code linting |
