# Submissions Hooks

React hooks for managing objective and KPI submissions, approvals, and the submission workflow.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Data Fetching Hooks](#data-fetching-hooks)
- [Mutation Hooks](#mutation-hooks)
- [Utility Hooks](#utility-hooks)
- [Hook Patterns](#hook-patterns)
- [Best Practices](#best-practices)

---

## Overview

The submissions module handles the workflow of submitting objectives and KPIs for approval, tracking submission status, and managing the approval process.

### Submission Lifecycle

```
1. NOT_SUBMITTED → User creates objective/KPI
2. PENDING       → User submits for approval
3. APPROVED      → Manager/Admin approves
   OR
   REJECTED      → Manager/Admin rejects with reason
```

---

## Data Fetching Hooks

### `useSubmissions(variables)`

Fetches submissions with filtering options.

**Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  type?: 'OBJECTIVE' | 'KPI';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  level?: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL';
}
```

**Returns:**
```typescript
{
  submissions: Submission[];
  loading: boolean;
  error?: Error;
  meta?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
  refetch: () => void;
}
```

**Usage:**
```typescript
// Fetch pending objective submissions
const { submissions, loading } = useSubmissions({
  type: 'OBJECTIVE',
  status: 'PENDING',
  page: 1,
  limit: 20
});
```

**Pattern:** ✅ Object destructuring return

---

### `useSubmission(submissionId)`

Fetches a single submission by ID.

**Parameters:**
```typescript
{
  submissionId: string;
}
```

**Returns:**
```typescript
{
  submission: Submission | undefined;
  loading: boolean;
  error?: Error;
  refetch: () => void;
}
```

**Pattern:** ✅ Object destructuring return

---

### `useSubmissionQueries()`

Provides multiple submission queries for different contexts.

**Returns:**
```typescript
{
  getPendingSubmissions: (variables) => Promise<Submission[]>;
  getSubmissionsByStatus: (status) => Promise<Submission[]>;
  getKPISubmissions: (variables) => Promise<Submission[]>;
}
```

**Usage:**
```typescript
const { getPendingSubmissions } = useSubmissionQueries();

const pending = await getPendingSubmissions({
  type: 'OBJECTIVE',
  level: 'DIVISION'
});
```

**Pattern:** ✅ Object destructuring return

---

### `useSubmissionApprovals()`

Fetches submissions that require approval from the current user.

**Returns:**
```typescript
{
  submissions: GroupedSubmission[];
  loading: boolean;
  error?: Error;
  refetch: () => void;
}
```

**Usage:**
```typescript
const { submissions, loading, refetch } = useSubmissionApprovals();

// submissions are grouped by objective with associated KPI submissions
```

**Pattern:** ✅ Object destructuring return

---

## Mutation Hooks

### `useSubmissionMutations()`

Provides functions to create, update, and manage submissions.

**Returns:**
```typescript
{
  createSubmission: (input) => Promise<Submission>;
  updateSubmission: (input) => Promise<Submission>;
  bulkCreateSubmissions: (inputs) => Promise<Submission[]>;
  loading: boolean;
  error?: Error;
}
```

**Usage:**
```typescript
const { createSubmission, loading } = useSubmissionMutations();

// Submit objective for approval
const submission = await createSubmission({
  input: {
    itemId: 'obj-123',
    itemType: 'OBJECTIVE',
    type: 'OBJECTIVE',
    level: 'DIVISION',
    status: 'PENDING'
  }
});
```

**Pattern:** ✅ Object destructuring return, async functions

---

### `useSubmissionApprovalMutations()`

Provides functions to approve or reject submissions.

**Returns:**
```typescript
{
  approveSubmission: (submissionId, reason?) => Promise<Submission>;
  rejectSubmission: (submissionId, reason) => Promise<Submission>;
  bulkApprove: (submissionIds) => Promise<Submission[]>;
  bulkReject: (submissionIds, reason) => Promise<Submission[]>;
  loading: boolean;
  error?: Error;
}
```

**Usage:**
```typescript
const { approveSubmission, rejectSubmission } = useSubmissionApprovalMutations();

// Approve submission
await approveSubmission('sub-123');

// Reject with reason
await rejectSubmission('sub-456', 'Targets are unrealistic');
```

**Pattern:** ✅ Object destructuring return, async functions

---

## Utility Hooks

### `useDepartmentHierarchy()`

Fetches department hierarchy for submission routing.

**Returns:**
```typescript
{
  hierarchy: DepartmentHierarchy;
  loading: boolean;
  error?: Error;
}
```

**Usage:**
```typescript
const { hierarchy, loading } = useDepartmentHierarchy();

// hierarchy contains division -> department -> employee relationships
```

**Pattern:** ✅ Object destructuring return

---

## Hook Patterns

### ✅ Good Patterns

1. **Consistent Return Structure**
   ```typescript
   const { submissions, loading, error, refetch } = useSubmissions();
   ```

2. **Async Mutation Functions**
   ```typescript
   const { createSubmission } = useSubmissionMutations();
   await createSubmission(input);
   ```

3. **Error Handling**
   ```typescript
   const { submissions, error } = useSubmissions();
   if (error) {
     toast.error('Failed to load submissions');
   }
   ```

### ⚠️ Patterns to Improve

1. **Expose Refetch Everywhere**
   ```typescript
   // ✅ All data hooks should expose refetch
   const { submissions, refetch } = useSubmissions();
   ```

2. **Consistent Error Types**
   ```typescript
   // ✅ Use consistent error type
   error?: ApolloError | Error;
   ```

---

## Best Practices

### 1. Handle Submission States

```typescript
const { submissions, loading, error } = useSubmissions();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return (
  <SubmissionList 
    submissions={submissions}
    onApprove={handleApprove}
    onReject={handleReject}
  />
);
```

### 2. Refetch After Mutations

```typescript
const { submissions, refetch } = useSubmissions();
const { approveSubmission } = useSubmissionApprovalMutations();

const handleApprove = async (submissionId: string) => {
  await approveSubmission(submissionId);
  await refetch(); // ✅ Refresh list
  toast.success('Submission approved');
};
```

### 3. Use Bulk Operations

```typescript
const { bulkApprove } = useSubmissionApprovalMutations();

// ✅ Approve multiple submissions at once
await bulkApprove(['sub-1', 'sub-2', 'sub-3']);
```

### 4. Filter Submissions Appropriately

```typescript
// ✅ Fetch only what you need
const { submissions } = useSubmissions({
  status: 'PENDING',
  type: 'OBJECTIVE',
  level: 'DIVISION'
});
```

---

## Common Workflows

### Workflow 1: Submit Objective for Approval

```typescript
const { createSubmission } = useSubmissionMutations();
const { updateObjective } = useObjectiveMutations();

const handleSubmit = async (objectiveId: string) => {
  try {
    // 1. Create submission
    await createSubmission({
      input: {
        itemId: objectiveId,
        itemType: 'OBJECTIVE',
        type: 'OBJECTIVE',
        level: 'DIVISION',
        status: 'PENDING'
      }
    });
    
    // 2. Update objective status
    await updateObjective({
      input: {
        objectiveId,
        status: 'PENDING'
      }
    });
    
    toast.success('Objective submitted for approval');
  } catch (error) {
    toast.error('Failed to submit objective');
  }
};
```

### Workflow 2: Approve Submission

```typescript
const { approveSubmission } = useSubmissionApprovalMutations();
const { updateObjective } = useObjectiveMutations();
const { refetch } = useSubmissions();

const handleApprove = async (submission: Submission) => {
  try {
    // 1. Approve submission
    await approveSubmission(submission.submissionId);
    
    // 2. Update objective status
    if (submission.objective) {
      await updateObjective({
        input: {
          objectiveId: submission.objective.objectiveId,
          status: 'APPROVED'
        }
      });
    }
    
    // 3. Refresh list
    await refetch();
    
    toast.success('Submission approved');
  } catch (error) {
    toast.error('Failed to approve submission');
  }
};
```

### Workflow 3: Reject Submission with Reason

```typescript
const { rejectSubmission } = useSubmissionApprovalMutations();
const { updateObjective } = useObjectiveMutations();

const handleReject = async (
  submission: Submission,
  reason: string
) => {
  try {
    // 1. Reject submission with reason
    await rejectSubmission(submission.submissionId, reason);
    
    // 2. Update objective status
    if (submission.objective) {
      await updateObjective({
        input: {
          objectiveId: submission.objective.objectiveId,
          status: 'REJECTED'
        }
      });
    }
    
    toast.success('Submission rejected');
  } catch (error) {
    toast.error('Failed to reject submission');
  }
};
```

---

## Types

### Submission

```typescript
interface Submission {
  submissionId: string;
  itemId: string;
  itemType: 'OBJECTIVE' | 'KPI';
  type: 'OBJECTIVE' | 'KPI';
  level: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL';
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  objective?: Objective;
  kpi?: Kpi;
}
```

### GroupedSubmission

```typescript
interface GroupedSubmission {
  submissionId: string;
  status: string;
  reason?: string;
  objective?: Objective;
  associatedKpiSubmissions?: Submission[];
}
```

---

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSubmissions } from './useSubmissions';

test('fetches pending submissions', async () => {
  const { result } = renderHook(() => 
    useSubmissions({ status: 'PENDING' })
  );
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(result.current.submissions).toHaveLength(5);
  expect(result.current.submissions[0].status).toBe('PENDING');
});
```

---

## Future Improvements

1. ✅ Add batch approval/rejection
2. ✅ Add submission history tracking
3. ✅ Add notification system for approvals
4. ✅ Add submission analytics
5. ✅ Add automated approval rules
6. ✅ Add submission templates

---

**Last Updated:** April 21, 2026  
**Maintainer:** Development Team  
**Status:** Active Development
