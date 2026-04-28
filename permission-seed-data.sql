-- Permission Management System Seed Data
-- This script creates all the necessary data for the permission management system

-- First, let's create the permission definitions (80+ granular permissions)

-- Employee Management Permissions
INSERT INTO permission_definitions (permission_definition_id, code, label, description, action, scope, module, is_system_default, created_at, updated_at) VALUES
(gen_random_uuid(), 'employees:read_own', 'View Own Profile', 'View own employee profile and information', 'READ', 'OWN', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:read_department', 'View Department Employees', 'View employees within own department', 'READ', 'DEPARTMENT', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:read_division', 'View Division Employees', 'View employees within own division', 'READ', 'DIVISION', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:read_all', 'View All Employees', 'View all employees in the organization', 'READ', 'ORGANIZATION', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:create', 'Create Employees', 'Create new employee accounts', 'CREATE', 'ORGANIZATION', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:update_own', 'Update Own Profile', 'Update own employee profile', 'UPDATE', 'OWN', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:update_department', 'Update Department Employees', 'Update employees within own department', 'UPDATE', 'DEPARTMENT', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:update_all', 'Update All Employees', 'Update any employee in the organization', 'UPDATE', 'ORGANIZATION', 'EMPLOYEES', true, NOW(), NOW()),
(gen_random_uuid(), 'employees:delete', 'Delete Employees', 'Delete employee accounts', 'DELETE', 'ORGANIZATION', 'EMPLOYEES', true, NOW(), NOW()),

-- Objective Management Permissions
(gen_random_uuid(), 'objectives:read_own', 'View Own Objectives', 'View objectives assigned to self', 'READ', 'OWN', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:read_department', 'View Department Objectives', 'View objectives within own department', 'READ', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:read_division', 'View Division Objectives', 'View objectives within own division', 'READ', 'DIVISION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:read_all', 'View All Objectives', 'View all objectives in the organization', 'READ', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:create_personnel', 'Create Personnel Objectives', 'Create individual employee objectives', 'CREATE', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:create_department', 'Create Department Objectives', 'Create department-level objectives', 'CREATE', 'DIVISION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:create_division', 'Create Division Objectives', 'Create division-level objectives', 'CREATE', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:create_corporate', 'Create Corporate Objectives', 'Create corporate-level objectives', 'CREATE', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:update_own', 'Update Own Objectives', 'Update objectives assigned to self', 'UPDATE', 'OWN', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:update_department', 'Update Department Objectives', 'Update objectives within own department', 'UPDATE', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:update_division', 'Update Division Objectives', 'Update objectives within own division', 'UPDATE', 'DIVISION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:update_all', 'Update All Objectives', 'Update any objective in the organization', 'UPDATE', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:delete_own', 'Delete Own Objectives', 'Delete objectives assigned to self', 'DELETE', 'OWN', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:delete_department', 'Delete Department Objectives', 'Delete objectives within own department', 'DELETE', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:delete_all', 'Delete All Objectives', 'Delete any objective in the organization', 'DELETE', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:approve_department', 'Approve Department Objectives', 'Approve department-level objective submissions', 'APPROVE', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:approve_division', 'Approve Division Objectives', 'Approve division-level objective submissions', 'APPROVE', 'DIVISION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:approve_corporate', 'Approve Corporate Objectives', 'Approve corporate-level objective submissions', 'APPROVE', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:assign_personnel', 'Assign Personnel Objectives', 'Assign objectives to individual employees', 'ASSIGN', 'DEPARTMENT', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:assign_department', 'Assign Department Objectives', 'Assign objectives to departments', 'ASSIGN', 'DIVISION', 'OBJECTIVES', true, NOW(), NOW()),
(gen_random_uuid(), 'objectives:assign_division', 'Assign Division Objectives', 'Assign objectives to divisions', 'ASSIGN', 'ORGANIZATION', 'OBJECTIVES', true, NOW(), NOW()),

-- KPI Management Permissions
(gen_random_uuid(), 'kpis:read_own', 'View Own KPIs', 'View KPIs assigned to self', 'READ', 'OWN', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:read_department', 'View Department KPIs', 'View KPIs within own department', 'READ', 'DEPARTMENT', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:read_division', 'View Division KPIs', 'View KPIs within own division', 'READ', 'DIVISION', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:read_all', 'View All KPIs', 'View all KPIs in the organization', 'READ', 'ORGANIZATION', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:create', 'Create KPIs', 'Create new KPIs for objectives', 'CREATE', 'DEPARTMENT', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:update_own', 'Update Own KPIs', 'Update KPIs assigned to self', 'UPDATE', 'OWN', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:update_department', 'Update Department KPIs', 'Update KPIs within own department', 'UPDATE', 'DEPARTMENT', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:update_all', 'Update All KPIs', 'Update any KPI in the organization', 'UPDATE', 'ORGANIZATION', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:delete_own', 'Delete Own KPIs', 'Delete KPIs assigned to self', 'DELETE', 'OWN', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:delete_department', 'Delete Department KPIs', 'Delete KPIs within own department', 'DELETE', 'DEPARTMENT', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:delete_all', 'Delete All KPIs', 'Delete any KPI in the organization', 'DELETE', 'ORGANIZATION', 'KPIS', true, NOW(), NOW()),
(gen_random_uuid(), 'kpis:approve', 'Approve KPI Updates', 'Approve KPI progress updates and submissions', 'APPROVE', 'DEPARTMENT', 'KPIS', true, NOW(), NOW()),

-- Department Management Permissions
(gen_random_uuid(), 'departments:read_own', 'View Own Department', 'View own department information', 'READ', 'DEPARTMENT', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:read_division', 'View Division Departments', 'View departments within own division', 'READ', 'DIVISION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:read_all', 'View All Departments', 'View all departments in the organization', 'READ', 'ORGANIZATION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:create', 'Create Departments', 'Create new departments', 'CREATE', 'ORGANIZATION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:update_own', 'Update Own Department', 'Update own department information', 'UPDATE', 'DEPARTMENT', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:update_division', 'Update Division Departments', 'Update departments within own division', 'UPDATE', 'DIVISION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:update_all', 'Update All Departments', 'Update any department in the organization', 'UPDATE', 'ORGANIZATION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:delete', 'Delete Departments', 'Delete departments', 'DELETE', 'ORGANIZATION', 'DEPARTMENTS', true, NOW(), NOW()),
(gen_random_uuid(), 'departments:manage_members', 'Manage Department Members', 'Add/remove employees from departments', 'MANAGE', 'DEPARTMENT', 'DEPARTMENTS', true, NOW(), NOW()),

-- Division Management Permissions
(gen_random_uuid(), 'divisions:read_own', 'View Own Division', 'View own division information', 'READ', 'DIVISION', 'DIVISIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'divisions:read_all', 'View All Divisions', 'View all divisions in the organization', 'READ', 'ORGANIZATION', 'DIVISIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'divisions:create', 'Create Divisions', 'Create new divisions', 'CREATE', 'ORGANIZATION', 'DIVISIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'divisions:update_own', 'Update Own Division', 'Update own division information', 'UPDATE', 'DIVISION', 'DIVISIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'divisions:update_all', 'Update All Divisions', 'Update any division in the organization', 'UPDATE', 'ORGANIZATION', 'DIVISIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'divisions:delete', 'Delete Divisions', 'Delete divisions', 'DELETE', 'ORGANIZATION', 'DIVISIONS', true, NOW(), NOW()),

-- Strategic Planning Permissions
(gen_random_uuid(), 'strategic_plans:read', 'View Strategic Plans', 'View strategic plans and periods', 'READ', 'ORGANIZATION', 'STRATEGIC_PLANNING', true, NOW(), NOW()),
(gen_random_uuid(), 'strategic_plans:create', 'Create Strategic Plans', 'Create new strategic plans and periods', 'CREATE', 'ORGANIZATION', 'STRATEGIC_PLANNING', true, NOW(), NOW()),
(gen_random_uuid(), 'strategic_plans:update', 'Update Strategic Plans', 'Update strategic plans and periods', 'UPDATE', 'ORGANIZATION', 'STRATEGIC_PLANNING', true, NOW(), NOW()),
(gen_random_uuid(), 'strategic_plans:delete', 'Delete Strategic Plans', 'Delete strategic plans and periods', 'DELETE', 'ORGANIZATION', 'STRATEGIC_PLANNING', true, NOW(), NOW()),

-- Reporting Permissions
(gen_random_uuid(), 'reports:read_own', 'View Own Reports', 'View reports for own performance', 'READ', 'OWN', 'REPORTS', true, NOW(), NOW()),
(gen_random_uuid(), 'reports:read_department', 'View Department Reports', 'View reports for own department', 'READ', 'DEPARTMENT', 'REPORTS', true, NOW(), NOW()),
(gen_random_uuid(), 'reports:read_division', 'View Division Reports', 'View reports for own division', 'READ', 'DIVISION', 'REPORTS', true, NOW(), NOW()),
(gen_random_uuid(), 'reports:read_all', 'View All Reports', 'View all organizational reports', 'READ', 'ORGANIZATION', 'REPORTS', true, NOW(), NOW()),
(gen_random_uuid(), 'reports:export', 'Export Reports', 'Export reports to various formats', 'EXPORT', 'ORGANIZATION', 'REPORTS', true, NOW(), NOW()),

-- Approval Workflow Permissions
(gen_random_uuid(), 'approvals:read_own', 'View Own Approvals', 'View approval requests assigned to self', 'READ', 'OWN', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:read_department', 'View Department Approvals', 'View approval requests for own department', 'READ', 'DEPARTMENT', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:read_division', 'View Division Approvals', 'View approval requests for own division', 'READ', 'DIVISION', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:read_all', 'View All Approvals', 'View all approval requests', 'READ', 'ORGANIZATION', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:approve_department', 'Approve Department Requests', 'Approve requests at department level', 'APPROVE', 'DEPARTMENT', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:approve_division', 'Approve Division Requests', 'Approve requests at division level', 'APPROVE', 'DIVISION', 'APPROVALS', true, NOW(), NOW()),
(gen_random_uuid(), 'approvals:approve_corporate', 'Approve Corporate Requests', 'Approve requests at corporate level', 'APPROVE', 'ORGANIZATION', 'APPROVALS', true, NOW(), NOW()),

-- System Administration Permissions
(gen_random_uuid(), 'admin:access_panel', 'Access Admin Panel', 'Access the administrative panel', 'READ', 'ORGANIZATION', 'ADMINISTRATION', true, NOW(), NOW()),
(gen_random_uuid(), 'admin:manage_users', 'Manage Admin Users', 'Create and manage administrative users', 'MANAGE', 'ORGANIZATION', 'ADMINISTRATION', true, NOW(), NOW()),
(gen_random_uuid(), 'admin:system_config', 'System Configuration', 'Configure system-wide settings', 'MANAGE', 'ORGANIZATION', 'ADMINISTRATION', true, NOW(), NOW()),
(gen_random_uuid(), 'admin:audit_logs', 'View Audit Logs', 'View system audit logs and activity', 'READ', 'ORGANIZATION', 'ADMINISTRATION', true, NOW(), NOW()),
(gen_random_uuid(), 'admin:data_management', 'Data Management', 'Backup, restore, and cleanup system data', 'MANAGE', 'ORGANIZATION', 'ADMINISTRATION', true, NOW(), NOW()),

-- Permission Management Permissions (Meta-permissions)
(gen_random_uuid(), 'permissions:read', 'View Permissions', 'View permission definitions and assignments', 'READ', 'ORGANIZATION', 'PERMISSIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'permissions:manage_roles', 'Manage Roles', 'Create, update, and delete roles', 'MANAGE', 'ORGANIZATION', 'PERMISSIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'permissions:assign_roles', 'Assign Roles', 'Assign and revoke roles from users', 'ASSIGN', 'ORGANIZATION', 'PERMISSIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'permissions:manage_overrides', 'Manage Permission Overrides', 'Grant or deny specific permissions to users', 'MANAGE', 'ORGANIZATION', 'PERMISSIONS', true, NOW(), NOW()),
(gen_random_uuid(), 'permissions:super_admin', 'Super Administrator', 'Full system access and control', 'MANAGE', 'ORGANIZATION', 'PERMISSIONS', true, NOW(), NOW());

-- Now create the default roles
INSERT INTO roles (role_id, name, code, description, is_custom, is_system_role, is_deleted, created_at, updated_at, organization_id) VALUES
(gen_random_uuid(), 'Super Administrator', 'SUPER_ADMIN', 'Full system access with all permissions', false, true, false, NOW(), NOW(), '1'),
(gen_random_uuid(), 'Administrator', 'ADMIN', 'Administrative access with most permissions', false, true, false, NOW(), NOW(), '1'),
(gen_random_uuid(), 'Director', 'DIRECTOR', 'Division-level management with strategic oversight', false, true, false, NOW(), NOW(), '1'),
(gen_random_uuid(), 'Manager', 'MANAGER', 'Department-level management with operational oversight', false, true, false, NOW(), NOW(), '1'),
(gen_random_uuid(), 'Coordinator', 'COORDINATOR', 'Team coordination with limited management functions', false, true, false, NOW(), NOW(), '1'),
(gen_random_uuid(), 'Employee', 'NORMAL', 'Standard employee with basic access', false, true, false, NOW(), NOW(), '1');

-- Create role-permission assignments
-- Super Administrator gets ALL permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'SUPER_ADMIN';

-- Administrator gets most permissions (excluding super admin specific ones)
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'ADMIN' 
AND pd.code != 'permissions:super_admin'
AND pd.code != 'permissions:manage_roles'
AND pd.code != 'permissions:assign_roles';

-- Director gets division-level and below permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'DIRECTOR' 
AND (
    pd.scope IN ('OWN', 'DEPARTMENT', 'DIVISION') OR
    pd.code LIKE '%read%' OR
    pd.code LIKE '%create_division%' OR
    pd.code LIKE '%create_department%' OR
    pd.code LIKE '%approve_division%' OR
    pd.code LIKE '%approve_department%'
);

-- Manager gets department-level and below permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'MANAGER' 
AND (
    pd.scope IN ('OWN', 'DEPARTMENT') OR
    pd.code LIKE '%read%' OR
    pd.code LIKE '%create_personnel%' OR
    pd.code LIKE '%approve_department%'
);

-- Coordinator gets limited permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'COORDINATOR' 
AND (
    pd.scope = 'OWN' OR
    pd.code LIKE '%read_department%' OR
    pd.code LIKE '%read_own%'
);

-- Employee gets basic permissions
INSERT INTO role_permissions (role_permission_id, role_id, permission_id, is_active, granted_at, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    r.role_id,
    pd.permission_definition_id,
    true,
    NOW(),
    NOW(),
    NOW()
FROM roles r
CROSS JOIN permission_definitions pd
WHERE r.code = 'NORMAL' 
AND pd.scope = 'OWN';

-- Finally, assign the SUPER_ADMIN role to the admin user
-- First, let's make sure the admin user exists with the correct role
UPDATE employees 
SET role = 'SUPER_ADMIN' 
WHERE email = 'admin@strategize.com';

-- If the admin user doesn't exist, create it
INSERT INTO employees (employee_id, full_name, email, password, role, status, created_at, updated_at, organization_id)
SELECT 
    gen_random_uuid(),
    'System Administrator',
    'admin@strategize.com',
    '$2b$10$8K1p/a0dClAI2yIaYvnB8.n7ELw9V5H5PjL.7J5Z5Z5Z5Z5Z5Z5Z5e', -- Password@123 hashed
    'SUPER_ADMIN',
    'ACTIVE',
    NOW(),
    NOW(),
    '1'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'admin@strategize.com');

-- Create user role assignment for the admin user
INSERT INTO user_role_assignments (user_role_assignment_id, user_id, role_id, is_primary, is_active, created_at, updated_at, organization_id)
SELECT 
    gen_random_uuid(),
    e.employee_id,
    r.role_id,
    true,
    true,
    NOW(),
    NOW(),
    '1'
FROM employees e
CROSS JOIN roles r
WHERE e.email = 'admin@strategize.com' 
AND r.code = 'SUPER_ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = e.employee_id AND ura.role_id = r.role_id
);

-- Create some sample additional users for testing
INSERT INTO employees (employee_id, full_name, email, password, role, status, created_at, updated_at, organization_id)
VALUES 
(gen_random_uuid(), 'John Director', 'director@strategize.com', '$2b$10$8K1p/a0dClAI2yIaYvnB8.n7ELw9V5H5PjL.7J5Z5Z5Z5Z5Z5Z5Z5e', 'DIRECTOR', 'ACTIVE', NOW(), NOW(), '1'),
(gen_random_uuid(), 'Jane Manager', 'manager@strategize.com', '$2b$10$8K1p/a0dClAI2yIaYvnB8.n7ELw9V5H5PjL.7J5Z5Z5Z5Z5Z5Z5Z5e', 'MANAGER', 'ACTIVE', NOW(), NOW(), '1'),
(gen_random_uuid(), 'Bob Employee', 'employee@strategize.com', '$2b$10$8K1p/a0dClAI2yIaYvnB8.n7ELw9V5H5PjL.7J5Z5Z5Z5Z5Z5Z5Z5e', 'NORMAL', 'ACTIVE', NOW(), NOW(), '1')
ON CONFLICT (email) DO NOTHING;

-- Assign roles to the test users
INSERT INTO user_role_assignments (user_role_assignment_id, user_id, role_id, is_primary, is_active, created_at, updated_at, organization_id)
SELECT 
    gen_random_uuid(),
    e.employee_id,
    r.role_id,
    true,
    true,
    NOW(),
    NOW(),
    '1'
FROM employees e
CROSS JOIN roles r
WHERE (
    (e.email = 'director@strategize.com' AND r.code = 'DIRECTOR') OR
    (e.email = 'manager@strategize.com' AND r.code = 'MANAGER') OR
    (e.email = 'employee@strategize.com' AND r.code = 'NORMAL')
)
AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    WHERE ura.user_id = e.employee_id AND ura.role_id = r.role_id
);

COMMIT;