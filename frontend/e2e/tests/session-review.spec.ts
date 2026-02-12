import { test, expect, mockApiRoute } from '../fixtures';

test.describe('Session Review Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the session review API
        await mockApiRoute(page, 'sessions/test-session/review', {
            session: {
                id: 'test-session',
                questions: [
                    {
                        id: 'q1',
                        stem: 'Test question stem',
                        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
                        correct_answer: 'B',
                        difficulty: 'medium',
                        category: 'Test Category',
                    },
                ],
                answers: { q1: 'B' },
                started_at: '2024-01-15T10:00:00Z',
                completed_at: '2024-01-15T10:15:00Z',
            },
            questions: [
                {
                    question: {
                        id: 'q1',
                        stem: 'Test question stem',
                        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
                        correct_answer: 'B',
                        difficulty: 'medium',
                        category: 'Test Category',
                    },
                    user_answer: 'B',
                    is_correct: true,
                    reasoning: null,
                },
            ],
            summary: {
                total_questions: 1,
                correct_answers: 1,
                time_spent_seconds: 900,
            },
        });
    });

    test('should display session review summary', async ({ page, reviewPage }) => {
        await reviewPage.goto('test-session');

        // Check summary is visible
        await reviewPage.expectSummaryVisible();

        // Check correct count is shown
        const correctCount = await reviewPage.getCorrectCount();
        expect(correctCount).toBeTruthy();
    });

    test('should show question review items', async ({ page, reviewPage }) => {
        await reviewPage.goto('test-session');

        // Should have question review items
        const reviewItems = await reviewPage.questionReviews.all();
        expect(reviewItems.length).toBeGreaterThan(0);
    });

    test('should navigate back to dashboard', async ({ page, reviewPage }) => {
        await reviewPage.goto('test-session');

        await reviewPage.goToDashboard();

        // Should be on dashboard
        await expect(page).toHaveURL('/');
    });

    test('should show correct/incorrect indicators', async ({ page }) => {
        await page.goto('/review/test-session');

        // Look for correct/incorrect indicators
        const correctIndicator = page.locator('[class*="correct"], [class*="green"]');
        const incorrectIndicator = page.locator('[class*="incorrect"], [class*="red"]');

        // At least one should be visible
        const hasCorrect = await correctIndicator.count() > 0;
        const hasIncorrect = await incorrectIndicator.count() > 0;

        expect(hasCorrect || hasIncorrect).toBe(true);
    });
});
