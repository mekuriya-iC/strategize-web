# Data Cleanup Utility Guide

## Overview

The cleanup utility safely deletes objectives, KPIs, and submissions from your database. It's designed for development and testing.

**Location:** `src/utils/cleanup-data.ts`

---

## Features

✅ **Pagination support** - Handles any number of items
✅ **Error handling** - Continues even if some deletions fail
✅ **Flexible options** - Delete specific data types
✅ **Verbose logging** - See exactly what's happening
✅ **Type-safe** - Full TypeScript support
✅ **Proper order** - Deletes in correct dependency order

---

## Usage

### Quick Cleanup (Delete Everything)

```typescript
import { quickCleanup } from '@/utils/cleanup-data';
import { apolloClient } from '@/lib/apollo-client';

// Delete all objectives, KPIs, and submissions
const success = await quickCleanup(apolloClient);

if (success) {
  console.log('✅ Cleanup successful');
} else {
  console.log('❌ Cleanup had errors');
}
```

### Cleanup Objectives & KPIs Only

```typescript
import { cleanupObjectivesAndKpis } from '@/utils/cleanup-data';
import { apolloClient } from '@/lib/apollo-client';

// Delete objectives and KPIs, keep submissions
const success = await cleanupObjectivesAndKpis(apolloClient);
```

### Custom Cleanup

```typescript
import { cleanupAllData } from '@/utils/cleanup-data';
import { apolloClient } from '@/lib/apollo-client';

// Delete only objectives
const result = await cleanupAllData(apolloClient, {
  deleteObjectives: true,
  deleteKpis: false,
  deleteSubmissions: false,
  verbose: true,
});

console.log(`Deleted ${result.deleted.objectives} objectives`);
console.log(`Errors: ${result.errors.length}`);
```

---

## In a Component

### Example: Admin Panel Cleanup Button

```typescript
import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { cleanupAllData } from '@/utils/cleanup-data';

export const AdminCleanupPanel = () => {
  const apolloClient = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCleanup = async () => {
    if (!confirm('Are you sure? This will delete all data.')) {
      return;
    }

    setLoading(true);
    try {
      const cleanupResult = await cleanupAllData(apolloClient, {
        deleteObjectives: true,
        deleteKpis: true,
        deleteSubmissions: true,
        verbose: true,
      });

      setResult(cleanupResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold mb-4">Data Cleanup</h2>

      <button
        onClick={handleCleanup}
        disabled={loading}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? 'Cleaning...' : 'Clean All Data'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Results:</h3>
          <p>✅ Objectives deleted: {result.deleted.objectives}</p>
          <p>✅ KPIs deleted: {result.deleted.kpis}</p>
          <p>✅ Submissions deleted: {result.deleted.submissions}</p>

          {result.errors.length > 0 && (
            <div className="mt-2 text-red-600">
              <p>⚠️ Errors: {result.errors.length}</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm">
                  - {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## In a Script/Utility

### Example: Development Setup Script

```typescript
// scripts/setup-dev.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { cleanupAllData } from '@/utils/cleanup-data';

async function setupDevelopment() {
  // Create Apollo Client
  const apolloClient = new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: 'http://localhost:3000/graphql',
      credentials: 'same-origin',
    }),
    cache: new InMemoryCache(),
  });

  console.log('🧹 Cleaning up old data...');
  const result = await cleanupAllData(apolloClient, {
    deleteObjectives: true,
    deleteKpis: true,
    deleteSubmissions: true,
    verbose: true,
  });

  if (result.success) {
    console.log('✅ Development environment ready!');
  } else {
    console.log('⚠️ Cleanup completed with errors');
  }
}

setupDevelopment();
```

---

## Return Value

The `cleanupAllData` function returns:

```typescript
interface CleanupResult {
  success: boolean;           // true if no errors
  deleted: {
    objectives: number;       // count deleted
    kpis: number;             // count deleted
    submissions: number;      // count deleted
  };
  errors: string[];           // list of errors
}
```

---

## Options

```typescript
interface CleanupOptions {
  deleteObjectives?: boolean;   // default: true
  deleteKpis?: boolean;         // default: true
  deleteSubmissions?: boolean;  // default: true
  verbose?: boolean;            // default: true (logs to console)
}
```

---

## Deletion Order

The utility deletes in this order to respect foreign key constraints:

1. **Submissions** (reference KPIs and objectives)
2. **KPIs** (reference objectives)
3. **Objectives** (no dependencies)

---

## Error Handling

The utility handles errors gracefully:

- ✅ Continues deleting even if some items fail
- ✅ Collects all errors and returns them
- ✅ Logs errors if `verbose: true`
- ✅ Returns `success: false` if any errors occurred

---

## Pagination

The utility automatically handles pagination:

- ✅ Fetches 100 items per page
- ✅ Continues until all items are fetched
- ✅ Works with any number of items

---

## When to Use

### ✅ Good Use Cases
- Development/testing
- Resetting database for new features
- Cleaning up test data
- Admin panel cleanup tool
- Development setup scripts

### ❌ Don't Use In
- Production (unless you really know what you're doing)
- Automated processes without confirmation
- Without backups

---

## Safety Tips

1. **Always confirm** before deleting
2. **Backup first** if data is important
3. **Test in development** first
4. **Use verbose mode** to see what's happening
5. **Check errors** after cleanup

---

## Example: Safe Cleanup with Confirmation

```typescript
import { cleanupAllData } from '@/utils/cleanup-data';
import { apolloClient } from '@/lib/apollo-client';

async function safeCleanup() {
  // Show confirmation
  const confirmed = confirm(
    'This will delete all objectives, KPIs, and submissions. Continue?'
  );

  if (!confirmed) {
    console.log('Cleanup cancelled');
    return;
  }

  // Run cleanup
  const result = await cleanupAllData(apolloClient, {
    verbose: true,
  });

  // Check result
  if (result.success) {
    console.log('✅ Cleanup successful');
    console.log(`Deleted: ${result.deleted.objectives} objectives`);
    console.log(`Deleted: ${result.deleted.kpis} KPIs`);
    console.log(`Deleted: ${result.deleted.submissions} submissions`);
  } else {
    console.log('❌ Cleanup had errors:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }
}

safeCleanup();
```

---

## Improvements Over Original

| Feature | Original | Improved |
|---------|----------|----------|
| Pagination | ❌ Limited to 1000 | ✅ Unlimited |
| Error handling | ⚠️ Basic | ✅ Comprehensive |
| Type safety | ❌ No types | ✅ Full TypeScript |
| Flexibility | ❌ All or nothing | ✅ Selective deletion |
| Logging | ⚠️ Basic | ✅ Detailed |
| Organization | ❌ Inline | ✅ Proper structure |
| Reusability | ❌ One-time use | ✅ Reusable functions |

---

## Summary

The improved cleanup utility is:

✅ **Production-ready** - Proper error handling
✅ **Flexible** - Delete what you need
✅ **Safe** - Respects dependencies
✅ **Reusable** - Multiple functions for different needs
✅ **Type-safe** - Full TypeScript support
✅ **Well-organized** - Proper file structure

Use it for development and testing!
