# Automated Test Suite

Complete end-to-end test suite for the Objectives Workflow using Playwright.

## Quick Start

### 1. Run Setup Script

**On macOS/Linux:**
```bash
chmod +x scripts/setup-tests.sh
./scripts/setup-tests.sh
```

**On Windows:**
```bash
scripts\setup-tests.bat
```

### 2. Configure Test Credentials

Edit `.env.test` in the root directory:

```env
TEST_SUPER_ADMIN_EMAIL=your-admin@example.com
TEST_SUPER_ADMIN_PASSWORD=YourPassword

TEST_MANAGER_EMAIL=david.kim@example.com
TEST_MANAGER_PASSWORD=YourPassword
```

### 3. Run Tests

```bash
# Run with UI (recommended for first time)
npm run test:e2e:ui

# Or run in terminal
npm run test:e2e
```

## What Gets Tested

### ✅ Complete Workflow Coverage

1. **Corporate Objective Creation**
   - SUPER_ADMIN creates corporate objective
   - Auto-approval verification
   - KPI creation with auto-approval

2. **Department Assignment**
   - Assign KPI to Software Engineering department
   - Verify assignment visibility

3. **Manager View**
   - David Kim (MANAGER) sees assigned objectives
   - Department filtering works correctly
   - Debug panel shows correct information

4. **Department Objective Creation**
   - Manager creates department-level objective
   - Adds KPI with quarterly breakdown
   - Requires approval (not auto-approved)

5. **Status Management**
   - SUPER_ADMIN can change status manually
   - MANAGER cannot change status
   - Status changes persist correctly

6. **Permission System**
   - Managers only see their department employees
   - No "Require ADMIN role" errors
   - No notification null recipient errors

7. **Delete Functionality**
   - Objectives are actually deleted
   - Not just showing success message

## Test Files

```
tests/
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts                    # Login/logout helpers
│   ├── helpers/
│   │   └── objectives.ts              # Objective operations
│   ├── objectives-workflow.spec.ts    # Main test suite
│   └── .env.example                   # Environment template
└── README.md                          # This file
```

## Running Tests

### Interactive UI Mode (Best for Development)

```bash
npm run test:e2e:ui
```

**Features:**
- See all tests in a tree view
- Run individual tests
- Watch tests execute in real-time
- Debug failures with trace viewer
- See screenshots and videos

### Headless Mode (Best for CI/CD)

```bash
npm run test:e2e
```

Runs all tests without opening browser windows.

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Opens browser windows so you can watch tests execute.

### Debug Mode

```bash
npm run test:e2e:debug
```

Pauses at each step for debugging.

### Run Specific Test

```bash
npx playwright test -g "should create corporate objective"
```

### Run Specific File

```bash
npx playwright test objectives-workflow.spec.ts
```

## Understanding Results

### Success Output

```
Running 15 tests using 1 worker

  ✓ Part 1: SUPER_ADMIN Creates Corporate Objective (2 tests)
  ✓ Part 2: SUPER_ADMIN Assigns to Department (2 tests)
  ✓ Part 3: MANAGER Views Department Objectives (3 tests)
  ✓ Part 4: MANAGER Creates Department Objective (3 tests)
  ✓ Part 5: Status Change Functionality (2 tests)
  ✓ Part 6: Permission Checks (2 tests)
  ✓ Part 7: Delete Functionality (1 test)

  15 passed (45s)
```

### Failure Output

```
  ✗ should create corporate objective with auto-approval

    Error: Timed out waiting for locator
    
    Locator: text=APPROVED
    Expected: visible
    Received: hidden
    
    Call log:
      - waiting for locator('text=APPROVED')
```

## Viewing Reports

After running tests:

```bash
npm run test:e2e:report
```

Opens an HTML report with:
- ✅ Test results
- 📸 Screenshots
- 🎥 Videos
- 📊 Network activity
- 📝 Console logs
- 🔍 Trace viewer

## Debugging Failed Tests

### Method 1: Use Trace Viewer

1. Run test with `npm run test:e2e:ui`
2. Click failed test
3. Click "Show trace"
4. Step through execution
5. See screenshots at each step

### Method 2: Add Breakpoints

```typescript
test('my test', async ({ page }) => {
  await page.pause(); // Pauses here
  // ... rest of test
});
```

### Method 3: Take Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### Method 4: Check Console Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

## Common Issues

### Issue: "Cannot find module @playwright/test"

**Solution:**
```bash
npm install -D @playwright/test
npx playwright install
```

### Issue: "Port 3000 already in use"

**Solution:**
Stop your dev server or change port in `playwright.config.ts`

### Issue: "Timed out waiting for locator"

**Solutions:**
1. Increase timeout: `{ timeout: 15000 }`
2. Check if element exists
3. Use Playwright Inspector to find correct selector
4. Run in headed mode to see what's happening

### Issue: Login fails

**Solutions:**
1. Verify credentials in `.env.test`
2. Check if login page changed
3. Update selectors in `fixtures/auth.ts`

## Best Practices

### ✅ DO

- Use unique test data: `Test ${Date.now()}`
- Use helper functions from `helpers/objectives.ts`
- Add meaningful assertions
- Clean up test data after tests
- Use page fixtures for authentication

### ❌ DON'T

- Hard-code test data
- Use `page.waitForTimeout()` excessively
- Ignore test failures
- Run tests against production
- Commit `.env.test` to git

## CI/CD Integration

### GitHub Actions

See `TEST_SETUP_GUIDE.md` for complete GitHub Actions workflow.

### GitLab CI

```yaml
test:e2e:
  image: mcr.microsoft.com/playwright:latest
  script:
    - npm ci
    - npx playwright install
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - playwright-report/
```

## Extending Tests

### Add New Test

```typescript
test('my new test', async ({ superAdminPage }) => {
  await navigateToObjectives(superAdminPage);
  // ... your test code
});
```

### Add New Helper

In `helpers/objectives.ts`:

```typescript
export async function myNewHelper(page: Page, param: string) {
  // ... helper code
}
```

### Add New Fixture

In `fixtures/auth.ts`:

```typescript
export const test = base.extend<{ myFixture: Page }>({
  myFixture: async ({ browser }, use) => {
    // ... setup
    await use(page);
    // ... teardown
  },
});
```

## Test Coverage

Current coverage:

- ✅ Objective creation (Corporate, Department)
- ✅ KPI creation and assignment
- ✅ Department assignment workflow
- ✅ Manager visibility and permissions
- ✅ Status change functionality
- ✅ Delete functionality
- ✅ Permission error prevention
- ✅ Notification error prevention

Not yet covered:

- ⏳ Division-level objectives
- ⏳ Personnel-level objectives
- ⏳ Approval workflow
- ⏳ Submission workflow
- ⏳ KPI progress updates
- ⏳ Reporting features

## Performance

Typical test run times:

- Full suite: ~45 seconds
- Single test: ~2-5 seconds
- With UI mode: Depends on interaction

## Support

For help:

1. Check `TEST_SETUP_GUIDE.md`
2. Review [Playwright Documentation](https://playwright.dev)
3. Check test logs and screenshots
4. Use debug mode
5. Review console logs

## Contributing

When adding new tests:

1. Follow existing patterns
2. Use helper functions
3. Add meaningful descriptions
4. Include assertions
5. Clean up test data
6. Update this README

---

**Happy Testing! 🎉**
