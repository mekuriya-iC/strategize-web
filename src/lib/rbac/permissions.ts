/**
 * Permission Definitions
 * Atomic permissions for all features in the application
 * 
 * Naming convention: resource:action
 * Examples: employees:read, objectives:approve, divisions:create
 */

// Permission categories
export const PERMISSIONS = {
  // ==================== EMPLOYEES ====================
  'employees:read_own': 'View own profile',
  'employees:read_department': 'View employees in own department',
  'employees:read_division': 'View employees in own division',
  'employees:read_all': 'View all employees',
  'employees:create': 'Create new employees',
  'employees:update_own': 'Update own profile',
  'employees:update_department': 'Update employees in own department',
  'employees:update_all': 'Update any employee',
  'employees:delete': 'Delete employees',
  'employees:assign_role_basic': 'Assign roles up to MANAGER',
  'employees:assign_role_advanced': 'Assign roles up to DIRECTOR',
  'employees:assign_role_any': 'Assign any role',

  // ==================== OBJECTIVES ====================
  'objectives:read_own': 'View own objectives',
  'objectives:read_department': 'View department objectives',
  'objectives:read_division': 'View division objectives',
  'objectives:read_all': 'View all objectives',
  'objectives:create_personnel': 'Create personnel-level objectives',
  'objectives:create_department': 'Create department-level objectives',
  'objectives:create_division': 'Create division-level objectives',
  'objectives:create_corporate': 'Create corporate-level objectives',
  'objectives:update_own': 'Update own objectives',
  'objectives:update_department': 'Update department objectives',
  'objectives:update_division': 'Update division objectives',
  'objectives:update_all': 'Update any objective',
  'objectives:delete_department': 'Delete department objectives',
  'objectives:delete_division': 'Delete division objectives',
  'objectives:delete_all': 'Delete any objective',
  'objectives:submit': 'Submit objectives for approval',
  'objectives:approve_personnel': 'Approve personnel-level objectives',
  'objectives:approve_department': 'Approve department-level objectives',
  'objectives:approve_division': 'Approve division-level objectives',
  'objectives:approve_corporate': 'Approve corporate-level objectives',
  'objectives:assign_personnel': 'Assign objectives to personnel',
  'objectives:assign_department': 'Assign objectives to departments',
  'objectives:assign_division': 'Assign objectives to divisions',

  // ==================== KPIs ====================
  'kpis:read_own': 'View own KPIs',
  'kpis:read_department': 'View department KPIs',
  'kpis:read_division': 'View division KPIs',
  'kpis:read_all': 'View all KPIs',
  'kpis:create_own': 'Create KPIs for own objectives',
  'kpis:create_department': 'Create KPIs for department objectives',
  'kpis:create_division': 'Create KPIs for division objectives',
  'kpis:create_corporate': 'Create KPIs for corporate objectives',
  'kpis:update_own': 'Update own KPIs',
  'kpis:update_department': 'Update department KPIs',
  'kpis:update_division': 'Update division KPIs',
  'kpis:update_all': 'Update any KPI',
  'kpis:delete_department': 'Delete department KPIs',
  'kpis:delete_division': 'Delete division KPIs',
  'kpis:delete_all': 'Delete any KPI',
  'kpis:submit': 'Submit KPIs for approval',
  'kpis:approve_personnel': 'Approve personnel-level KPIs',
  'kpis:approve_department': 'Approve department-level KPIs',
  'kpis:approve_division': 'Approve division-level KPIs',
  'kpis:approve_corporate': 'Approve corporate-level KPIs',
  'kpis:set_targets': 'Set KPI targets',

  // ==================== DIVISIONS ====================
  'divisions:read_own': 'View own division',
  'divisions:read_all': 'View all divisions',
  'divisions:create': 'Create new divisions',
  'divisions:update_own': 'Update own division',
  'divisions:update_all': 'Update any division',
  'divisions:delete': 'Delete divisions',
  'divisions:assign_manager': 'Assign division manager',

  // ==================== DEPARTMENTS ====================
  'departments:read_own': 'View own department',
  'departments:read_division': 'View departments in own division',
  'departments:read_all': 'View all departments',
  'departments:create': 'Create new departments',
  'departments:create_in_division': 'Create departments in own division',
  'departments:update_own': 'Update own department',
  'departments:update_division': 'Update departments in own division',
  'departments:update_all': 'Update any department',
  'departments:delete': 'Delete departments',
  'departments:assign_manager': 'Assign department manager',
  'departments:add_employee': 'Add employees to department',
  'departments:remove_employee': 'Remove employees from department',

  // ==================== STRATEGIC PERIODS ====================
  'strategic_periods:read': 'View strategic periods',
  'strategic_periods:create': 'Create strategic periods',
  'strategic_periods:update': 'Update strategic periods',
  'strategic_periods:delete': 'Delete strategic periods',

  // ==================== SUBMISSIONS ====================
  'submissions:read_own': 'View own submissions',
  'submissions:read_department': 'View department submissions',
  'submissions:read_division': 'View division submissions',
  'submissions:read_all': 'View all submissions',
  'submissions:create': 'Create new submissions',
  'submissions:approve_personnel': 'Approve personnel submissions',
  'submissions:approve_department': 'Approve department submissions',
  'submissions:approve_division': 'Approve division submissions',
  'submissions:approve_corporate': 'Approve corporate submissions',

  // ==================== ANALYTICS & REPORTS ====================
  'analytics:read_own': 'View own analytics',
  'analytics:read_department': 'View department analytics',
  'analytics:read_division': 'View division analytics',
  'analytics:read_all': 'View all analytics',
  'reports:read_own': 'View own reports',
  'reports:read_department': 'View department reports',
  'reports:read_division': 'View division reports',
  'reports:read_all': 'View all reports',
  'reports:export': 'Export reports',

  // ==================== ADMIN ====================
  'admin:access_panel': 'Access admin panel',
  'admin:manage_admins': 'Manage admin users',
  'admin:view_audit_logs': 'View audit logs',
  'admin:system_settings': 'Access system settings',

  // ==================== CHECK-IN/OUT ====================
  'checkins:read_own': 'View own check-ins',
  'checkins:read_department': 'View department check-ins',
  'checkins:read_all': 'View all check-ins',
  'checkins:create': 'Create check-ins',
  'checkins:update_own': 'Update own check-ins',
  'checkins:update_all': 'Update any check-in',
  'checkins:delete_own': 'Delete own check-ins',
  'checkins:delete_all': 'Delete any check-in',

  // ==================== LOGBOOK ====================
  'logbook:read_own': 'View own logbook',
  'logbook:read_department': 'View department logbook',
  'logbook:read_all': 'View all logbooks',
  'logbook:submit': 'Submit logbook for approval',
  'logbook:approve': 'Approve logbook submissions',
  'logbook:delete_own': 'Delete own logbook entries',
  'logbook:delete_all': 'Delete any logbook entry',

  // ==================== EVALUATIONS ====================
  'evaluations:read_own': 'View own evaluation results',
  'evaluations:read_department': 'View department evaluation results',
  'evaluations:read_division': 'View division evaluation results',
  'evaluations:read_all': 'View all evaluation results',
  'evaluations:manage': 'Manage evaluation cycles and framework',
  'evaluations:assign': 'Assign evaluators',

  // ==================== NAVIGATION ====================
  'nav:dashboard': 'Access dashboard',
  'nav:objectives': 'Access objectives page',
  'nav:divisions': 'Access divisions page',
  'nav:departments': 'Access departments page',
  'nav:employees': 'Access employees page',
  'nav:reports': 'Access reports page',
  'nav:approvals': 'Access approvals page',
  'nav:admin': 'Access admin panel',
  'nav:settings': 'Access settings page',
  'nav:strategy_period': 'Access strategy period page',
  'nav:checkin': 'Access check-in/out page',
  'nav:logbook': 'Access logbook page',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  EMPLOYEE_MANAGEMENT: [
    'employees:read_all',
    'employees:create',
    'employees:update_all',
    'employees:delete',
    'employees:assign_role_any',
  ] as Permission[],
  
  OBJECTIVE_FULL_CONTROL: [
    'objectives:read_all',
    'objectives:create_corporate',
    'objectives:update_all',
    'objectives:delete_all',
    'objectives:approve_corporate',
    'objectives:assign_division',
  ] as Permission[],
  
  KPI_FULL_CONTROL: [
    'kpis:read_all',
    'kpis:create_corporate',
    'kpis:update_all',
    'kpis:delete_all',
    'kpis:approve_corporate',
  ] as Permission[],
  
  ORG_STRUCTURE_FULL: [
    'divisions:read_all',
    'divisions:create',
    'divisions:update_all',
    'divisions:delete',
    'divisions:assign_manager',
    'departments:read_all',
    'departments:create',
    'departments:update_all',
    'departments:delete',
    'departments:assign_manager',
  ] as Permission[],
  
  STRATEGY_MANAGEMENT: [
    'strategic_periods:read',
    'strategic_periods:create',
    'strategic_periods:update',
    'strategic_periods:delete',
  ] as Permission[],
};

