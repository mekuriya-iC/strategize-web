/**
 * Objectives Module
 * 
 * Centralized exports for objective-related hooks.
 * Import from this file for cleaner, more maintainable code.
 * 
 * @example
 * ```typescript
 * // ✅ Good - Import from index
 * import { useObjectives, useObjectiveMutations } from '@/hooks/objectives';
 * 
 * // ❌ Bad - Direct imports
 * import { useObjectives } from '@/hooks/objectives/useObjectives';
 * import { useObjectiveMutations } from '@/hooks/objectives/useObjectiveMutations';
 * ```
 */

// ============================================================================
// DATA FETCHING HOOKS
// ============================================================================

/**
 * Fetch paginated list of objectives
 * @see useObjectives in useObjectives.ts
 */
export { useObjectives, useObjective } from './useObjectives';

/**
 * Fetch KPIs for objectives
 * @see useKPIs in useKPIs.ts
 */
export { useKPIs } from './useKPIs';

/**
 * Fetch strategic periods
 * @see useStrategicPeriods in useStrategicPeriods.ts
 */
export { useStrategicPeriods } from './useStrategicPeriods';

/**
 * Fetch analytics data
 * @see useAnalytics in useAnalytics.ts
 */
export { useAnalytics } from './useAnalytics';

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create, update, delete objectives
 * @see useObjectiveMutations in useObjectiveMutations.ts
 */
export { useObjectiveMutations } from './useObjectiveMutations';

/**
 * Create, update, delete KPIs
 * @see useKPIMutations in useKPIMutations.ts
 */
export { useKPIMutations } from './useKPIMutations';

/**
 * Create, update strategic periods
 * @see useStrategicPeriodMutations in useStrategicPeriodMutations.ts
 */
export { useStrategicPeriodMutations } from './useStrategicPeriodMutations';

// ============================================================================
// ASSIGNMENT HOOKS
// ============================================================================

/**
 * Core objective assignment mutation
 * @see useObjectiveAssignment in useObjectiveAssignment.ts
 */
export { useObjectiveAssignment } from './useObjectiveAssignment';

/**
 * Complete assignment dialog orchestration
 * @see useAssignmentDialog in useAssignmentDialog.ts
 * 
 * @note This hook internally uses:
 * - useAssignmentState
 * - useAssignmentData
 * - useAssignmentActions
 * 
 * Use this hook instead of the individual ones for assignment workflows.
 */
export { useAssignmentDialog } from './useAssignmentDialog';

/**
 * Assignment state management
 * @see useAssignmentState in useAssignmentState.ts
 * 
 * @note Usually used internally by useAssignmentDialog.
 * Only import directly if you need fine-grained control.
 */
export { useAssignmentState } from './useAssignmentState';

/**
 * Fetch available assignees (divisions, departments, personnel)
 * @see useAssignmentData in useAssignmentData.ts
 * 
 * @note Usually used internally by useAssignmentDialog.
 * Only import directly if you need fine-grained control.
 */
export { useAssignmentData } from './useAssignmentData';

/**
 * Assignment submission actions
 * @see useAssignmentActions in useAssignmentActions.ts
 * 
 * @note Usually used internally by useAssignmentDialog.
 * Only import directly if you need fine-grained control.
 */
export { useAssignmentActions } from './useAssignmentActions';

// ============================================================================
// FORM STATE HOOKS
// ============================================================================

/**
 * Create KPI form state
 * @see useCreateKPIForm in useCreateKPIForm.ts
 * 
 * @deprecated Consider consolidating with useKPIFormState
 */
export { useCreateKPIForm } from './useCreateKPIForm';

/**
 * General KPI form state
 * @see useKPIFormState in useKPIFormState.ts
 */
export { useKPIFormState } from './useKPIFormState';

/**
 * Update KPI form state
 * @see useUpdateKPIState in useUpdateKPIState.ts
 * 
 * @deprecated Consider consolidating with useKPIFormState
 */
export { useUpdateKPIState } from './useUpdateKPIState';

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Auto-select current strategic period for non-admin users
 * @see useAutoSelectStrategicPeriod in useAutoSelectStrategicPeriod.ts
 * 
 * @example
 * ```typescript
 * // Just call it in your component
 * useAutoSelectStrategicPeriod();
 * ```
 */
export { useAutoSelectStrategicPeriod } from './useAutoSelectStrategicPeriod';

/**
 * Manage objective ordering in lists
 * @see useObjectivesOrder in useObjectivesOrder.ts
 */
export { useObjectivesOrder } from './useObjectivesOrder';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Re-export commonly used types from assignment hooks
 */
export type { AssigneeType } from './useAssignmentDialog';
export type { AssignmentState, TargetAssignment } from './useAssignmentState';
