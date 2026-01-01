import { test, expect } from '@playwright/test';

test.describe('End-to-End Tests', () => {
  test('should load home page and display dashboard', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check if main elements are present
    await expect(page).toHaveTitle(/Syllabus Sync/);
    // Wait for page to load and check for main content areas
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should navigate between pages using sidebar', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // On mobile, open the sidebar first
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      const menuButton = page.getByRole('button', { name: /menu|open/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    // Click on Calendar link
    await page.getByRole('link', { name: /calendar/i }).click();
    await page.waitForURL(/.*calendar/);
    await expect(page).toHaveURL(/.*calendar/);

    // On mobile, sidebar might close, so open it again
    if (viewport && viewport.width < 768) {
      const menuButton = page.getByRole('button', { name: /menu|open/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    // Click on Map link
    await page.getByRole('link', { name: /map/i }).click();
    await page.waitForURL(/.*map/);
    await expect(page).toHaveURL(/.*map/);
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Check if dark mode toggle exists (button with aria-label containing "mode")
    const darkModeToggle = page.getByRole('button', { name: /mode/i });
    await expect(darkModeToggle).toBeVisible();
  });

  test('should handle form submissions', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Click add unit button (first one in the main content)
    await page
      .getByRole('button', { name: /add unit/i })
      .first()
      .click();

    // Check if modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /add new unit/i })).toBeVisible();
  });
});
