# Complete GraphQL Schema Generation System

## Overview

This document describes the complete, production-ready GraphQL schema generation system with organized file structure, automatic cleanup, and safe development workflows.

## System Architecture

```
Schema Generation Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. pnpm run schema:fetch                                    │
│    └─ Fetches schema from local/remote API                 │
│    └─ Saves introspection JSON & SDL                       │
│    └─ [DEV ONLY] Cleans old GraphQL files                  │
│    └─ Runs code generation                                 │
│    └─ [DEV ONLY] Generates organized structure             │
└─────────────────────────────────────────────────────────────┘

GraphQL File Organization:
src/graphql/
├── queries/
│   ├── objectives.ts          (GET_OBJECTIVES, GET_OBJECTIVE_BY_ID)
│   ├── kpis.ts                (GET_KPIS, GET_KPI_BY_ID)
│   ├── submissions.ts         (GET_SUBMISSIONS, GET_SUBMISSION_BY_ID)
│   ├── departments.ts         (GET_DEPARTMENTS, GET_DEPARTMENT_BY_ID)
│   ├── divisions.ts           (GET_DIVISIONS, GET_DIVISION_BY_ID)
│   ├── employees.ts           (GET_EMPLOYEES, GET_EMPLOYEE_BY_ID)
│   └── index.ts               (exports all queries)
├── mutations/
│   ├── objectives.ts          (CREATE, UPDATE, DELETE)
│   ├── kpis.ts                (CREATE, UPDATE, DELETE)
│   ├── submissions.ts         (CREATE, UPDATE, DELETE)
│   ├── departments.ts         (CREATE, UPDATE, DELETE)
│   ├── divisions.ts           (CREATE, UPDATE, DELETE)
│   ├── employees.ts           (CREATE, UPDATE, DELETE)
│   └── index.ts               (exports all mutations)
└── fragments/
    ├── -objectives.ts         (ObjectivesFragment)
    ├── -kpis.ts               (KpisFragment)
    ├── -submissions.ts        (SubmissionsFragment)
    ├── -departments.ts        (DepartmentsFragment)
    ├── -divisions.ts          (DivisionsFragment)
    ├── -employees.ts          (EmployeesFragment)
    └── index.ts               (exports all fragments)
```

## Scripts

### 1. `pnpm run schema:fetch`
**Main entry point for schema generation**

Workflow:
1. Fetches schema from API (local or remote)
2. Saves `graphql.schema.json` (introspection)
3. Saves `schema.graphql` (SDL format)
4. **[DEV ONLY]** Cleans old GraphQL files
5. Runs code generation (`graphql-codegen`)
6. **[DEV ONLY]** Generates organized GraphQL structure

**Environment Variables:**
- `GRAPHQL_SCHEMA_URL` - API endpoint (default: `http://localhost:3000/graphql`)
- `NODE_ENV` - Controls cleanup behavior (production = no cleanup)

**Usage:**
```bash
# Fetch from default local API
pnpm run schema:fetch

# Fetch from custom API
GRAPHQL_SCHEMA_URL=http://api.example.com/graphql pnpm run schema:fetch

# Production (no cleanup)
NODE_ENV=production pnpm run schema:fetch
```

### 2. `pnpm run schema:generate`
**Code generation only** (runs as part of schema:fetch)

Generates TypeScript types from GraphQL operations in `src/graphql/`.

### 3. `pnpm run schema:clean`
**Manual cleanup** (runs automatically during schema:fetch in dev)

Deletes entire `src/graphql/` directory. Only works in development.

### 4. `pnpm run schema:generate-structure`
**Generate organized GraphQL files** (runs automatically during schema:fetch in dev)

Creates query, mutation, and fragment files for each entity.

## File Structure Details

### Query Files (`src/graphql/queries/`)

Each file contains:
- `GET_<ENTITY>` - Fetch all with pagination
- `GET_<ENTITY>_BY_ID` - Fetch single by ID

Example: `objectives.ts`
```typescript
import { gql } from '@apollo/client';
import { ObjectivesFragment } from '../fragments/-objectives';

export const GET_OBJECTIVES = gql`
  query GetObjectives($page: Int, $limit: Int, $filter: String) {
    objectives(page: $page, limit: $limit, filter: $filter) {
      items {
        ...ObjectivesFragment
      }
      meta {
        totalItems
        totalPages
        currentPage
      }
    }
  }
  ${ObjectivesFragment}
`;

export const GET_OBJECTIVES_BY_ID = gql`
  query GetObjectivesById($id: ID!) {
    objective(id: $id) {
      ...ObjectivesFragment
    }
  }
  ${ObjectivesFragment}
`;
```

### Mutation Files (`src/graphql/mutations/`)

Each file contains:
- `CREATE_<ENTITY>` - Create new
- `UPDATE_<ENTITY>` - Update existing
- `DELETE_<ENTITY>` - Delete

Example: `objectives.ts`
```typescript
import { gql } from '@apollo/client';
import { ObjectivesFragment } from '../fragments/-objectives';

export const CREATE_OBJECTIVES = gql`
  mutation CreateObjectives($input: CreateObjectivesInput!) {
    createObjectives(input: $input) {
      ...ObjectivesFragment
    }
  }
  ${ObjectivesFragment}
`;

export const UPDATE_OBJECTIVES = gql`
  mutation UpdateObjectives($id: ID!, $input: UpdateObjectivesInput!) {
    updateObjectives(id: $id, input: $input) {
      ...ObjectivesFragment
    }
  }
  ${ObjectivesFragment}
`;

export const DELETE_OBJECTIVES = gql`
  mutation DeleteObjectives($id: ID!) {
    deleteObjectives(id: $id) {
      success
      message
    }
  }
`;
```

### Fragment Files (`src/graphql/fragments/`)

Each file contains common fields for an entity.

Example: `-objectives.ts`
```typescript
import { gql } from '@apollo/client';

export const ObjectivesFragment = gql`
  fragment ObjectivesFragment on Objectives {
    objectiveId
    title
    description
    type
    status
    startDate
    endDate
  }
`;
```

## Usage Examples

### Importing Queries
```typescript
import { GET_OBJECTIVES, GET_OBJECTIVES_BY_ID } from '@/graphql/queries/objectives';
import { useQuery } from '@apollo/client';

export function ObjectivesList() {
  const { data, loading } = useQuery(GET_OBJECTIVES, {
    variables: { page: 1, limit: 10 }
  });

  return (
    // render objectives
  );
}
```

### Importing Mutations
```typescript
import { CREATE_OBJECTIVES, UPDATE_OBJECTIVES, DELETE_OBJECTIVES } from '@/graphql/mutations/objectives';
import { useMutation } from '@apollo/client';

export function CreateObjective() {
  const [create] = useMutation(CREATE_OBJECTIVES);

  const handleCreate = async (input) => {
    await create({ variables: { input } });
  };

  return (
    // form
  );
}
```

### Importing All Queries/Mutations
```typescript
import * as queries from '@/graphql/queries';
import * as mutations from '@/graphql/mutations';

// Access as:
// queries.GET_OBJECTIVES
// mutations.CREATE_OBJECTIVES
```

## Production Safety

### Development Behavior
- ✅ Cleans old GraphQL files before regeneration
- ✅ Generates organized query/mutation/fragment files
- ✅ Full automation for rapid iteration

### Production Behavior
- ❌ NO cleanup (preserves existing files)
- ❌ NO structure generation (uses existing files)
- ✅ Only runs code generation
- ✅ Safe for CI/CD pipelines

**Control via `NODE_ENV`:**
```bash
# Development (default)
pnpm run schema:fetch

# Production
NODE_ENV=production pnpm run schema:fetch
```

## Workflow Examples

### Local Development with Local API

```bash
# 1. Start your local GraphQL API
# (in another terminal)
npm run dev  # or your API start command

# 2. Fetch schema and regenerate
pnpm run schema:fetch

# Output:
# 📡 Fetching schema from: http://localhost:3000/graphql
# ✅ Schema saved to: graphql.schema.json
# ✅ SDL saved to: schema.graphql
# 🧹 Cleaning up old GraphQL files...
# ✅ Old GraphQL files cleaned
# 🚀 Running code generation...
# ✅ Code generation completed successfully!
# 📁 Generating organized GraphQL structure...
# ✅ Fragment: src/graphql/fragments/-objectives.ts
# ✅ Query: src/graphql/queries/objectives.ts
# ✅ Mutation: src/graphql/mutations/objectives.ts
# ... (more entities)
# ✅ GraphQL structure generated successfully!
```

### Custom API Endpoint

```bash
GRAPHQL_SCHEMA_URL=http://api.staging.com/graphql pnpm run schema:fetch
```

### Production Deployment

```bash
# In CI/CD pipeline
NODE_ENV=production pnpm run schema:fetch
```

## Troubleshooting

### "API not reachable" Error
```bash
# Check API is running
curl http://localhost:3000/graphql

# Try custom endpoint
GRAPHQL_SCHEMA_URL=http://your-api/graphql pnpm run schema:fetch

# Check environment variables
echo $GRAPHQL_SCHEMA_URL
echo $NODE_ENV
```

### "Code generation failed" Error
```bash
# Check GraphQL operations are valid
pnpm run schema:generate

# Verify schema files exist
ls -la graphql.schema.json schema.graphql
```

### Files Not Regenerating
```bash
# Ensure development environment
NODE_ENV=development pnpm run schema:fetch

# Or manually clean and regenerate
pnpm run schema:clean
pnpm run schema:generate-structure
```

## Configuration Files

### `codegen.ts`
Controls code generation behavior:
- Schema source priority: `schema.graphql` > `graphql.schema.json` > API endpoint
- Documents: `src/graphql/**/*.ts` (excludes fragments)
- Output: `src/gql/` (TypeScript types)
- `ignoreNoDocuments: true` - Allows generation without queries

### `graphql.config.yml`
GraphQL IDE configuration (VS Code extension).

### `.env`
Environment variables:
```
GRAPHQL_SCHEMA_URL=http://localhost:3000/graphql
NODE_ENV=development
```

## Best Practices

1. **Always run `schema:fetch` after API changes**
   - Keeps types in sync with backend

2. **Commit generated files**
   - `graphql.schema.json` - For reference
   - `schema.graphql` - For IDE support
   - `src/graphql/` - For type safety

3. **Don't manually edit generated files**
   - They're regenerated on each `schema:fetch`
   - Edit the generator scripts instead

4. **Use fragments for reusable fields**
   - Reduces duplication
   - Easier to maintain

5. **Organize by entity**
   - One query file per entity
   - One mutation file per entity
   - One fragment file per entity

6. **Test after schema changes**
   - Run `pnpm run schema:fetch`
   - Check for TypeScript errors
   - Run tests: `pnpm run test`

## Adding New Entities

To add a new entity to the generation system:

1. Edit `scripts/generate-graphql-structure.js`
2. Add entry to `ENTITIES` object:
```javascript
const ENTITIES = {
  // ... existing entities
  newEntity: {
    queryName: 'newEntities',
    mutationNames: ['createNewEntity', 'updateNewEntity', 'removeNewEntity'],
    idField: 'newEntityId',
    fields: ['newEntityId', 'name', 'description'],
  },
};
```

3. Run `pnpm run schema:fetch` to regenerate

## Summary

This system provides:
- ✅ Organized GraphQL file structure
- ✅ Automatic cleanup in development
- ✅ Production-safe operations
- ✅ One-command schema regeneration
- ✅ Type-safe GraphQL operations
- ✅ Easy entity management
- ✅ CI/CD friendly
