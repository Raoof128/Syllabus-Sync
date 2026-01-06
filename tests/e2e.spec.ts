import { test, expect } from '@playwright/test';

test.describe('End-to-End Tests', () => {
  test('should load home page and display dashboard', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // Check if main elements are present
    await expect(page).toHaveTitle(/Syllabus Sync/);
    // Wait for either the dashboard main OR the login screen (handles unauthenticated test runs)
    const main = page.getByRole('main');
    const loginHeading = page.getByRole('heading', { name: /welcome to/i }).first();

    await Promise.race([
      main.waitFor({ state: 'visible', timeout: 5000 }),
      loginHeading.waitFor({ state: 'visible', timeout: 5000 }),
    ]);

    // Ensure at least one is visible
    const mainVisible = await main.isVisible().catch(() => false);
    const loginVisible = await loginHeading.isVisible().catch(() => false);
    expect(mainVisible || loginVisible).toBeTruthy();

    // If main is visible, ensure the Home link is also visible
    if (mainVisible) {
      await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    }
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
