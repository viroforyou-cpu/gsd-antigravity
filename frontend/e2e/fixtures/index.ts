import { test as base, Page } from '@playwright/test';
import {
    DashboardPage,
    PracticeSessionPage,
    SessionReviewPage,
    HistoryPage,
    SettingsPage,
} from '../pages/BasePage';

// Define page objects as fixtures
type MyFixtures = {
    dashboardPage: DashboardPage;
    practicePage: PracticeSessionPage;
    reviewPage: SessionReviewPage;
    historyPage: HistoryPage;
    settingsPage: SettingsPage;
};

// Extend base test with page objects
export const test = base.extend<MyFixtures>({
    dashboardPage: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        await use(dashboardPage);
    },
    practicePage: async ({ page }, use) => {
        const practicePage = new PracticeSessionPage(page);
        await use(practicePage);
    },
    reviewPage: async ({ page }, use) => {
        const reviewPage = new SessionReviewPage(page);
        await use(reviewPage);
    },
    historyPage: async ({ page }, use) => {
        const historyPage = new HistoryPage(page);
        await use(historyPage);
    },
    settingsPage: async ({ page }, use) => {
        const settingsPage = new SettingsPage(page);
        await use(settingsPage);
    },
});

export { expect } from '@playwright/test';

// Test data fixtures
export const mockQuestion = {
    id: 'test-q1',
    stem: 'A 4-month-old infant presents with failure to thrive and developmental regression.',
    options: {
        A: 'Niemann-Pick disease type A',
        B: 'Tay-Sachs disease',
        C: 'Gaucher disease type 1',
        D: 'Fabry disease',
        E: 'Krabbe disease',
    },
    correct_answer: 'B',
    difficulty: 'medium',
    category: 'Lysosomal Storage Disorders',
};

export const mockSession = {
    id: 'test-session-1',
    questions: [mockQuestion],
    answers: { 'test-q1': 'B' },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
};

// Helper to wait for API responses
export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
    return page.waitForResponse((response) =>
        typeof urlPattern === 'string'
            ? response.url().includes(urlPattern)
            : urlPattern.test(response.url())
    );
}

// Helper to mock API responses
export async function mockApiRoute(page: Page, path: string, response: unknown) {
    await page.route(`**/api/v1/${path}`, (route) => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
}
