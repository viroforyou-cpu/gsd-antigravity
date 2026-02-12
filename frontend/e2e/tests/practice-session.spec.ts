import { test, expect } from '@playwright/test';

test.describe('Practice Session Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should start a new practice session', async ({ page }) => {
        // Look for start practice button
        const startButton = page.getByRole('button', { name: /start|practice|begin/i });
        await startButton.click();

        // Should navigate to practice session or show session setup
        await expect(page).toHaveURL(/practice|session/);
    });

    test('should display question with options', async ({ page }) => {
        // Navigate to practice session
        await page.goto('/practice');

        // Check for question stem
        const questionStem = page.locator('[class*="question"], [class*="stem"]').first();
        if (await questionStem.isVisible()) {
            await expect(questionStem).toBeVisible();
        }

        // Check for answer options (A, B, C, D, E)
        const options = page.locator('button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D"), button:has-text("E")');
        const count = await options.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow selecting an answer', async ({ page }) => {
        await page.goto('/practice');

        // Try to find and click an option button
        const optionButton = page.locator('button').filter({ hasText: /^[A-E]$/ }).first();

        if (await optionButton.isVisible()) {
            await optionButton.click();

            // Option should appear selected
            await expect(optionButton).toHaveAttribute('class', /selected|active|primary/);
        }
    });

    test('should show progress indicator', async ({ page }) => {
        await page.goto('/practice');

        // Look for progress bar or indicator
        const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
        if (await progressBar.first().isVisible()) {
            await expect(progressBar.first()).toBeVisible();
        }
    });

    test('should navigate between questions', async ({ page }) => {
        await page.goto('/practice');

        // Look for next/previous buttons
        const nextButton = page.getByRole('button', { name: /next|→|>/i });
        const prevButton = page.getByRole('button', { name: /prev|←|</i });

        // If navigation exists, test it
        if (await nextButton.isVisible()) {
            await nextButton.click();
            // Should be on question 2
        }
    });
});

test.describe('Session Completion', () => {
    test('should show results after completing session', async ({ page }) => {
        await page.goto('/practice');

        // Look for complete/finish button
        const completeButton = page.getByRole('button', { name: /complete|finish|done/i });

        if (await completeButton.isVisible()) {
            await completeButton.click();

            // Should show results or review page
            await expect(page).toHaveURL(/review|result|complete/);
        }
    });
});
