/**
 * Permission Management System Seed Script
 * Run this script to populate the backend database with permission data
 * 
 * Usage: node seed-permissions.js
 */

const { GraphQLClient } = require('graphql-request');

const client = new GraphQLClient('http://localhost:3000/graphql');

// Permission definitions to create
const permissionDefinitions = [
  // Employee Management
  { code: 'employees:read_own', label: 'View Own Profile', description: 'View own employee profile and information', action: 'READ', scope: 'OWN', module: 'EMPLOYEES' },
  { code: 'employees:read_department', label: 'View Department Employees', description: 'View employees within own department', action: 'READ', scope: 'DEPARTMENT', module: 'EMPLOYEES' },
  { code: 'employees:read_division', label: 'View Division Employees', description: 'View employees within own division', action: 'READ', scope: 'DIVISION', module: 'EMPLOYEES' },
  { code: 'employees:read_all', label: 'View All Employees', description: 'View all employees in the organization', action: 'READ', scope: 'ORGANIZATION', module: 'EMPLOYEES' },
  { code: 'employees:create', label: 'Create Employees', description: 'Create new employee accounts', action: 'CREATE', scope: 'ORGANIZATION', module: 'EMPLOYEES' },
  { code: 'employees:update_own', label: 'Update Own Profile', description: 'Update own employee profile', action: 'UPDATE', scope: 'OWN', module: 'EMPLOYEES' },
  { code: 'employees:update_department', label: 'Update Department Employees', description: 'Update employees within own department', action: 'UPDATE', scope: 'DEPARTMENT', module: 'EMPLOYEES' },
  { code: 'employees:update_all', label: 'Update All Employees', description: 'Update any employee in the organization', action: 'UPDATE', scope: 'ORGANIZATION', module: 'EMPLOYEES' },
  { code: 'employees:delete', label: 'Delete Employees', description: 'Delete employee accounts', action: 'DELETE', scope: 'ORGANIZATION', module: 'EMPLOYEES' },

  // Objective Management
  { code: 'objectives:read_own', label: 'View Own Objectives', description: 'View objectives assigned to self', action: 'READ', scope: 'OWN', module: 'OBJECTIVES' },
  { code: 'objectives:read_department', label: 'View Department Objectives', description: 'View objectives within own department', action: 'READ', scope: 'DEPARTMENT', module: 'OBJECTIVES' },
  { code: 'objectives:read_division', label: 'View Division Objectives', description: 'View objectives within own division', action: 'READ', scope: 'DIVISION', module: 'OBJECTIVES' },
  { code: 'objectives:read_all', label: 'View All Objectives', description: 'View all objectives in the organization', action: 'READ', scope: 'ORGANIZATION', module: 'OBJECTIVES' },
  { code: 'objectives:create_personnel', label: 'Create Personnel Objectives', description: 'Create individual employee objectives', action: 'CREATE', scope: 'DEPARTMENT', module: 'OBJECTIVES' },
  { code: 'objectives:create_department', label: 'Create Department Objectives', description: 'Create department-level objectives', action: 'CREATE', scope: 'DIVISION', module: 'OBJECTIVES' },
  { code: 'objectives:create_division', label: 'Create Division Objectives', description: 'Create division-level objectives', action: 'CREATE', scope: 'ORGANIZATION', module: 'OBJECTIVES' },
  { code: 'objectives:create_corporate', label: 'Create Corporate Objectives', description: 'Create corporate-level objectives', action: 'CREATE', scope: 'ORGANIZATION', module: 'OBJECTIVES' },
  { code: 'objectives:update_own', label: 'Update Own Objectives', description: 'Update objectives assigned to self', action: 'UPDATE', scope: 'OWN', module: 'OBJECTIVES' },
  { code: 'objectives:update_department', label: 'Update Department Objectives', description: 'Update objectives within own department', action: 'UPDATE', scope: 'DEPARTMENT', module: 'OBJECTIVES' },
  { code: 'objectives:update_division', label: 'Update Division Objectives', description: 'Update objectives within own division', action: 'UPDATE', scope: 'DIVISION', module: 'OBJECTIVES' },
  { code: 'objectives:update_all', label: 'Update All Objectives', description: 'Update any objective in the organization', action: 'UPDATE', scope: 'ORGANIZATION', module: 'OBJECTIVES' },
  { code: 'objectives:delete_own', label: 'Delete Own Objectives', description: 'Delete objectives assigned to self', action: 'DELETE', scope: 'OWN', module: 'OBJECTIVES' },
  { code: 'objectives:delete_department', label: 'Delete Department Objectives', description: 'Delete objectives within own department', action: 'DELETE', scope: 'DEPARTMENT', module: 'OBJECTIVES' },
  { code: 'objectives:delete_all', label: 'Delete All Objectives', description: 'Delete any objective in the organization', action: 'DELETE', scope: 'ORGANIZATION', module: 'OBJECTIVES' },
  { code: 'objectives:approve_department', label: 'Approve Department Objectives', description: 'Approve department-level objective submissions', action: 'APPROVE', scope: 'DEPARTMENT', module: 'OBJECTIVES' },
  { code: 'objectives:approve_division', label: 'Approve Division Objectives', description: 'Approve division-level objective submissions', action: 'APPROVE', scope: 'DIVISION', module: 'OBJECTIVES' },
  { code: 'objectives:approve_corporate', label: 'Approve Corporate Objectives', description: 'Approve corporate-level objective submissions', action: 'APPROVE', scope: 'ORGANIZATION', module: 'OBJECTIVES' },

  // Permission Management (Meta-permissions)
  { code: 'permissions:read', label: 'View Permissions', description: 'View permission definitions and assignments', action: 'READ', scope: 'ORGANIZATION', module: 'PERMISSIONS' },
  { code: 'permissions:manage_roles', label: 'Manage Roles', description: 'Create, update, and delete roles', action: 'MANAGE', scope: 'ORGANIZATION', module: 'PERMISSIONS' },
  { code: 'permissions:assign_roles', label: 'Assign Roles', description: 'Assign and revoke roles from users', action: 'ASSIGN', scope: 'ORGANIZATION', module: 'PERMISSIONS' },
  { code: 'permissions:manage_overrides', label: 'Manage Permission Overrides', description: 'Grant or deny specific permissions to users', action: 'MANAGE', scope: 'ORGANIZATION', module: 'PERMISSIONS' },
  { code: 'permissions:super_admin', label: 'Super Administrator', description: 'Full system access and control', action: 'MANAGE', scope: 'ORGANIZATION', module: 'PERMISSIONS' },

  // System Administration
  { code: 'admin:access_panel', label: 'Access Admin Panel', description: 'Access the administrative panel', action: 'READ', scope: 'ORGANIZATION', module: 'ADMINISTRATION' },
  { code: 'admin:manage_users', label: 'Manage Admin Users', description: 'Create and manage administrative users', action: 'MANAGE', scope: 'ORGANIZATION', module: 'ADMINISTRATION' },
  { code: 'admin:system_config', label: 'System Configuration', description: 'Configure system-wide settings', action: 'MANAGE', scope: 'ORGANIZATION', module: 'ADMINISTRATION' },
];

// Default roles to create
const defaultRoles = [
  { name: 'Super Administrator', code: 'SUPER_ADMIN', description: 'Full system access with all permissions', isCustom: false, isSystemRole: true },
  { name: 'Administrator', code: 'ADMIN', description: 'Administrative access with most permissions', isCustom: false, isSystemRole: true },
  { name: 'Director', code: 'DIRECTOR', description: 'Division-level management with strategic oversight', isCustom: false, isSystemRole: true },
  { name: 'Manager', code: 'MANAGER', description: 'Department-level management with operational oversight', isCustom: false, isSystemRole: true },
  { name: 'Coordinator', code: 'COORDINATOR', description: 'Team coordination with limited management functions', isCustom: false, isSystemRole: true },
  { name: 'Employee', code: 'NORMAL', description: 'Standard employee with basic access', isCustom: false, isSystemRole: true },
];

async function seedPermissions() {
  try {
    console.log('🌱 Starting permission system seed...');

    // First, login as admin to get authentication token
    console.log('🔐 Logging in as admin...');
    const loginMutation = `
      mutation LoginEmployee($input: LoginEmployeeInput!) {
        loginEmployee(loginInput: $input) {
          accessToken
          employee {
            employeeId
            fullName
            email
            role
          }
        }
      }
    `;

    let authToken;
    try {
      const loginResult = await client.request(loginMutation, {
        input: {
          email: 'admin@strategize.com',
          password: 'Password@123'
        }
      });
      authToken = loginResult.loginEmployee.accessToken;
      console.log('✅ Successfully logged in as admin');
    } catch (error) {
      console.log('⚠️  Admin login failed, will try to create permissions without auth');
      console.log('Error:', error.message);
    }

    // Set auth header if we have a token
    if (authToken) {
      client.setHeader('Authorization', `Bearer ${authToken}`);
    }

    // Create permission definitions
    console.log('📋 Creating permission definitions...');
    const createPermissionMutation = `
      mutation CreatePermissionDefinition($input: CreatePermissionDefinitionInput!) {
        createPermissionDefinition(createPermissionDefinitionInput: $input) {
          permissionDefinitionId
          code
          label
        }
      }
    `;

    let createdPermissions = 0;
    for (const permission of permissionDefinitions) {
      try {
        await client.request(createPermissionMutation, {
          input: {
            ...permission,
            organizationId: '1',
            isSystemDefault: true
          }
        });
        createdPermissions++;
        console.log(`  ✅ Created permission: ${permission.code}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to create permission ${permission.code}:`, error.message);
      }
    }

    console.log(`📋 Created ${createdPermissions}/${permissionDefinitions.length} permissions`);

    // Create roles
    console.log('👥 Creating default roles...');
    const createRoleMutation = `
      mutation CreateRole($input: CreateRoleInput!) {
        createRole(createRoleInput: $input) {
          roleId
          name
          code
        }
      }
    `;

    let createdRoles = 0;
    for (const role of defaultRoles) {
      try {
        await client.request(createRoleMutation, {
          input: {
            ...role,
            organizationId: '1'
          }
        });
        createdRoles++;
        console.log(`  ✅ Created role: ${role.code}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to create role ${role.code}:`, error.message);
      }
    }

    console.log(`👥 Created ${createdRoles}/${defaultRoles.length} roles`);

    console.log('🎉 Permission system seed completed!');
    console.log('');
    console.log('🔑 Test Accounts:');
    console.log('  Super Admin: admin@strategize.com / Password@123');
    console.log('  Director: director@strategize.com / Password@123');
    console.log('  Manager: manager@strategize.com / Password@123');
    console.log('  Employee: employee@strategize.com / Password@123');
    console.log('');
    console.log('🌐 Access the permission management at:');
    console.log('  http://localhost:3001/dashboard/admin/permissions');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seedPermissions();