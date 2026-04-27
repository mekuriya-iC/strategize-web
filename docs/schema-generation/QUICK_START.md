# Schema Generation - Quick Start

## One-Command Setup

```bash
# Fetch schema, clean old files, generate structure
pnpm run schema:fetch
```

That's it! This command:
1. ✅ Fetches schema from your API
2. ✅ Cleans old GraphQL files (dev only)
3. ✅ Generates organized query/mutation/fragment files
4. ✅ Runs code generation for TypeScript types

## File Structure After Generation

```
src/graphql/
├── queries/
│   ├── objectives.ts
│   ├── kpis.ts
│   ├── submissions.ts
│   ├── departments.ts
│   ├── divisions.ts
│   ├── employees.ts
│   └── index.ts
├── mutations/
│   ├── objectives.ts
│   ├── kpis.ts
│   ├── submissions.ts
│   ├── departments.ts
│   ├── divisions.ts
│   ├── employees.ts
│   └── index.ts
└── fragments/
    ├── -objectives.ts
    ├── -kpis.ts
    ├── -submissions.ts
    ├── -departments.ts
    ├── -divisions.ts
    ├── -employees.ts
    └── index.ts
```

## Usage Examples

### Query Example
```typescript
import { GET_OBJECTIVES } from '@/graphql/queries/objectives';
import { useQuery } from '@apollo/client';

const { data } = useQuery(GET_OBJECTIVES, {
  variables: { page: 1, limit: 10 }
});
```

### Mutation Example
```typescript
import { CREATE_OBJECTIVES } from '@/graphql/mutations/objectives';
import { useMutation } from '@apollo/client';

const [create] = useMutation(CREATE_OBJECTIVES);

await create({
  variables: {
    input: { title: 'New Objective', type: 'STRATEGIC' }
  }
});
```

## Environment Variables

```bash
# Custom API endpoint
GRAPHQL_SCHEMA_URL=http://api.example.com/graphql pnpm run schema:fetch

# Production (no cleanup)
NODE_ENV=production pnpm run schema:fetch
```

## Available Scripts

| Command | Purpose |
|---------|---------|
| `pnpm run schema:fetch` | Fetch schema + cleanup + generate (main command) |
| `pnpm run schema:generate` | Code generation only |
| `pnpm run schema:clean` | Delete old GraphQL files (dev only) |
| `pnpm run schema:generate-structure` | Generate query/mutation/fragment files |

## Key Features

✅ **Organized by Entity** - One file per entity for queries, mutations, fragments
✅ **Production Safe** - No cleanup in production
✅ **Automatic** - One command does everything
✅ **Type Safe** - Full TypeScript support
✅ **Pagination Ready** - All queries support pagination
✅ **Fragment Reuse** - Fragments for common fields

## Troubleshooting

**API not reachable?**
```bash
# Check API is running
curl http://localhost:3000/graphql

# Try custom endpoint
GRAPHQL_SCHEMA_URL=http://your-api/graphql pnpm run schema:fetch
```

**Files not regenerating?**
```bash
# Ensure development environment
NODE_ENV=development pnpm run schema:fetch
```

**TypeScript errors after generation?**
```bash
# Run code generation again
pnpm run schema:generate
```

## Next Steps

1. Start your GraphQL API
2. Run `pnpm run schema:fetch`
3. Import queries/mutations in your components
4. Use with Apollo Client hooks

See [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md) for detailed documentation.
