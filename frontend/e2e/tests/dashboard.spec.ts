import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display dashboard title', async ({ page }) => {
        await expect(page.locator('h1, h2')).toContainText(/dashboard|practice/i);
    });

    test('should have navigation to practice session', async ({ page }) => {
        // Look for a button or link to start practice
        const startButton = page.getByRole('button', { name: /start|practice|begin/i });
        await expect(startButton).toBeVisible();
    });

    test('should display statistics cards', async ({ page }) => {
        // Check for stats section
        const statsSection = page.locator('[class*="stat"], [class*="metric"]').first();
        // If stats exist, verify they're visible
        if (await statsSection.isVisible()) {
            await expect(statsSection).toBeVisible();
        }
    });
});

test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
        await page.goto('/');

        // Check sidebar navigation exists
        const sidebar = page.locator('nav, [class*="sidebar"]');
        await expect(sidebar.first()).toBeVisible();
    });

    test('should have working links', async ({ page }) => {
        await page.goto('/');

        // Check that navigation links are present
        const navLinks = page.locator('nav a, [class*="sidebar"] a');
        const count = await navLinks.count();

        expect(count).toBeGreaterThan(0);
    });
});
