# Testing Guide for Chip & Pickle Dashboard

## Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

This will install Playwright and all required browser binaries (Chromium, Firefox, WebKit).

### 2. Set Up Test Data (Optional but Recommended)

**Create a test Supabase project** (recommended) or use your existing one:

1. Go to Supabase SQL Editor
2. Run `/scripts/seed-test-data.sql`
3. Update the variables at the top:
   ```sql
   v_project_id := 'YOUR_PROJECT_ID'; -- Get from: SELECT id FROM projects LIMIT 1;
   v_user_id := 'YOUR_USER_ID';       -- Get from: SELECT user_id FROM profiles LIMIT 1;
   ```

This will populate your database with:
- 14 contractors
- 50+ budget items
- 42 tasks (past, present, and future)

### 3. Configure Test Credentials

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and add your test account credentials:
```
TEST_EMAIL=your-test-email@example.com
TEST_PASSWORD=your-test-password
```

### 4. Run Tests

**Run all tests (headless):**
```bash
npm test
```

**Run with UI (recommended for debugging):**
```bash
npm run test:ui
```

**Run with headed browsers (see what's happening):**
```bash
npm run test:headed
```

**View test report:**
```bash
npm run test:report
```

---

## What Gets Tested

### Visual Regression Testing
- Screenshots at 6 different viewport sizes:
  - Mobile (375px) - iPhone SE
  - Mobile Large (414px) - iPhone Pro Max
  - Tablet (768px) - iPad
  - Laptop (1024px)
  - Desktop (1440px)
  - Desktop Large (1920px)

### Pages Tested
- ✅ Dashboard
- ✅ Tasks
- ✅ Budget
- ✅ Contractors
- ✅ Master Plan
- ✅ Team Settings

### Functional Tests
- Dashboard widget rendering
- Budget snapshot calculations
- Contractors widget display
- Budget card layout
- Search and filter functionality
- Payment status filters
- Task creation flow

### Performance Tests
- Dashboard load time (< 3 seconds)
- Budget page load time (< 2 seconds)

### Mobile-Specific Tests
- Navigation works
- Touch targets are large enough (44x44px minimum)

### Accessibility Tests
- Images have alt text
- Buttons have accessible names
- Basic accessibility compliance

---

## Test Results

After running tests, find results in:
- **Screenshots:** `test-results/screenshots/`
- **HTML Report:** `test-results/html-report/`
- **Videos:** `test-results/` (only on failures)

---

## Manual Testing Checklist

Use the comprehensive manual testing checklist in `/STRESS_TEST_PLAN.md`

Key areas to manually verify:
1. **CRUD Operations** - Create, read, update, delete for all entities
2. **Edge Cases** - Long text, missing data, special characters
3. **Performance** - Page load times under different network conditions
4. **Browser Compatibility** - Chrome, Safari, Firefox, Edge
5. **Authentication** - Login, logout, password changes
6. **Data Integrity** - Changes persist across page refreshes

---

## CI/CD Integration

To run tests in CI/CD (GitHub Actions, etc.):

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm test
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

---

## Debugging Failed Tests

### View trace for failed test:
```bash
npx playwright show-trace test-results/trace.zip
```

### Run specific test:
```bash
npx playwright test tests/visual-regression.spec.ts:10
```

### Run specific browser only:
```bash
npx playwright test --project=chromium
```

### Debug mode:
```bash
npx playwright test --debug
```

---

## Best Practices

1. **Always test in a staging environment first**
   - Don't run tests against production database
   - Use a separate test account

2. **Keep test data clean**
   - Clean up after tests (or use database transactions)
   - Use realistic test data from seed script

3. **Update screenshots when design changes**
   - Review visual diffs carefully
   - Update baseline screenshots when changes are intentional

4. **Run tests before deploying**
   - Make tests part of your deployment checklist
   - Fix failures before going live

5. **Monitor performance**
   - Track load times over time
   - Set performance budgets

---

## Troubleshooting

### "Error: Target page, context or browser has been closed"
- Usually means test is trying to interact with element that's no longer visible
- Add `await page.waitForLoadState('networkidle')` before assertions

### "TimeoutError: Timeout 30000ms exceeded"
- Increase timeout: `await page.waitForSelector('selector', { timeout: 60000 })`
- Or check if element selector is correct

### "Authentication failed"
- Verify TEST_EMAIL and TEST_PASSWORD in .env.test
- Check that test account exists in your Supabase project

### Screenshots look different on CI vs local
- This is normal - different OS renders slightly differently
- Use `threshold` option in screenshot comparison for CI

---

## Next Steps

After stress testing:

1. ✅ Review all screenshots for visual issues
2. ✅ Fix any failing tests
3. ✅ Optimize any slow-loading pages
4. ✅ Add more tests for critical user flows
5. ✅ Set up CI/CD to run tests automatically
6. ✅ Create a testing schedule (weekly, pre-deploy, etc.)

---

## Questions?

Refer to:
- Playwright docs: https://playwright.dev/
- Main testing plan: `/STRESS_TEST_PLAN.md`
- Seed data script: `/scripts/seed-test-data.sql`
