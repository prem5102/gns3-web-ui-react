import { test, expect } from '@playwright/test';

test.describe('GNS3 Modern Web UI', () => {
  test('loads application and displays top navigation and brand', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/GNS3/i);

    // Check brand in TopNav
    const brand = page.locator('header');
    await expect(brand).toContainText('GNS3');
    await expect(brand).toContainText('Modern UI');
  });

  test('displays sidebar tabs and allows switching', async ({ page }) => {
    await page.goto('/');

    // Check sidebar contains device library or project items
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Check sidebar tabs exist
    const projectButton = page.locator('button[title="Projects"]');
    const deviceButton = page.locator('button[title="Device Library"]');
    await expect(projectButton).toBeVisible();
    await expect(deviceButton).toBeVisible();
  });

  test('opens settings modal when clicking settings button', async ({ page }) => {
    await page.goto('/');

    // Click settings button
    const settingsBtn = page.locator('button[title="Controller Settings"]');
    await settingsBtn.click();

    // Verify dialog opens
    await expect(page.locator('text=Controller Settings')).toBeVisible();
    await expect(page.locator('text=Controller Base URL')).toBeVisible();
  });
});
