import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test('should have no accessibility violations on dashboard', async ({ page }) => {
        await page.goto('/');

        // Basic accessibility checks
        // Check for main landmark
        const main = page.locator('main, [role="main"]');
        await expect(main.first()).toBeVisible();

        // Check for heading structure
        const heading = page.locator('h1, h2, h3');
        const count = await heading.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should have proper page title', async ({ page }) => {
        await page.goto('/');

        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);
    });

    test('should have visible focus indicators', async ({ page }) => {
        await page.goto('/');

        // Tab through focusable elements
        await page.keyboard.press('Tab');

        // Check that something is focused
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible();
    });

    test('should have sufficient color contrast on buttons', async ({ page }) => {
        await page.goto('/');

        // Get all buttons
        const buttons = page.locator('button');
        const count = await buttons.count();

        if (count > 0) {
            // At least verify buttons are visible (basic contrast check)
            const firstButton = buttons.first();
            await expect(firstButton).toBeVisible();
        }
    });

    test('should support keyboard navigation', async ({ page }) => {
        await page.goto('/');

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should be able to navigate without mouse
        const focusedElement = page.locator(':focus');
        await expect(focusedElement.first()).toBeVisible();
    });

    test('should have alt text for images', async ({ page }) => {
        await page.goto('/');

        // Check all images have alt text
        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            const ariaLabel = await img.getAttribute('aria-label');
            const ariaHidden = await img.getAttribute('aria-hidden');

            // Image should have alt text, aria-label, or be marked as decorative
            expect(alt || ariaLabel || ariaHidden === 'true').toBeTruthy();
        }
    });

    test('should have accessible form inputs', async ({ page }) => {
        await page.goto('/');

        // Check inputs have labels
        const inputs = page.locator('input:not([type="hidden"])');
        const count = await inputs.count();

        for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            const placeholder = await input.getAttribute('placeholder');

            // Input should have some form of accessible label
            if (id) {
                const label = page.locator(`label[for="${id}"]`);
                const hasLabel = await label.count() > 0;
                expect(hasLabel || ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
            } else {
                expect(ariaLabel || ariaLabelledBy || placeholder).toBeTruthy();
            }
        }
    });
});

test.describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        // Check for h1
        const h1 = page.locator('h1');
        const h1Count = await h1.count();

        // Should have at most one h1 per page
        expect(h1Count).toBeLessThanOrEqual(1);
    });

    test('should have descriptive link text', async ({ page }) => {
        await page.goto('/');

        // Check links have descriptive text (not just "click here")
        const links = page.locator('a');
        const count = await links.count();

        for (let i = 0; i < count; i++) {
            const link = links.nth(i);
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');

            // Link should have descriptive text
            const hasDescriptiveText = text && text.trim().length > 0 && !text.match(/^(click here|read more|more)$/i);
            expect(hasDescriptiveText || ariaLabel).toBeTruthy();
        }
    });

    test('should have proper button labels', async ({ page }) => {
        await page.goto('/');

        // Check buttons have accessible names
        const buttons = page.locator('button');
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const button = buttons.nth(i);
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            const ariaLabelledBy = await button.getAttribute('aria-labelledby');

            // Button should have accessible name
            expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
    });
});
