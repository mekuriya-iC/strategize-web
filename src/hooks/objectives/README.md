# Objectives Hooks

Comprehensive collection of React hooks for managing objectives, KPIs, strategic periods, and assignments in the Strategize application.

---

## 📋 Table of Contents

- [Data Fetching Hooks](#data-fetching-hooks)
- [Mutation Hooks](#mutation-hooks)
- [Assignment Hooks](#assignment-hooks)
- [Form State Hooks](#form-state-hooks)
- [Utility Hooks](#utility-hooks)
- [Hook Patterns](#hook-patterns)
- [Best Practices](#best-practices)

---

## Data Fetching Hooks

### `useObjectives(variables?)`

Fetches a paginated list of objectives with optional filtering.

**Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 10
  search?: string;      // Optional search term
  assigneeId?: string;  // Filter by assignee
}
```

**Returns:**
```typescript
{
  objectives: Objective[];  // Array of objectives
  meta: {                   // Pagination metadata
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}
```

**Usage:**
```typescript
const { objectives, loading, error, refetch } = useObjectives({
  page: 1,
  limit: 20,
  search: 'revenue'
});
```

**Pattern:** ✅ Object destructuring return

---

### `useObjective(variables)`

Fetches a single objective by ID.

**Parameters:**
```typescript
{
  objectiveId: string;  // Required
}
```

**Returns:**
```typescript
{
  objective: Objective | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}
```

**Usage:**
```typescript
const { objective, loading } = useObjective({ 
  objectiveId: 'obj-123' 
});
```

**Pattern:** ✅ Object destructuring return

---

### `useKPIs(variables?)`

Fetches KPIs, optionally filtered by objective.

**Parameters:**
```typescript
{
  objectiveId?: string;  // Optional filter
  kpiId?: string;        // Fetch single KPI
}
```

**Returns:**
```typescript
{
  kpis: Kpi[];          // Array of KPIs
  kpi: Kpi | undefined; // Single KPI (if kpiId provided)
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}
```

**Usage:**
```typescript
// Fetch all KPIs for an objective
const { kpis, loading } = useKPIs({ objectiveId: 'obj-123' });

// Fetch single KPI
const { kpi } = useKPIs({ kpiId: 'kpi-456' });
```

**Pattern:** ✅ Object destructuring return

---

### `useStrategicPeriods()`

Fetches all strategic periods.

**Returns:**
```typescript
{
  strategicPeriods: StrategicPeriod[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => void;
}
```

**Usage:**
```typescript
const { strategicPeriods, loading } = useStrategicPeriods();
```

**Pattern:** ✅ Object destructuring return

---

## Mutation Hooks

### `useObjectiveMutations()`

Provides functions to create, update, and delete objectives.

**Returns:**
```typescript
{
  createObjective: (variables) => Promise<Objective>;
  updateObjective: (variables) => Promise<Objective>;
  removeObjective: (variables) => Promise<boolean>;
  loading: boolean;  // True if any mutation is in progress
  error: ApolloError | undefined;
}
```

**Usage:**
```typescript
const { createObjective, updateObjective, loading } = useObjectiveMutations();

// Create objective
const newObjective = await createObjective({
  input: {
    name: 'Increase Revenue',
    type: 'CORPORATE',
    strategicPeriodId: 'period-123'
  }
});

// Update objective
await updateObjective({
  input: {
    objectiveId: 'obj-123',
    name: 'Updated Name'
  }
});
```

**Pattern:** ✅ Object destructuring return, async functions

---

### `useKPIMutations()`

Provides functions to create, update, and delete KPIs.

**Returns:**
```typescript
{
  createKpi: (variables) => Promise<Kpi>;
  updateKpi: (variables) => Promise<Kpi>;
  updateKpiTargets: (kpiId, targets) => Promise<Kpi>;
  removeKpi: (variables) => Promise<boolean>;
  loading: boolean;
  error: ApolloError | undefined;
}
```

**Usage:**
```typescript
const { createKpi, updateKpiTargets } = useKPIMutations();

// Create KPI
const newKpi = await createKpi({
  name: 'Revenue Growth',
  baseline: 1000000,
  weight: 30,
  unitType: 'NUMBER_MILLION',
  objectiveId: 'obj-123',
  targets: []
});

// Update targets
await updateKpiTargets('kpi-456', [
  { timeline: '2025-Q1', target: 1200000 },
  { timeline: '2025-Q2', target: 1400000 }
]);
```

**Pattern:** ✅ Object destructuring return, async functions

---

### `useStrategicPeriodMutations()`

Provides functions to create and update strategic periods.

**Returns:**
```typescript
{
  createStrategicPeriod: (variables) => Promise<StrategicPeriod>;
  updateStrategicPeriod: (variables) => Promise<StrategicPeriod>;
  loading: boolean;
  error: ApolloError | undefined;
}
```

**Pattern:** ✅ Object destructuring return

---

## Assignment Hooks

### `useObjectiveAssignment()`

Core hook for assigning objectives to divisions, departments, or personnel.

**Returns:**
```typescript
{
  assignObjective: (input) => Promise<Objective>;
  loading: boolean;
}
```

**Usage:**
```typescript
const { assignObjective, loading } = useObjectiveAssignment();

const assigned = await assignObjective({
  objectiveId: 'obj-123',
  assigneeId: 'div-456',
  assignerId: 'emp-789',
  assigneeType: 'DIVISION',
  kpis: ['kpi-1', 'kpi-2']
});
```

**Pattern:** ✅ Object destructuring return

---

### ⚠️ Assignment State Hooks (Complex - Needs Consolidation)

The following hooks work together to manage assignment workflow:

1. **`useAssignmentState()`** - Manages selection state
2. **`useAssignmentData()`** - Fetches available assignees
3. **`useAssignmentActions()`** - Handles submission logic
4. **`useAssignmentDialog()`** - Orchestrates the entire dialog

**Current Issue:** 4 separate hooks for one feature (over-engineered)

**Recommendation:** Use `useAssignmentDialog()` as the main hook, which internally uses the others.

**Usage:**
```typescript
const {
  // State
  selectedKPIs,
  selectedAssignees,
  assignments,
  
  // Actions
  handleAddToAssignments,
  handleSubmit,
  
  // Data
  filteredDivisions,
  filteredDepartments,
  
  // Status
  isSubmitting,
  isFormValid
} = useAssignmentDialog({
  open: true,
  onOpenChange: setOpen,
  objective: currentObjective,
  kpis: objectiveKPIs,
  onSuccess: () => refetch()
});
```

**Pattern:** ⚠️ Complex, needs consolidation

---

## Form State Hooks

### ⚠️ KPI Form Hooks (Needs Consolidation)

Three separate hooks for KPI form management:

1. **`useCreateKPIForm()`** - Create KPI form state
2. **`useKPIFormState()`** - General KPI form state
3. **`useUpdateKPIState()`** - Update KPI form state

**Current Issue:** 3 hooks for similar functionality

**Recommendation:** Consolidate into single `useKPIForm(mode)` hook

**Proposed Usage:**
```typescript
// Create mode
const form = useKPIForm({ mode: 'create', objectiveId: 'obj-123' });

// Update mode
const form = useKPIForm({ mode: 'update', kpiId: 'kpi-456' });

// Returns
{
  formData: KPIFormData;
  errors: ValidationErrors;
  handleChange: (field, value) => void;
  handleSubmit: () => Promise<void>;
  isValid: boolean;
  loading: boolean;
}
```

**Pattern:** ⚠️ Needs consolidation

---

## Utility Hooks

### `useAnalytics()`

Fetches analytics data for objectives and KPIs.

**Returns:**
```typescript
{
  analytics: AnalyticsData;
  loading: boolean;
  error: ApolloError | undefined;
}
```

**Pattern:** ✅ Object destructuring return

---

### `useAutoSelectStrategicPeriod()`

Automatically selects the current strategic period for non-admin users.

**Usage:**
```typescript
// Just call it in your component
useAutoSelectStrategicPeriod();
```

**Pattern:** ✅ Side-effect only hook

---

### `useObjectivesOrder()`

Manages the order of objectives in a list.

**Returns:**
```typescript
{
  orderedObjectives: Objective[];
  reorderObjectives: (startIndex, endIndex) => void;
}
```

**Pattern:** ✅ Object destructuring return

---

## Hook Patterns

### ✅ Good Patterns (Consistent)

1. **Object Destructuring Return**
   ```typescript
   const { data, loading, error, refetch } = useHook();
   ```

2. **Async Mutation Functions**
   ```typescript
   const { createItem, loading } = useMutations();
   await createItem(variables);
   ```

3. **Consistent Naming**
   - Data hooks: `use[Entity]` or `use[Entity]s`
   - Mutation hooks: `use[Entity]Mutations`
   - State hooks: `use[Feature]State`

### ⚠️ Patterns Needing Improvement

1. **Inconsistent Return Patterns**
   ```typescript
   // ❌ Some hooks return arrays
   const [data, loading, error] = useHook();
   
   // ✅ Should use objects
   const { data, loading, error } = useHook();
   ```

2. **Missing Refetch**
   ```typescript
   // ❌ Some hooks don't expose refetch
   const { data, loading } = useHook();
   
   // ✅ Should expose refetch
   const { data, loading, refetch } = useHook();
   ```

3. **Over-abstraction**
   ```typescript
   // ❌ Too many hooks for one feature
   useFeatureState()
   useFeatureData()
   useFeatureActions()
   useFeatureDialog()
   
   // ✅ Should be one or two hooks
   useFeature()
   ```

---

## Best Practices

### 1. Always Expose Refetch

```typescript
// ✅ Good
export const useObjectives = () => {
  const { data, loading, error, refetch } = useQuery(GET_OBJECTIVES);
  return { objectives: data?.objectives, loading, error, refetch };
};
```

### 2. Use Object Destructuring

```typescript
// ✅ Good - Clear and flexible
const { objectives, loading, error } = useObjectives();

// ❌ Bad - Order matters, unclear
const [objectives, loading, error] = useObjectives();
```

### 3. Handle Loading and Error States

```typescript
const { objectives, loading, error } = useObjectives();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return <ObjectiveList objectives={objectives} />;
```

### 4. Provide Default Values

```typescript
// ✅ Good - Prevents undefined errors
return {
  objectives: data?.objectives?.items || [],
  meta: data?.objectives?.meta,
  loading,
  error
};
```

### 5. Use TypeScript Properly

```typescript
// ✅ Good - Fully typed
interface UseObjectivesResult {
  objectives: Objective[];
  loading: boolean;
  error?: ApolloError;
  refetch: () => void;
}

export const useObjectives = (): UseObjectivesResult => {
  // ...
};
```

---

## Common Issues & Solutions

### Issue 1: Hook Not Refetching

**Problem:** Data doesn't update after mutation

**Solution:** Ensure refetch is exposed and called
```typescript
const { objectives, refetch } = useObjectives();
const { createObjective } = useObjectiveMutations();

const handleCreate = async (data) => {
  await createObjective(data);
  await refetch(); // ✅ Refetch after mutation
};
```

### Issue 2: Stale Data

**Problem:** Seeing old data after navigation

**Solution:** Use `cache-and-network` fetch policy
```typescript
useQuery(GET_OBJECTIVES, {
  fetchPolicy: 'cache-and-network' // ✅ Always fetch fresh data
});
```

### Issue 3: Too Many Re-renders

**Problem:** Component re-renders excessively

**Solution:** Memoize hook results
```typescript
const objectives = useMemo(
  () => data?.objectives?.items || [],
  [data?.objectives?.items]
);
```

---

## Migration Guide

### Consolidating Assignment Hooks

**Before:**
```typescript
const state = useAssignmentState();
const data = useAssignmentData();
const actions = useAssignmentActions({ onSuccess, onClose });
```

**After:**
```typescript
const assignment = useAssignmentDialog({
  open,
  onOpenChange,
  objective,
  kpis,
  onSuccess
});
```

### Consolidating KPI Form Hooks

**Before:**
```typescript
const createForm = useCreateKPIForm();
const formState = useKPIFormState();
const updateState = useUpdateKPIState();
```

**After:**
```typescript
const form = useKPIForm({ 
  mode: 'create', // or 'update'
  objectiveId: 'obj-123' 
});
```

---

## Hook Dependency Graph

```
useObjectives
  └─ GET_OBJECTIVES query

useObjectiveMutations
  ├─ CREATE_OBJECTIVE mutation
  ├─ UPDATE_OBJECTIVE mutation
  └─ REMOVE_OBJECTIVE mutation
  └─ Invalidates: useObjectives cache

useObjectiveAssignment
  ├─ ASSIGN_OBJECTIVE mutation
  └─ Refetches: useObjectives, useKPIs

useAssignmentDialog
  ├─ useAssignmentState
  ├─ useAssignmentData
  ├─ useAssignmentActions
  ├─ useObjectiveAssignment
  ├─ useObjectiveMutations
  └─ useKPIMutations
```

---

## Performance Tips

1. **Use Skip Wisely**
   ```typescript
   useQuery(GET_OBJECTIVE, {
     skip: !objectiveId // ✅ Don't query without ID
   });
   ```

2. **Debounce Search**
   ```typescript
   const debouncedSearch = useDebounce(searchTerm, 300);
   useObjectives({ search: debouncedSearch });
   ```

3. **Paginate Large Lists**
   ```typescript
   useObjectives({ page: currentPage, limit: 20 });
   ```

4. **Cache Strategically**
   ```typescript
   useQuery(GET_OBJECTIVES, {
     fetchPolicy: 'cache-first' // ✅ For static data
   });
   ```

---

## Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useObjectives } from './useObjectives';

test('fetches objectives', async () => {
  const { result } = renderHook(() => useObjectives());
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(result.current.objectives).toHaveLength(10);
});
```

---

## Future Improvements

1. ✅ Add index.ts for centralized exports
2. ✅ Consolidate assignment hooks (4 → 1)
3. ✅ Consolidate KPI form hooks (3 → 1)
4. ✅ Standardize all return patterns to object destructuring
5. ✅ Add refetch to all data hooks
6. ✅ Add comprehensive TypeScript types
7. ✅ Add JSDoc comments to all hooks
8. ✅ Create unit tests for all hooks

---

**Last Updated:** April 21, 2026  
**Maintainer:** Development Team  
**Status:** Active Development
