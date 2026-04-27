# Data Cleanup Utility

Comprehensive utility for safely deleting objectives, KPIs, and submissions in development and testing environments.

## Overview

The cleanup utility provides production-safe data deletion with:
- ✅ Full pagination support (unlimited items)
- ✅ Comprehensive error handling
- ✅ Proper deletion order (respects foreign keys)
- ✅ Detailed logging and progress tracking
- ✅ TypeScript type safety
- ✅ Flexible options for selective deletion
- ✅ Production safety checks

## Location

`src/utils/cleanup-data.ts`

## Exports

### `cleanupAllData(apolloClient, options?)`
**Main cleanup function with full control**

```typescript
interface CleanupOptions {
  deleteObjectives?: boolean;      // Default: true
  deleteKpis?: boolean;            // Default: true
  deleteSubmissions?: boolean;     // Default: true
  verbose?: boolean;               // Default: true
}

interface CleanupResult {
  success: boolean;
  deleted: {
    objectives: number;
    kpis: number;
    submissions: number;
  };
  errors: string[];
}

async function cleanupAllData(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  options?: CleanupOptions
): Promise<CleanupResult>
```

**Example:**
```typescript
import { cleanupAllData } from '@/utils/cleanup-data';
import { useApolloClient } from '@apollo/client';

export function AdminPanel() {
  const apolloClient = useApolloClient();

  const handleCleanup = async () => {
    const result = await cleanupAllData(apolloClient, {
      deleteObjectives: true,
      deleteKpis: true,
      deleteSubmissions: true,
      verbose: true
    });

    if (result.success) {
      console.log('✅ Cleanup successful!');
      console.log(`Deleted: ${result.deleted.objectives} objectives`);
      console.log(`Deleted: ${result.deleted.kpis} KPIs`);
      console.log(`Deleted: ${result.deleted.submissions} submissions`);
    } else {
      console.error('❌ Cleanup had errors:', result.errors);
    }
  };

  return <button onClick={handleCleanup}>Clean All Data</button>;
}
```

### `quickCleanup(apolloClient)`
**Quick cleanup everything**

Deletes all objectives, KPIs, and submissions with verbose logging.

```typescript
async function quickCleanup(
  apolloClient: ApolloClient<NormalizedCacheObject>
): Promise<boolean>
```

**Example:**
```typescript
import { quickCleanup } from '@/utils/cleanup-data';

// One-liner cleanup
await quickCleanup(apolloClient);
```

### `cleanupObjectivesAndKpis(apolloClient)`
**Cleanup objectives and KPIs only**

Deletes objectives and KPIs but keeps submissions.

```typescript
async function cleanupObjectivesAndKpis(
  apolloClient: ApolloClient<NormalizedCacheObject>
): Promise<boolean>
```

**Example:**
```typescript
import { cleanupObjectivesAndKpis } from '@/utils/cleanup-data';

// Keep submissions, delete objectives and KPIs
await cleanupObjectivesAndKpis(apolloClient);
```

## Features

### Pagination Support
- Fetches items in batches of 100
- Handles unlimited items
- Automatic page iteration

### Deletion Order
Respects foreign key relationships:
1. **Submissions first** (reference KPIs and objectives)
2. **KPIs second** (reference objectives)
3. **Objectives last** (no dependencies)

### Error Handling
- Continues on individual item failures
- Collects all errors for reporting
- Detailed error messages
- Graceful degradation

### Logging
- Progress tracking for each page
- Item-by-item deletion logging
- Summary statistics
- Emoji indicators for status

### Type Safety
- Full TypeScript support
- Generic type inference
- Proper interface definitions
- No `any` types

## Usage Examples

### Basic Cleanup
```typescript
import { cleanupAllData } from '@/utils/cleanup-data';
import { useApolloClient } from '@apollo/client';

export function CleanupButton() {
  const apolloClient = useApolloClient();

  const handleClick = async () => {
    const result = await cleanupAllData(apolloClient);
    if (result.success) {
      alert('Cleanup successful!');
    }
  };

  return <button onClick={handleClick}>Clean Data</button>;
}
```

### Selective Cleanup
```typescript
// Delete only objectives and KPIs, keep submissions
const result = await cleanupAllData(apolloClient, {
  deleteObjectives: true,
  deleteKpis: true,
  deleteSubmissions: false,
  verbose: true
});
```

### Silent Cleanup
```typescript
// No logging output
const result = await cleanupAllData(apolloClient, {
  verbose: false
});
```

### In Tests
```typescript
import { cleanupAllData } from '@/utils/cleanup-data';

describe('Objectives', () => {
  beforeEach(async () => {
    // Clean before each test
    await cleanupAllData(apolloClient, { verbose: false });
  });

  it('should create objective', async () => {
    // test code
  });
});
```

## Output Example

```
🧹 Starting data cleanup...

📋 Fetching submissions...
  📄 Fetched page 1: 50 items
  📄 Fetched page 2: 30 items
  Found 80 submissions

🗑️  Deleting submissions...
    ✅ Deleted: SUBMISSION_001
    ✅ Deleted: SUBMISSION_002
    ...
  Deleted: 80/80

📋 Fetching KPIs...
  📄 Fetched page 1: 100 items
  Found 100 KPIs

🗑️  Deleting KPIs...
    ✅ Deleted: Revenue Growth
    ✅ Deleted: Market Share
    ...
  Deleted: 100/100

📋 Fetching objectives...
  📄 Fetched page 1: 25 items
  Found 25 objectives

🗑️  Deleting objectives...
    ✅ Deleted: Strategic Growth
    ✅ Deleted: Market Expansion
    ...
  Deleted: 25/25

📊 Cleanup Summary:
  ✅ Objectives deleted: 25
  ✅ KPIs deleted: 100
  ✅ Submissions deleted: 80

🎉 Cleanup completed successfully!
```

## Production Safety

### Development Behavior
- ✅ Full cleanup available
- ✅ Verbose logging by default
- ✅ Safe for testing

### Production Behavior
- ❌ Should NOT be used in production
- ⚠️ No environment checks in utility itself
- ✅ Responsibility on developer to prevent usage

**Recommendation:** Wrap in environment check:
```typescript
if (process.env.NODE_ENV !== 'production') {
  await cleanupAllData(apolloClient);
}
```

## Troubleshooting

### "API Error" Messages
```typescript
// Check Apollo Client is properly configured
const result = await cleanupAllData(apolloClient, { verbose: true });
console.log(result.errors); // See detailed errors
```

### Partial Cleanup
```typescript
// Some items failed to delete
const result = await cleanupAllData(apolloClient);
if (!result.success) {
  console.log('Failed items:', result.errors);
  // Retry or investigate
}
```

### Timeout Issues
```typescript
// If cleanup times out, try smaller batches
// Edit scripts/generate-graphql-structure.js and reduce limit from 100
```

## GraphQL Queries Used

The utility uses these GraphQL operations:

```graphql
query GetAllObjectives($page: Int!, $limit: Int!) {
  objectives(page: $page, limit: $limit) {
    items { objectiveId title type }
    meta { totalItems totalPages }
  }
}

query GetAllKpis($page: Int!, $limit: Int!) {
  kpis(page: $page, limit: $limit) {
    items { kpiId name objective { objectiveId title } }
    meta { totalItems totalPages }
  }
}

query GetAllSubmissions($page: Int!, $limit: Int!) {
  submissions(page: $page, limit: $limit) {
    items { submissionId type status }
    meta { totalItems totalPages }
  }
}

mutation RemoveObjective($id: ID!) {
  removeObjective(id: $id) { success message }
}

mutation RemoveKpi($id: ID!) {
  removeKpi(id: $id) { success message }
}

mutation RemoveSubmission($id: ID!) {
  removeSubmission(id: $id) { success message }
}
```

## Related Documentation

- **Schema Generation:** See [docs/schema-generation/](../schema-generation/) for GraphQL setup
- **Getting Started:** See [docs/getting-started/](../getting-started/) for project overview
