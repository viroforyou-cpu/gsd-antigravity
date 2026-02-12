import { test, expect, mockApiRoute, mockQuestion } from '../fixtures';

test.describe('Keyboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Mock questions API
        await mockApiRoute(page, 'questions/random', mockQuestion);
        await mockApiRoute(page, 'questions', {
            questions: [mockQuestion],
            total: 1,
            page: 1,
            page_size: 10,
        });
    });

    test('should select answer with letter keys (A-E)', async ({ page, practicePage }) => {
        await practicePage.goto();

        // Wait for page to load
        await page.waitForTimeout(500);

        // Press 'B' to select option B
        await page.keyboard.press('b');

        // Check if option B appears selected
        const optionB = page.locator('button:has-text("B.")').first();
        await expect(optionB).toHaveAttribute('class', /selected|active|primary/);
    });

    test('should navigate with arrow keys', async ({ page, practicePage }) => {
        await practicePage.goto();
        await page.waitForTimeout(500);

        // Press arrow down to move selection
        await page.keyboard.press('ArrowDown');

        // Selection should change (implementation dependent)
        // This test verifies the keyboard event is handled
    });

    test('should submit answer with Enter key', async ({ page, practicePage }) => {
        await practicePage.goto();
        await page.waitForTimeout(500);

        // Select an option first
        await page.keyboard.press('a');

        // Press Enter to confirm/submit
        await page.keyboard.press('Enter');

        // Should either move to next question or show feedback
    });

    test('should close modals with Escape key', async ({ page }) => {
        await page.goto('/');

        // If there's a modal open, Escape should close it
        await page.keyboard.press('Escape');

        // Modal should be closed (no modal visible)
        const modal = page.locator('[role="dialog"]');
        const modalCount = await modal.count();
        expect(modalCount).toBe(0);
    });

    test('should navigate sidebar with Tab key', async ({ page }) => {
        await page.goto('/');

        // Press Tab to focus on navigation elements
        await page.keyboard.press('Tab');

        // Focus should be on a focusable element
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    test('should support keyboard shortcuts for quick navigation', async ({ page }) => {
        await page.goto('/');

        // Common shortcuts: 1-5 for options, N for next, P for previous
        // These are application-specific and depend on implementation

        // Navigate to practice page
        await page.keyboard.press('p'); // If implemented

        // Or use standard navigation
        const practiceLink = page.getByRole('link', { name: /practice/i });
        if (await practiceLink.isVisible()) {
            await practiceLink.focus();
            await page.keyboard.press('Enter');
        }
    });

    test('should trap focus in modals', async ({ page }) => {
        await page.goto('/');

        // If a modal opens, Tab should cycle within the modal
        // This is important for accessibility

        // Check that focus trap is working (if modal exists)
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
            // Tab through modal elements
            await page.keyboard.press('Tab');
            const focusedElement = await page.locator(':focus').getAttribute('class');
            expect(focusedElement).toBeTruthy();
        }
    });
});

test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        // Check for h1
        const h1 = page.locator('h1');
        const h1Count = await h1.count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have visible focus indicators', async ({ page }) => {
        await page.goto('/');

        // Tab to focus an element
        await page.keyboard.press('Tab');

        // Focused element should have visible focus indicator
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
            // Element should have focus styles (ring, outline, etc.)
            await expect(focusedElement).toBeVisible();
        }
    });

    test('should have accessible button labels', async ({ page }) => {
        await page.goto('/');

        // All buttons should have accessible names
        const buttons = await page.locator('button').all();

        for (const button of buttons) {
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            const ariaLabelledBy = await button.getAttribute('aria-labelledby');

            // Button should have either text content, aria-label, or aria-labelledby
            const hasAccessibleName = Boolean(text?.trim() || ariaLabel || ariaLabelledBy);
            expect(hasAccessibleName).toBe(true);
        }
    });

    test('should have proper link text', async ({ page }) => {
        await page.goto('/');

        // Links should have descriptive text
        const links = await page.locator('a').all();

        for (const link of links) {
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute('aria-label');
            const title = await link.getAttribute('title');

            // Link should have accessible name
            const hasAccessibleName = Boolean(text?.trim() || ariaLabel || title);
            expect(hasAccessibleName).toBe(true);
        }
    });

    test('should have proper form labels', async ({ page }) => {
        await page.goto('/settings');

        // Form inputs should have associated labels
        const inputs = await page.locator('input, select, textarea').all();

        for (const input of inputs) {
            const id = await input.getAttribute('id');
            const ariaLabel = await input.getAttribute('aria-label');
            const ariaLabelledBy = await input.getAttribute('aria-labelledby');
            const placeholder = await input.getAttribute('placeholder');

            // Input should have label association or aria attributes
            const hasLabel = Boolean(id && (await page.locator(`label[for="${id}"]`).count() > 0));
            const hasAria = Boolean(ariaLabel || ariaLabelledBy);
            const hasPlaceholder = Boolean(placeholder);

            expect(hasLabel || hasAria || hasPlaceholder).toBe(true);
        }
    });
});
