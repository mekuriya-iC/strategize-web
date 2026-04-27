# 🚀 Getting Started - START HERE

## Welcome to Strategize

Strategize is an enterprise strategic planning and performance management platform. This guide will get you up and running quickly.

---

## ⚡ Quick Start (5 Minutes)

### 1. Prerequisites
- Node.js 18+ installed
- pnpm package manager
- GraphQL API running locally or accessible

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://strategize-api.frontiertech.org
NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/graphql
GRAPHQL_SCHEMA_URL=http://localhost:3000/graphql
```

### 4. Generate Schema
```bash
pnpm run schema:fetch
```

### 5. Start Development
```bash
pnpm run dev
```

Visit `http://localhost:3000`

---

## 📚 Documentation Paths

### Path 1: "I Just Want to Work" (30 min)
1. This file (5 min)
2. [Schema Generation Quick Start](../schema-generation/QUICK_START.md) (5 min)
3. Run `pnpm run schema:fetch` (5 min)
4. Start coding!

### Path 2: "I Want to Understand Everything" (1 hour)
1. [Complete Documentation](./DOCUMENTATION.md) (30 min)
2. [Schema Generation Complete System](../schema-generation/COMPLETE_SYSTEM.md) (20 min)
3. [Data Cleanup Utility](../utilities/CLEANUP_DATA.md) (10 min)

### Path 3: "I'm a Team Lead" (1.5 hours)
1. [Complete Documentation](./DOCUMENTATION.md) (30 min)
2. [Schema Generation Rules](../schema-generation/RULES.md) (15 min)
3. [Schema Generation Workflow](../schema-generation/WORKFLOW.md) (20 min)
4. Set up team standards (25 min)

---

## 🎯 Essential Commands

```bash
# Development
pnpm run dev              # Start dev server
pnpm run schema:fetch     # Fetch schema and generate types
pnpm run lint             # Check code quality
pnpm run test             # Run tests

# Production
pnpm run build            # Build for production
pnpm run start            # Start production server

# Schema Management
pnpm run schema:generate  # Generate types only
pnpm run schema:clean     # Clean old GraphQL files
```

---

## 📁 Project Structure

```
strategize-web/
├── src/
│   ├── app/              # Next.js pages and routes
│   ├── components/       # React components
│   ├── graphql/          # GraphQL queries and mutations
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
└── public/               # Static assets
```

---

## 🔑 Key Concepts

### GraphQL Schema Generation
- Automatically fetch schema from API
- Generate TypeScript types
- Create organized query/mutation files
- One command: `pnpm run schema:fetch`

### State Management
- **Zustand** for lightweight state
- Stores for auth, UI, strategic period, org units
- Centralized exports for clean imports

### Authentication
- JWT-based authentication
- Secure cookie storage
- Automatic token refresh
- Role-based access control

### Component Organization
- Feature-based folder structure
- shadcn/ui for consistent UI
- Lucide React for icons
- Tailwind CSS for styling

---

## 🚀 Your First Task

### 1. Create a Component
```typescript
// src/components/MyComponent.tsx
"use client";

import { useQuery } from "@apollo/client";
import { GET_OBJECTIVES } from "@/graphql/queries/objectives";

export function MyComponent() {
  const { data, loading } = useQuery(GET_OBJECTIVES);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data?.objectives?.items?.map((obj) => (
        <div key={obj.objectiveId}>{obj.name}</div>
      ))}
    </div>
  );
}
```

### 2. Use in a Page
```typescript
// src/app/dashboard/page.tsx
import { MyComponent } from "@/components/MyComponent";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <MyComponent />
    </div>
  );
}
```

### 3. Test It
```bash
pnpm run dev
# Visit http://localhost:3000/dashboard
```

---

## 🐛 Common Issues

### "API not reachable"
```bash
# Check if API is running
curl http://localhost:3000/graphql

# If not, start it in another terminal
cd ../backend && npm run dev

# Try again
pnpm run schema:fetch
```

### "TypeScript errors"
```bash
# Generate types
pnpm run schema:fetch

# Check for errors
pnpm run lint

# Fix errors
pnpm run lint --fix
```

### "Port 3000 already in use"
```bash
# Use different port
pnpm run dev -- -p 3001
```

---

## 📖 Documentation Structure

| Document | Purpose |
|----------|---------|
| [START_HERE.md](./START_HERE.md) | This file - quick start |
| [DOCUMENTATION.md](./DOCUMENTATION.md) | Complete project documentation |
| [Schema Generation](../schema-generation/) | GraphQL schema setup and usage |
| [Utilities](../utilities/) | Helper tools and utilities |
| [Data Validation](../data-validation/) | Data validation rules |

---

## 🎓 Learning Resources

### For Frontend Development
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### For GraphQL
- [Apollo Client Documentation](https://www.apollographql.com/docs/react)
- [GraphQL Documentation](https://graphql.org/learn)

### For State Management
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed
- [ ] Dependencies installed (`pnpm install`)
- [ ] `.env.local` configured
- [ ] Schema generated (`pnpm run schema:fetch`)
- [ ] Dev server running (`pnpm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials

---

## 🚀 Next Steps

1. **Read** [Complete Documentation](./DOCUMENTATION.md)
2. **Explore** the codebase
3. **Create** your first component
4. **Test** it in the browser
5. **Commit** your changes

---

## 📞 Need Help?

- **Schema issues?** → [Schema Generation Docs](../schema-generation/)
- **Data cleanup?** → [Cleanup Utility](../utilities/CLEANUP_DATA.md)
- **Validation rules?** → [Data Validation](../data-validation/)
- **General questions?** → [Complete Documentation](./DOCUMENTATION.md)

---

## 🎉 You're Ready!

You now have everything you need to start developing. Happy coding! 🚀
