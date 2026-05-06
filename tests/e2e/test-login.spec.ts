import { test, expect } from '@playwright/test';

/**
 * Simple login test to verify credentials work
 * Run this first: npx playwright test test-login.spec.ts --headed
 */

test.describe('Login Test', () => {
  test('should login as SUPER_ADMIN', async ({ page }) => {
    const email = process.env.TEST_SUPER_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.TEST_SUPER_ADMIN_PASSWORD || 'Admin@123';
    
    console.log(`Testing login with email: ${email}`);
    
    // Go to auth page
    await page.goto('/auth');
    
    // Wait for form
    await page.waitForSelector('input#email');
    
    // Fill credentials
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    
    // Click login
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for redirect (should go away from /auth)
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
    
    console.log(`Redirected to: ${page.url()}`);
    
    // Should be on dashboard or organization-template
    expect(page.url()).toMatch(/\/(dashboard|organization-template)/);
  });
  
  test('should login as MANAGER', async ({ page }) => {
    const email = process.env.TEST_MANAGER_EMAIL || 'david.kim@example.com';
    const password = process.env.TEST_MANAGER_PASSWORD || 'Manager@123';
    
    console.log(`Testing login with email: ${email}`);
    
    // Go to auth page
    await page.goto('/auth');
    
    // Wait for form
    await page.waitForSelector('input#email');
    
    // Fill credentials
    await page.fill('input#email', email);
    await page.fill('input#password', password);
    
    // Click login
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
    
    console.log(`Redirected to: ${page.url()}`);
    
    // Manager should go directly to dashboard
    expect(page.url()).toContain('/dashboard');
  });
});
