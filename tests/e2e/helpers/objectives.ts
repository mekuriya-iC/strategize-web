import { Page, expect } from '@playwright/test';

export interface ObjectiveData {
  name: string;
  description: string;
  type: 'CORPORATE' | 'DIVISION' | 'DEPARTMENT' | 'PERSONNEL';
  strategicPeriod?: string;
}

export interface KPIData {
  name: string;
  baseline: string;
  weight: string;
  unitType: 'NUMBER' | 'PERCENT';
  annualTarget: string;
  quarters?: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
}

/**
 * Navigate to objectives page
 */
export async function navigateToObjectives(page: Page) {
  await page.click('text=Objectives, a[href*="/objectives"]');
  await page.waitForURL('**/objectives**');
  await page.waitForLoadState('networkidle');
}

/**
 * Create a new objective
 */
export async function createObjective(page: Page, data: ObjectiveData) {
  // Click Add Objective button
  await page.click('button:has-text("Add Objective"), a:has-text("Add Objective")');
  
  // Wait for form to load
  await page.waitForURL('**/objectives/new**');
  await page.waitForLoadState('networkidle');
  
  // Fill in objective name
  await page.fill('input[name="objectiveName"], input:below(label:has-text("Objective Name"))', data.name);
  
  // Fill in description
  if (data.description) {
    await page.fill('textarea[name="description"], textarea:below(label:has-text("Description"))', data.description);
  }
  
  // Select objective type
  await page.click('button:has-text("Select objective type")');
  await page.click(`text=${data.type.charAt(0) + data.type.slice(1).toLowerCase()}`);
  
  // Select strategic period if provided
  if (data.strategicPeriod) {
    await page.click('button:has-text("Select strategic period")');
    await page.click(`text=${data.strategicPeriod}`);
  } else {
    // Select first available period
    await page.click('button:has-text("Select strategic period")');
    await page.click('[role="option"]:first-child');
  }
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Add Objective")');
  
  // Wait for success and redirect
  await page.waitForURL('**/objectives**', { timeout: 15000 });
  
  // Wait for toast notification
  await expect(page.locator('text=created, text=success')).toBeVisible({ timeout: 10000 });
}

/**
 * Find objective by name in the list
 */
export async function findObjective(page: Page, name: string) {
  await page.waitForSelector(`text=${name}`, { timeout: 10000 });
  return page.locator(`tr:has-text("${name}"), div:has-text("${name}")`).first();
}

/**
 * Check objective status
 */
export async function checkObjectiveStatus(page: Page, objectiveName: string, expectedStatus: string) {
  const objective = await findObjective(page, objectiveName);
  await expect(objective.locator(`text=${expectedStatus}`)).toBeVisible();
}

/**
 * Add KPI to objective
 */
export async function addKPIToObjective(page: Page, objectiveName: string, kpiData: KPIData) {
  // Find and click the objective
  const objective = await findObjective(page, objectiveName);
  await objective.click();
  
  // Wait for objective details to expand or load
  await page.waitForTimeout(1000);
  
  // Click Add KPI button
  await page.click('button:has-text("Add KPI")');
  
  // Wait for KPI form dialog
  await page.waitForSelector('text=Add KPI', { timeout: 10000 });
  
  // Fill in KPI name
  await page.fill('input[name="name"], input:below(label:has-text("KPI Name"))', kpiData.name);
  
  // Fill in baseline
  await page.fill('input[name="baseline"], input:below(label:has-text("Baseline"))', kpiData.baseline);
  
  // Fill in weight
  await page.fill('input[name="weight"], input:below(label:has-text("Weight"))', kpiData.weight);
  
  // Select unit type
  await page.click('button:has-text("Select"), select[name="unitType"]');
  await page.click(`text=${kpiData.unitType}`);
  
  // Fill in annual target
  await page.fill('input:below(label:has-text("Annual Target"))', kpiData.annualTarget);
  
  // Fill in quarterly breakdown if provided (for non-corporate)
  if (kpiData.quarters) {
    await page.fill('input:below(label:has-text("Q1"))', kpiData.quarters.q1);
    await page.fill('input:below(label:has-text("Q2"))', kpiData.quarters.q2);
    await page.fill('input:below(label:has-text("Q3"))', kpiData.quarters.q3);
    await page.fill('input:below(label:has-text("Q4"))', kpiData.quarters.q4);
  }
  
  // Submit KPI form
  await page.click('button[type="submit"]:has-text("Create KPI")');
  
  // Wait for success
  await expect(page.locator('text=KPI Created Successfully, text=success')).toBeVisible({ timeout: 10000 });
}

/**
 * Assign KPI to department
 */
export async function assignKPIToDepartment(
  page: Page,
  objectiveName: string,
  departmentName: string,
  targetValue: string
) {
  // Find the objective
  const objective = await findObjective(page, objectiveName);
  await objective.click();
  
  // Wait for details
  await page.waitForTimeout(1000);
  
  // Click Assign KPI button
  await page.click('button:has-text("Assign KPI")');
  
  // Wait for assignment dialog
  await page.waitForSelector('text=Assign KPI', { timeout: 10000 });
  
  // Click Department tab
  await page.click('button:has-text("Department")');
  
  // Select department
  await page.click('button:has-text("Select department")');
  await page.click(`text=${departmentName}`);
  
  // Fill in target value
  await page.fill('input[name="targetValue"], input:below(label:has-text("Target Value"))', targetValue);
  
  // Submit assignment
  await page.click('button:has-text("Assign KPI")');
  
  // Wait for success
  await expect(page.locator('text=assigned successfully, text=success')).toBeVisible({ timeout: 10000 });
}

/**
 * Change objective status
 */
export async function changeObjectiveStatus(
  page: Page,
  objectiveName: string,
  newStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
) {
  // Find the objective
  const objective = await findObjective(page, objectiveName);
  
  // Click three-dot menu
  await objective.locator('button:has-text("⋮"), button[aria-label="Open menu"]').click();
  
  // Click Change Status
  await page.click('text=Change Status');
  
  // Wait for status dialog
  await page.waitForSelector('text=Change Objective Status', { timeout: 10000 });
  
  // Select new status
  await page.click('button:has-text("Select new status")');
  await page.click(`text=${newStatus.replace('_', ' ')}`);
  
  // Submit
  await page.click('button:has-text("Change Status")');
  
  // Wait for success
  await expect(page.locator('text=status changed, text=success')).toBeVisible({ timeout: 10000 });
}

/**
 * Switch to objectives tab
 */
export async function switchToObjectivesTab(page: Page, tab: 'corporate' | 'division' | 'department' | 'personnel') {
  const tabText = tab.charAt(0).toUpperCase() + tab.slice(1);
  await page.click(`button:has-text("${tabText} Objectives")`);
  await page.waitForLoadState('networkidle');
}

/**
 * Count objectives in current view
 */
export async function countObjectives(page: Page): Promise<number> {
  const objectives = await page.locator('tr[data-testid="objective-row"], div[data-testid="objective-card"]').count();
  return objectives;
}

/**
 * Verify objective is visible
 */
export async function verifyObjectiveVisible(page: Page, objectiveName: string) {
  await expect(page.locator(`text=${objectiveName}`)).toBeVisible({ timeout: 10000 });
}

/**
 * Verify objective is not visible
 */
export async function verifyObjectiveNotVisible(page: Page, objectiveName: string) {
  await expect(page.locator(`text=${objectiveName}`)).not.toBeVisible({ timeout: 5000 });
}
