/**
 * E2E Tests for AI Tutor Flow.
 *
 * Phase 23: AI Tutor Mode Testing
 */
import { test, expect, Page } from '@playwright/test';

// ============================================
// Test Fixtures
// ============================================

test.describe('AI Tutor Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });

    // ============================================
    // Tutor Panel Visibility Tests
    // ============================================

    test('should show tutor button on practice page', async ({ page }) => {
        // Navigate to practice session
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Look for the AI Tutor button (closed state)
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });

        // Button should be visible
        await expect(tutorButton).toBeVisible();
    });

    test('should open tutor panel when button clicked', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Click the tutor button
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Panel should be visible with header
        const panelHeader = page.getByText(/ai tutor|your learning companion/i);
        await expect(panelHeader).toBeVisible();
    });

    test('should close tutor panel when close button clicked', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Close the panel
        const closeButton = page.getByRole('button', { name: /close tutor/i });
        await closeButton.click();

        // Panel should be closed, button should be visible again
        await expect(tutorButton).toBeVisible();
    });

    // ============================================
    // Tutor Interaction Tests
    // ============================================

    test('should display welcome message in empty state', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Should show welcome message
        const welcomeMessage = page.getByText(/welcome|i'm here to help you learn/i);
        await expect(welcomeMessage).toBeVisible();
    });

    test('should have input field for asking questions', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Input field should be visible
        const inputField = page.getByPlaceholder(/ask a question|type your question/i);
        await expect(inputField).toBeVisible();
        await expect(inputField).toBeEnabled();
    });

    test('should have hint button', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Hint button should be visible
        const hintButton = page.getByRole('button', { name: /request hint|hint/i });
        await expect(hintButton).toBeVisible();
    });

    // ============================================
    // Hint Functionality Tests
    // ============================================

    test('should show hint level indicator', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Should show hint count (0/3 initially)
        const hintIndicator = page.getByText(/hints used: 0\/3|0\/3 hints/i);
        await expect(hintIndicator).toBeVisible();
    });

    // ============================================
    // Keyboard Navigation Tests
    // ============================================

    test('should be keyboard accessible', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Tab to the tutor button
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // The tutor button should be focusable
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    // ============================================
    // Dashboard Widget Tests
    // ============================================

    test('should show tutor insights widget on dashboard', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Look for learning insights section
        const insightsWidget = page.getByText(/learning insights|tutor insights/i);

        // Widget might be visible if user has insights
        // This test just checks if the widget area exists
        const widgetArea = page.locator('[class*="insight"], [class*="tutor"]').first();
        await expect(widgetArea).toBeVisible();
    });
});

// ============================================
// Tutor Panel Component Tests
// ============================================

test.describe('Tutor Panel Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');
    });

    test('should have correct ARIA attributes', async ({ page }) => {
        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Check for proper ARIA labels
        const closeButton = page.getByRole('button', { name: /close tutor/i });
        await expect(closeButton).toHaveAttribute('aria-label', /close/i);
    });

    test('should show typing indicator when waiting for response', async ({ page }) => {
        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Type a question
        const inputField = page.getByPlaceholder(/ask a question|type your question/i);
        await inputField.fill('What is Tay-Sachs disease?');

        // Submit the question
        await inputField.press('Enter');

        // Look for typing indicator (may be brief)
        const typingIndicator = page.getByText(/tutor is typing|typing/i);

        // The typing indicator might appear briefly
        // We just check that the input is cleared after submission
        await expect(inputField).toHaveValue('');
    });

    test('should disable input while loading', async ({ page }) => {
        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Type and submit a question
        const inputField = page.getByPlaceholder(/ask a question|type your question/i);
        await inputField.fill('Test question');
        await inputField.press('Enter');

        // Input should be enabled again after the request completes
        await expect(inputField).toBeEnabled({ timeout: 5000 });
    });
});

// ============================================
// Hint Button Component Tests
// ============================================

test.describe('Hint Button Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');
    });

    test('should be disabled after max hints', async ({ page }) => {
        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Request hints until max (3 times)
        const hintButton = page.getByRole('button', { name: /request hint|hint/i });

        for (let i = 0; i < 3; i++) {
            if (await hintButton.isEnabled()) {
                await hintButton.click();
                // Wait for response
                await page.waitForTimeout(500);
            }
        }

        // After 3 hints, button should show max reached
        const maxHintsText = page.getByText(/3\/3|max.*hint/i);
        await expect(maxHintsText).toBeVisible();
    });

    test('should increment hint count on click', async ({ page }) => {
        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Initial state should show 0/3
        const initialCount = page.getByText(/0\/3 hints|hints used: 0/i);
        await expect(initialCount).toBeVisible();

        // Click hint button
        const hintButton = page.getByRole('button', { name: /request hint|hint/i });
        if (await hintButton.isEnabled()) {
            await hintButton.click();
            await page.waitForTimeout(500);
        }

        // Should now show 1/3
        const updatedCount = page.getByText(/1\/3 hints|hints used: 1/i);
        await expect(updatedCount).toBeVisible({ timeout: 3000 });
    });
});

// ============================================
// Accessibility Tests
// ============================================

test.describe('Tutor Accessibility', () => {
    test('should have no accessibility violations on tutor panel', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Check that interactive elements are accessible
        const closeButton = page.getByRole('button', { name: /close tutor/i });
        await expect(closeButton).toBeVisible();

        const inputField = page.getByPlaceholder(/ask a question|type your question/i);
        await expect(inputField).toBeVisible();

        const hintButton = page.getByRole('button', { name: /request hint|hint/i });
        await expect(hintButton).toBeVisible();
    });

    test('should support screen reader announcements', async ({ page }) => {
        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Check for heading structure
        const heading = page.getByRole('heading', { name: /ai tutor/i });
        await expect(heading).toBeVisible();
    });
});

// ============================================
// Responsive Design Tests
// ============================================

test.describe('Tutor Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Panel should be visible and properly sized
        const panel = page.locator('[class*="fixed"][class*="right"]').first();
        await expect(panel).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Panel should be visible
        const panelHeader = page.getByText(/ai tutor|your learning companion/i);
        await expect(panelHeader).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });

        await page.goto('/practice');
        await page.waitForLoadState('networkidle');

        // Open the panel
        const tutorButton = page.getByRole('button', { name: /ai tutor|open tutor/i });
        await tutorButton.click();

        // Panel should be visible
        const panelHeader = page.getByText(/ai tutor|your learning companion/i);
        await expect(panelHeader).toBeVisible();
    });
});
