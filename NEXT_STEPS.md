# Next Steps - Code Refactoring

**Priority:** High  
**Estimated Time:** 2-3 days  
**Status:** Ready to Execute

---

## ✅ What's Been Done

1. ✅ Created shared EmptyState component
2. ✅ Updated all EmptyState usages
3. ✅ Added component pattern documentation
4. ✅ Configured ESLint to prevent console.log
5. ✅ Analyzed entire codebase
6. ✅ Created comprehensive documentation

---

## 🎯 Immediate Next Steps

### Step 1: Remove Console.log Statements (2-3 hours)

**Command to run:**
```bash
# See all console.log violations
pnpm lint

# Auto-fix what's possible
pnpm lint --fix
```

**Manual removal needed in:**

1. **Hooks** (Priority: High)
   - `src/hooks/objectives/useAssignmentActions.ts` - Remove 10 debug logs
   - `src/hooks/objectives/useAssignmentDialog.ts` - Remove 5 debug logs
   - `src/hooks/objectives/useObjectiveAssignment.ts` - Remove 4 debug logs
   - `src/hooks/objectives/useKPIs.ts` - Remove 2 debug logs (lines 42-43)

2. **Submission Components** (Priority: High)
   - `src/components/submissions/SubmitDialog.tsx` - Remove 10+ debug logs
   - `src/components/submissions/BulkSubmitDialog.tsx` - Remove 10+ debug logs
   - `src/components/submissions/ObjectiveWithKPIsSubmitDialog.tsx` - Remove 5+ logs

3. **Approval Components** (Priority: Medium)
   - `src/components/approvals/SubmissionApprovalTable.tsx` - Remove 5 debug logs
   - `src/components/approvals/SubmissionApprovalsTable.tsx` - Remove 5 debug logs
   - `src/components/approvals/ApprovalsTable.tsx` - Remove 1 log (line 256)

4. **Pages** (Priority: Low)
   - `src/app/dashboard/objectives/[id]/page.tsx` - Remove 2 logs
   - `src/app/dashboard/divisions/page.tsx` - Remove 2 logs (lines 226, 248)
   - `src/app/dashboard/departments/new/page.tsx` - Remove 1 log (line 15)

5. **Other** (Priority: Low)
   - `src/components/structure/StructureBuilder.tsx` - Remove 2 placeholder logs (lines 274, 282)
   - `src/components/dashboard/StrategySelector.tsx` - Remove 1 log (line 76)

**Keep these (intentional):**
- `src/lib/logger.ts` - Part of logger implementation (console.log is wrapped)

---

### Step 2: Remove Commented Code (1 hour)

**Files to clean:**

1. `src/components/approvals/SubmissionApprovalsTable.tsx`
   ```typescript
   // Lines 6-7: Remove commented imports
   // import { GET_SUBMISSIONS } from "@/lib/graphql/queries/submissions";
   // import { GET_KPI_SUBMISSIONS } from "@/lib/graphql/queries/kpis";
   ```

2. `src/components/approvals/SubmissionApprovalTable.tsx`
   ```typescript
   // Line 1541: Remove commented debug log
   // console.log(...)
   ```

3. `src/components/dashboard/OrgUnitSelector.tsx`
   ```typescript
   // Lines 27-29, 80-83: Remove commented debug logs
   // Debug logging - remove in production
   // console.log("OrgUnitSelector Debug:", { ... });
   ```

**Action:** Search for `// console.log` and `// import` patterns and remove

---

### Step 3: Add Error Boundaries (2-3 hours)

**Create these files:**

```bash
# Create error boundaries for all routes
touch src/app/dashboard/objectives/error.tsx
touch src/app/dashboard/approvals/error.tsx
touch src/app/dashboard/employees/error.tsx
touch src/app/dashboard/departments/error.tsx
touch src/app/dashboard/divisions/error.tsx
touch src/app/dashboard/admin/error.tsx
touch src/app/dashboard/reports/error.tsx
touch src/app/dashboard/settings/error.tsx
touch src/app/dashboard/structure/error.tsx
```

**Template to use:**
```typescript
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong!
      </h2>
      
      <p className="text-gray-600 mb-6 text-center max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      
      <Button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Try again
      </Button>
    </div>
  );
}
```

---

## 📋 Checklist

### Console.log Removal
- [ ] Run `pnpm lint` to see all violations
- [ ] Run `pnpm lint --fix` for auto-fixes
- [ ] Remove logs from `useAssignmentActions.ts`
- [ ] Remove logs from `useAssignmentDialog.ts`
- [ ] Remove logs from `useObjectiveAssignment.ts`
- [ ] Remove logs from `useKPIs.ts`
- [ ] Remove logs from `SubmitDialog.tsx`
- [ ] Remove logs from `BulkSubmitDialog.tsx`
- [ ] Remove logs from `ObjectiveWithKPIsSubmitDialog.tsx`
- [ ] Remove logs from `SubmissionApprovalTable.tsx`
- [ ] Remove logs from `SubmissionApprovalsTable.tsx`
- [ ] Remove logs from `ApprovalsTable.tsx`
- [ ] Remove logs from page components
- [ ] Remove logs from other components
- [ ] Test application still works
- [ ] Run `pnpm lint` again to verify

### Commented Code Removal
- [ ] Search for `// console.log` patterns
- [ ] Search for `// import` patterns
- [ ] Remove from `SubmissionApprovalsTable.tsx`
- [ ] Remove from `SubmissionApprovalTable.tsx`
- [ ] Remove from `OrgUnitSelector.tsx`
- [ ] Search for other commented code
- [ ] Verify nothing important was removed
- [ ] Test application still works

### Error Boundaries
- [ ] Create `objectives/error.tsx`
- [ ] Create `approvals/error.tsx`
- [ ] Create `employees/error.tsx`
- [ ] Create `departments/error.tsx`
- [ ] Create `divisions/error.tsx`
- [ ] Create `admin/error.tsx`
- [ ] Create `reports/error.tsx`
- [ ] Create `settings/error.tsx`
- [ ] Create `structure/error.tsx`
- [ ] Test error boundaries work
- [ ] Verify error logging

---

## 🧪 Testing After Changes

### 1. Build Test
```bash
pnpm build
```
**Expected:** No errors, successful build

### 2. Lint Test
```bash
pnpm lint
```
**Expected:** No console.log violations

### 3. Functional Tests
- [ ] Login works
- [ ] Dashboard loads
- [ ] Objectives page works
- [ ] Approvals page works
- [ ] Submissions work
- [ ] Assignment dialog works
- [ ] KPI creation works
- [ ] Error boundaries trigger on errors

### 4. Error Boundary Test
```typescript
// Temporarily add this to a component to test error boundary
throw new Error('Test error boundary');
```
**Expected:** Error boundary catches and displays error UI

---

## 📊 Success Criteria

### Code Quality
- ✅ Zero console.log statements (except in logger.ts)
- ✅ Zero commented code
- ✅ All routes have error boundaries
- ✅ ESLint passes with no violations
- ✅ Build succeeds

### Functionality
- ✅ All features work as before
- ✅ No regressions introduced
- ✅ Error boundaries catch errors gracefully
- ✅ User experience unchanged

### Documentation
- ✅ Changes documented
- ✅ Commit messages clear
- ✅ README updated if needed

---

## 🚀 Deployment

### Before Merging
1. Run full test suite
2. Manual QA testing
3. Code review
4. Update CHANGELOG.md

### After Merging
1. Monitor error logs
2. Check error boundary triggers
3. Verify no console.log in production
4. Update team on changes

---

## 📝 Commit Messages

**Suggested commit structure:**

```bash
# Commit 1: Remove console.log statements
git add .
git commit -m "refactor: remove all console.log statements

- Removed 50+ debug console.log statements
- Kept intentional logging in logger.ts
- Added ESLint rule to prevent future console.log
- No functional changes"

# Commit 2: Remove commented code
git add .
git commit -m "chore: remove commented code

- Removed commented imports
- Removed commented debug logs
- Cleaned up dead code
- No functional changes"

# Commit 3: Add error boundaries
git add .
git commit -m "feat: add error boundaries to all routes

- Added error.tsx to all dashboard routes
- Improved error handling and UX
- Errors now caught gracefully
- Users can retry failed operations"
```

---

## 🔗 Related Files

- `CODE_ANALYSIS_REPORT.md` - Full analysis
- `REFACTORING_SUMMARY.md` - What's been done
- `REFACTORING_PROGRESS.md` - Detailed progress
- `eslint.config.mjs` - Updated ESLint config

---

## ❓ Questions?

If you encounter issues:
1. Check git history for context
2. Review CODE_ANALYSIS_REPORT.md
3. Test incrementally
4. Commit frequently
5. Ask for help if stuck

---

**Ready to start?** Begin with Step 1: Remove Console.log Statements

**Estimated completion:** 2-3 days  
**Priority:** High  
**Impact:** Significant code quality improvement
