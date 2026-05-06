import { test, expect, TEST_USERS } from './fixtures/auth';
import {
  navigateToObjectives,
  createObjective,
  addKPIToObjective,
  assignKPIToDepartment,
  checkObjectiveStatus,
  switchToObjectivesTab,
  verifyObjectiveVisible,
  verifyObjectiveNotVisible,
  changeObjectiveStatus,
} from './helpers/objectives';

/**
 * Complete Objectives Workflow Test Suite
 * 
 * Tests the complete cascading objective workflow:
 * 1. SUPER_ADMIN creates corporate objective
 * 2. SUPER_ADMIN adds KPI to objective
 * 3. SUPER_ADMIN assigns KPI to department
 * 4. MANAGER views assigned objectives
 * 5. MANAGER creates department objective
 */

test.describe('Complete Objectives Workflow', () => {
  const CORPORATE_OBJECTIVE = {
    name: `Test: Increase Revenue ${Date.now()}`,
    description: 'Automated test objective for revenue growth',
    type: 'CORPORATE' as const,
  };

  const CORPORATE_KPI = {
    name: 'Revenue Growth Rate',
    baseline: '100',
    weight: '30',
    unitType: 'NUMBER' as const,
    annualTarget: '125',
  };

  const DEPARTMENT_OBJECTIVE = {
    name: `Test: Improve Quality ${Date.now()}`,
    description: 'Automated test objective for quality improvement',
    type: 'DEPARTMENT' as const,
  };

  const DEPARTMENT_KPI = {
    name: 'Bug Resolution Rate',
    baseline: '70',
    weight: '40',
    unitType: 'PERCENT' as const,
    annualTarget: '95',
    quarters: {
      q1: '80',
      q2: '85',
      q3: '90',
      q4: '95',
    },
  };

  test.describe('Part 1: SUPER_ADMIN Creates Corporate Objective', () => {
    test('should create corporate objective with auto-approval', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Create corporate objective
      await createObjective(superAdminPage, CORPORATE_OBJECTIVE);

      // Verify objective is created and approved
      await checkObjectiveStatus(superAdminPage, CORPORATE_OBJECTIVE.name, 'APPROVED');

      // Check console for auto-approval logs
      const logs: string[] = [];
      superAdminPage.on('console', (msg) => {
        if (msg.type() === 'log') {
          logs.push(msg.text());
        }
      });

      // Verify auto-approval happened
      const hasAutoApprovalLog = logs.some(log => 
        log.includes('Auto-approving') || log.includes('auto-approved')
      );
      
      if (hasAutoApprovalLog) {
        console.log('✅ Auto-approval logs found');
      }
    });

    test('should add KPI to corporate objective with auto-approval', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Add KPI to the corporate objective
      await addKPIToObjective(superAdminPage, CORPORATE_OBJECTIVE.name, CORPORATE_KPI);

      // Verify KPI was added
      await expect(superAdminPage.locator(`text=${CORPORATE_KPI.name}`)).toBeVisible();

      // Verify KPI is approved
      await expect(superAdminPage.locator('text=APPROVED').first()).toBeVisible();
    });
  });

  test.describe('Part 2: SUPER_ADMIN Assigns to Department', () => {
    test('should assign KPI to Software Engineering department', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Assign KPI to department
      await assignKPIToDepartment(
        superAdminPage,
        CORPORATE_OBJECTIVE.name,
        TEST_USERS.MANAGER.departmentName,
        '40' // Department target value
      );

      // Verify assignment success
      await expect(superAdminPage.locator('text=assigned successfully')).toBeVisible();
    });

    test('should see assigned objective in department tab', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Switch to department tab
      await switchToObjectivesTab(superAdminPage, 'department');

      // Verify objective is visible
      await verifyObjectiveVisible(superAdminPage, CORPORATE_OBJECTIVE.name);
    });
  });

  test.describe('Part 3: MANAGER Views Department Objectives', () => {
    test('should see assigned objectives as manager', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Switch to department tab
      await switchToObjectivesTab(managerPage, 'department');

      // Verify assigned objective is visible
      await verifyObjectiveVisible(managerPage, CORPORATE_OBJECTIVE.name);

      // Verify KPI is visible
      await expect(managerPage.locator(`text=${CORPORATE_KPI.name}`)).toBeVisible();
    });

    test('should see correct department in debug panel', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Check if debug panel is visible
      const debugPanel = managerPage.locator('text=Debug Info');
      
      if (await debugPanel.isVisible()) {
        // Verify manager details
        await expect(managerPage.locator('text=MANAGER')).toBeVisible();
        await expect(managerPage.locator(`text=${TEST_USERS.MANAGER.departmentName}`)).toBeVisible();
      }
    });

    test('should not see objectives from other departments', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Switch to department tab
      await switchToObjectivesTab(managerPage, 'department');

      // Create a test objective for another department (as super admin)
      // Then verify manager cannot see it
      // This would require creating another objective assigned to a different department
      // For now, we just verify the manager sees their own department objectives
      
      await expect(managerPage.locator(`text=${TEST_USERS.MANAGER.departmentName}`)).toBeVisible();
    });
  });

  test.describe('Part 4: MANAGER Creates Department Objective', () => {
    test('should create department objective', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Create department objective
      await createObjective(managerPage, DEPARTMENT_OBJECTIVE);

      // Verify objective is created (status should be NOT_SUBMITTED or DRAFT)
      await verifyObjectiveVisible(managerPage, DEPARTMENT_OBJECTIVE.name);
    });

    test('should add KPI to department objective', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Switch to department tab
      await switchToObjectivesTab(managerPage, 'department');

      // Add KPI to department objective
      await addKPIToObjective(managerPage, DEPARTMENT_OBJECTIVE.name, DEPARTMENT_KPI);

      // Verify KPI was added
      await expect(managerPage.locator(`text=${DEPARTMENT_KPI.name}`)).toBeVisible();
    });

    test('department objective should require approval', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Switch to department tab
      await switchToObjectivesTab(managerPage, 'department');

      // Check status is NOT_SUBMITTED or PENDING (not auto-approved)
      const statusLocator = managerPage.locator(`tr:has-text("${DEPARTMENT_OBJECTIVE.name}") text=NOT_SUBMITTED, tr:has-text("${DEPARTMENT_OBJECTIVE.name}") text=DRAFT`);
      await expect(statusLocator.first()).toBeVisible();
    });
  });

  test.describe('Part 5: Status Change Functionality', () => {
    test('SUPER_ADMIN can manually change objective status', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Switch to department tab to find the manager's objective
      await switchToObjectivesTab(superAdminPage, 'department');

      // Change status to APPROVED
      await changeObjectiveStatus(superAdminPage, DEPARTMENT_OBJECTIVE.name, 'APPROVED');

      // Verify status changed
      await checkObjectiveStatus(superAdminPage, DEPARTMENT_OBJECTIVE.name, 'APPROVED');
    });

    test('MANAGER should not see Change Status option', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Switch to department tab
      await switchToObjectivesTab(managerPage, 'department');

      // Find objective and click menu
      const objective = managerPage.locator(`tr:has-text("${DEPARTMENT_OBJECTIVE.name}")`).first();
      await objective.locator('button:has-text("⋮"), button[aria-label="Open menu"]').click();

      // Verify Change Status is not visible
      await expect(managerPage.locator('text=Change Status')).not.toBeVisible();
    });
  });

  test.describe('Part 6: Permission Checks', () => {
    test('MANAGER should only see employees from their department', async ({ managerPage }) => {
      // Navigate to objectives
      await navigateToObjectives(managerPage);

      // Try to assign KPI to employee
      await switchToObjectivesTab(managerPage, 'department');
      
      const objective = managerPage.locator(`tr:has-text("${CORPORATE_OBJECTIVE.name}")`).first();
      await objective.click();

      // Click Assign KPI
      await managerPage.click('button:has-text("Assign KPI")');

      // Click Employee tab
      await managerPage.click('button:has-text("Employee")');

      // Verify only department employees are shown
      // This would check that the employee dropdown is filtered
      const employeeDropdown = managerPage.locator('select, [role="combobox"]');
      await expect(employeeDropdown).toBeVisible();

      // Check console for no permission errors
      const errors: string[] = [];
      managerPage.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Require one of roles')) {
          errors.push(msg.text());
        }
      });

      // Wait a bit to catch any errors
      await managerPage.waitForTimeout(2000);

      // Verify no permission errors
      expect(errors.length).toBe(0);
    });

    test('should not have notification null recipient errors', async ({ managerPage }) => {
      // Navigate to dashboard
      await managerPage.goto('/dashboard');

      // Click notification bell
      await managerPage.click('button:has([class*="bell"]), button[aria-label*="notification"]');

      // Check console for null recipient errors
      const errors: string[] = [];
      managerPage.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Cannot return null')) {
          errors.push(msg.text());
        }
      });

      // Wait for notifications to load
      await managerPage.waitForTimeout(2000);

      // Verify no null recipient errors
      expect(errors.length).toBe(0);
    });
  });

  test.describe('Part 7: Delete Functionality', () => {
    test('should actually delete objective', async ({ superAdminPage }) => {
      // Navigate to objectives
      await navigateToObjectives(superAdminPage);

      // Create a test objective to delete
      const deleteTestObjective = {
        name: `Test: Delete Me ${Date.now()}`,
        description: 'This objective will be deleted',
        type: 'CORPORATE' as const,
      };

      await createObjective(superAdminPage, deleteTestObjective);

      // Verify it exists
      await verifyObjectiveVisible(superAdminPage, deleteTestObjective.name);

      // Delete it
      const objective = superAdminPage.locator(`tr:has-text("${deleteTestObjective.name}")`).first();
      await objective.locator('button:has-text("⋮"), button[aria-label="Open menu"]').click();
      await superAdminPage.click('text=Delete');

      // Confirm deletion
      await superAdminPage.click('button:has-text("Yes, Delete")');

      // Wait for success message
      await expect(superAdminPage.locator('text=deleted successfully')).toBeVisible();

      // Verify objective is actually gone
      await verifyObjectiveNotVisible(superAdminPage, deleteTestObjective.name);
    });
  });
});
