import { test as base, Page } from '@playwright/test';

// Test users
export const TEST_USERS = {
  SUPER_ADMIN: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'Admin@123',
    role: 'SUPER_ADMIN',
  },
  MANAGER: {
    email: process.env.TEST_MANAGER_EMAIL || 'david.kim@example.com',
    password: process.env.TEST_MANAGER_PASSWORD || 'Manager@123',
    role: 'MANAGER',
    name: 'David Kim',
    departmentId: '8df421d2-2461-46bf-99af-17beb62962b1',
    departmentName: 'Software Engineering',
  },
  EMPLOYEE: {
    email: process.env.TEST_EMPLOYEE_EMAIL || 'employee@example.com',
    password: process.env.TEST_EMPLOYEE_PASSWORD || 'Employee@123',
    role: 'NORMAL',
  },
};

// Helper function to login
export async function login(page: Page, email: string, password: string) {
  // Navigate to auth page
  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for the login form to be visible
  await page.waitForSelector('input#email', { timeout: 20000 });
  
  // Fill in credentials
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  
  // Click login button - use modern approach with waitForURL
  await page.click('button[type="submit"]:has-text("Login")');
  
  // Wait for redirect away from auth page (could go to dashboard or organization-template)
  await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // If on organization-template (ADMIN/SUPER_ADMIN), navigate to dashboard for tests
  if (page.url().includes('/organization-template')) {
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  }
}

// Helper function to logout
export async function logout(page: Page) {
  // Click user avatar/menu button (look for the dropdown trigger)
  await page.click('button:has([class*="avatar"]), button:has-text("Admin"), button:has-text("Manager")');
  
  // Wait for dropdown menu to appear and click logout
  await page.click('text=Logout');
  
  // Wait for redirect to auth page
  await page.waitForURL('**/auth**', { timeout: 10000 });
}

// Extended test with authenticated contexts
type AuthFixtures = {
  superAdminPage: Page;
  managerPage: Page;
  employeePage: Page;
};

export const test = base.extend<AuthFixtures>({
  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_USERS.SUPER_ADMIN.email, TEST_USERS.SUPER_ADMIN.password);
    await use(page);
    await context.close();
  },
  
  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_USERS.MANAGER.email, TEST_USERS.MANAGER.password);
    await use(page);
    await context.close();
  },
  
  employeePage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, TEST_USERS.EMPLOYEE.email, TEST_USERS.EMPLOYEE.password);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
