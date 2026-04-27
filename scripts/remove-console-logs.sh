#!/bin/bash

# Script to remove console.log statements from codebase
# Preserves console.warn and console.error
# Skips src/lib/logger.ts (intentional console.log)

echo "🧹 Removing console.log statements from codebase..."
echo ""

# Files to clean (excluding logger.ts)
files=(
  "src/hooks/objectives/useAssignmentActions.ts"
  "src/hooks/objectives/useAssignmentDialog.ts"
  "src/components/submissions/SubmitDialog.tsx"
  "src/components/submissions/BulkSubmitDialog.tsx"
  "src/components/submissions/ObjectiveWithKPIsSubmitDialog.tsx"
  "src/components/approvals/SubmissionApprovalTable.tsx"
  "src/components/approvals/SubmissionApprovalsTable.tsx"
  "src/components/approvals/ApprovalsTable.tsx"
  "src/components/structure/StructureBuilder.tsx"
  "src/app/dashboard/objectives/[id]/page.tsx"
  "src/app/dashboard/divisions/page.tsx"
  "src/app/dashboard/departments/new/page.tsx"
  "src/components/dashboard/StrategySelector.tsx"
)

count=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Count console.log occurrences
    logs=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
    
    if [ "$logs" -gt 0 ]; then
      echo "📝 $file - Found $logs console.log statement(s)"
      count=$((count + logs))
    fi
  else
    echo "⚠️  $file - File not found"
  fi
done

echo ""
echo "📊 Total console.log statements found: $count"
echo ""
echo "⚠️  Manual removal required for these files."
echo "   Run 'pnpm lint' to see exact locations."
echo ""
echo "✅ Already removed from:"
echo "   - src/hooks/objectives/useObjectiveAssignment.ts"
echo "   - src/hooks/objectives/useKPIs.ts"
