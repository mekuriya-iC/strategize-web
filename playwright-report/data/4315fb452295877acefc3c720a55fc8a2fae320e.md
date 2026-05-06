# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-login.spec.ts >> Login Test >> should login as MANAGER
- Location: tests/e2e/test-login.spec.ts:37:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - img "Strategize Logo" [ref=e4]
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - heading "Welcome Back" [level=1] [ref=e9]
          - paragraph [ref=e10]: Please enter your email and password to continue
        - generic [ref=e12]:
          - img [ref=e14]
          - textbox "Email" [ref=e17]: david.kim@example.com
        - generic [ref=e19]:
          - img [ref=e21]
          - textbox "Password" [ref=e24]: Manager@123
          - button [ref=e25]:
            - img [ref=e26]
        - generic [ref=e29]:
          - generic [ref=e30]:
            - checkbox "Remember me" [ref=e31]
            - checkbox
            - generic [ref=e32]: Remember me
          - link "Forgot Password?" [ref=e33] [cursor=pointer]:
            - /url: /auth/forgot-password
        - button "Login" [ref=e34] [cursor=pointer]
      - generic [ref=e35]: © 2024 Stratify. Align. Act. Achieve. All Rights Reserved.
    - generic [ref=e37]:
      - heading "Align. Act. Achieve." [level=2] [ref=e38]
      - paragraph [ref=e39]: Your strategic workspace for long-term planning.
      - generic [ref=e40]:
        - img "Dashboard Preview" [ref=e41]
        - img "Chart Sample Overlay" [ref=e42]
  - region "Notifications alt+T"
  - generic [ref=e47] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e48]:
      - img [ref=e49]
    - generic [ref=e52]:
      - button "Open issues overlay" [ref=e53]:
        - generic [ref=e54]:
          - generic [ref=e55]: "0"
          - generic [ref=e56]: "1"
        - generic [ref=e57]: Issue
      - button "Collapse issues badge" [ref=e58]:
        - img [ref=e59]
  - alert [ref=e61]
  - button "Open Debug Panel" [ref=e62]:
    - img
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Simple login test to verify credentials work
  5  |  * Run this first: npx playwright test test-login.spec.ts --headed
  6  |  */
  7  | 
  8  | test.describe('Login Test', () => {
  9  |   test('should login as SUPER_ADMIN', async ({ page }) => {
  10 |     const email = process.env.TEST_SUPER_ADMIN_EMAIL || 'admin@example.com';
  11 |     const password = process.env.TEST_SUPER_ADMIN_PASSWORD || 'Admin@123';
  12 |     
  13 |     console.log(`Testing login with email: ${email}`);
  14 |     
  15 |     // Go to auth page
  16 |     await page.goto('/auth');
  17 |     
  18 |     // Wait for form
  19 |     await page.waitForSelector('input#email');
  20 |     
  21 |     // Fill credentials
  22 |     await page.fill('input#email', email);
  23 |     await page.fill('input#password', password);
  24 |     
  25 |     // Click login
  26 |     await page.click('button[type="submit"]:has-text("Login")');
  27 |     
  28 |     // Wait for redirect (should go away from /auth)
  29 |     await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
  30 |     
  31 |     console.log(`Redirected to: ${page.url()}`);
  32 |     
  33 |     // Should be on dashboard or organization-template
  34 |     expect(page.url()).toMatch(/\/(dashboard|organization-template)/);
  35 |   });
  36 |   
  37 |   test('should login as MANAGER', async ({ page }) => {
  38 |     const email = process.env.TEST_MANAGER_EMAIL || 'david.kim@example.com';
  39 |     const password = process.env.TEST_MANAGER_PASSWORD || 'Manager@123';
  40 |     
  41 |     console.log(`Testing login with email: ${email}`);
  42 |     
  43 |     // Go to auth page
  44 |     await page.goto('/auth');
  45 |     
  46 |     // Wait for form
  47 |     await page.waitForSelector('input#email');
  48 |     
  49 |     // Fill credentials
  50 |     await page.fill('input#email', email);
  51 |     await page.fill('input#password', password);
  52 |     
  53 |     // Click login
  54 |     await page.click('button[type="submit"]:has-text("Login")');
  55 |     
  56 |     // Wait for redirect
> 57 |     await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 30000 });
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  58 |     
  59 |     console.log(`Redirected to: ${page.url()}`);
  60 |     
  61 |     // Manager should go directly to dashboard
  62 |     expect(page.url()).toContain('/dashboard');
  63 |   });
  64 | });
  65 | 
```