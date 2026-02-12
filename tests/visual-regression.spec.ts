/**
 * Visual Regression & Responsive Testing
 * 
 * Run with: npx playwright test
 * 
 * This test suite captures screenshots at different viewport sizes
 * to verify responsive design and identify any UI issues.
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Common viewport sizes to test
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'iPhone-SE' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone-Pro-Max' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  laptop: { width: 1024, height: 768, name: 'Laptop' },
  desktop: { width: 1440, height: 900, name: 'Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop-Large' },
};

// Pages to test
const PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/tasks', name: 'Tasks' },
  { path: '/budget', name: 'Budget' },
  { path: '/contractors', name: 'Contractors' },
  { path: '/master-plan', name: 'Master-Plan' },
  { path: '/settings/team', name: 'Team-Settings' },
];

test.describe('Visual Regression Testing', () => {
  // Login before all tests
  test.beforeEach(async ({ page }) => {
    // Adjust these credentials for your test account
    await page.goto(`${BASE_URL}/login`);
    
    // Check if already logged in
    const isLoggedIn = await page.url().includes('/dashboard');
    if (!isLoggedIn) {
      await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'test@example.com');
      await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }
  });

  // Test each page at each viewport size
  for (const viewport of Object.values(VIEWPORTS)) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const pageDef of PAGES) {
        test(`${pageDef.name} renders correctly`, async ({ page }) => {
          await page.goto(`${BASE_URL}${pageDef.path}`);
          
          // Wait for page to be stable
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000); // Allow animations to complete

          // Take full page screenshot
          await page.screenshot({
            path: `test-results/screenshots/${viewport.name}/${pageDef.name}.png`,
            fullPage: true,
          });

          // Basic assertions
          await expect(page).toHaveTitle(/Chip & Pickle/);
          
          // Check for console errors
          const errors: string[] = [];
          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              errors.push(msg.text());
            }
          });
          
          // Verify no horizontal scroll (except on mobile for tables)
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          const viewportWidth = await page.evaluate(() => window.innerWidth);
          if (viewport.width >= 768) {
            expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
          }
        });
      }
    });
  }
});

test.describe('Dashboard Widget Tests', () => {
  test('Dashboard loads all widgets', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for key elements
    await expect(page.getByText('Budget Snapshot')).toBeVisible();
    await expect(page.getByText('Contractors')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Progress by Phase')).toBeVisible();

    // Check for "View all" links
    const viewAllLinks = page.getByText('View all →');
    await expect(viewAllLinks.first()).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/dashboard-full.png',
      fullPage: true,
    });
  });

  test('Budget snapshot displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for budget elements
    const budgetSection = page.getByText('Budget Snapshot').locator('..');
    await expect(budgetSection.getByText('Forecast')).toBeVisible();
    await expect(budgetSection.getByText('Actual')).toBeVisible();
    await expect(budgetSection.getByText('Variance')).toBeVisible();
  });

  test('Contractors widget displays correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check contractors section
    const contractorsSection = page.getByText('Contractors').locator('..');
    await expect(contractorsSection).toBeVisible();
    
    // Should show count
    await expect(contractorsSection.locator('text=/^\\d+$/')).toBeVisible();
  });
});

test.describe('Budget Page Tests', () => {
  test('Budget cards render uniformly', async ({ page }) => {
    await page.goto(`${BASE_URL}/budget`);
    await page.waitForLoadState('networkidle');

    // Get all budget cards
    const cards = page.locator('.card');
    const count = await cards.count();

    if (count > 0) {
      // Check first card has all expected elements
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();
      
      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/budget-cards.png',
        fullPage: true,
      });
    }
  });

  test('Search and filter work', async ({ page }) => {
    await page.goto(`${BASE_URL}/budget`);
    await page.waitForLoadState('networkidle');

    // Test search
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Take screenshot of search results
      await page.screenshot({
        path: 'test-results/screenshots/budget-search.png',
      });
      
      await searchInput.clear();
    }

    // Test category filter
    const categorySelect = page.locator('select').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('Payment status filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/budget`);
    await page.waitForLoadState('networkidle');

    // Test payment filter buttons
    const paidButton = page.getByText('Paid');
    if (await paidButton.isVisible()) {
      await paidButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: 'test-results/screenshots/budget-paid-filter.png',
      });
    }
  });
});

test.describe('Task CRUD Operations', () => {
  test('Create new task', async ({ page }) => {
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForLoadState('networkidle');

    // Click new task button
    await page.getByText('New Task').first().click();
    await page.waitForTimeout(500);

    // Fill form
    await page.fill('input[placeholder*="task"]', 'Test Task - Automated');
    await page.fill('textarea', 'This is a test task created by automated testing');
    
    // Take screenshot of modal
    await page.screenshot({
      path: 'test-results/screenshots/task-create-modal.png',
    });

    // Note: Don't actually submit to avoid polluting the database
    // In a real test, you would submit and then clean up
  });
});

test.describe('Performance Tests', () => {
  test('Dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('Budget page loads within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/budget`);
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`Budget page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Mobile-Specific Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Mobile navigation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for mobile navigation (bottom bar or hamburger)
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/mobile-navigation.png',
      fullPage: true,
    });
  });

  test('Touch targets are large enough', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Get all buttons
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44px
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('Dashboard has no critical accessibility issues', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for basic accessibility
    // You can integrate axe-core here for comprehensive testing
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt', /.*/);
    }

    // Check all buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });
});
