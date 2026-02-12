import { Page, Locator, expect } from '@playwright/test';

/**
 * Base page object with common functionality
 */
export abstract class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string) {
        await this.page.goto(path);
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    async takeScreenshot(name: string) {
        await this.page.screenshot({ path: `screenshots/${name}.png` });
    }
}

/**
 * Dashboard page object
 */
export class DashboardPage extends BasePage {
    readonly startPracticeButton: Locator;
    readonly viewHistoryButton: Locator;
    readonly statsCards: Locator;
    readonly recentSessions: Locator;
    readonly sidebar: Locator;

    constructor(page: Page) {
        super(page);
        this.startPracticeButton = page.getByRole('button', { name: /start|practice|begin/i });
        this.viewHistoryButton = page.getByRole('link', { name: /history/i });
        this.statsCards = page.locator('[class*="stat"], [class*="card"]');
        this.recentSessions = page.locator('[class*="recent"], [class*="session"]');
        this.sidebar = page.locator('aside');
    }

    async goto() {
        await super.goto('/');
        await this.waitForPageLoad();
    }

    async startPractice() {
        await this.startPracticeButton.click();
    }

    async navigateToHistory() {
        await this.viewHistoryButton.click();
    }

    async expectStatsVisible() {
        await expect(this.statsCards.first()).toBeVisible();
    }
}

/**
 * Practice session page object
 */
export class PracticeSessionPage extends BasePage {
    readonly questionStem: Locator;
    readonly optionButtons: Locator;
    readonly nextButton: Locator;
    readonly previousButton: Locator;
    readonly submitButton: Locator;
    readonly progressBar: Locator;
    readonly questionNumber: Locator;
    readonly timer: Locator;
    readonly reasoningTabs: Locator;

    constructor(page: Page) {
        super(page);
        this.questionStem = page.locator('[class*="prose"], [class*="stem"]').first();
        this.optionButtons = page.locator('button').filter({ hasText: /^[A-E]\./ });
        this.nextButton = page.getByRole('button', { name: /next/i });
        this.previousButton = page.getByRole('button', { name: /previous/i });
        this.submitButton = page.getByRole('button', { name: /submit|complete/i });
        this.progressBar = page.locator('[class*="progress"]').first();
        this.questionNumber = page.locator('text=/Question \\d+/i');
        this.timer = page.locator('[class*="timer"], [class*="time"]');
        this.reasoningTabs = page.locator('[role="tab"]');
    }

    async goto() {
        await super.goto('/practice');
        await this.waitForPageLoad();
    }

    async selectOption(option: 'A' | 'B' | 'C' | 'D' | 'E') {
        const optionButton = this.page.locator(`button:has-text("${option}.")`).first();
        await optionButton.click();
    }

    async selectOptionByKeyboard(option: string) {
        await this.page.keyboard.press(option);
    }

    async goToNext() {
        await this.nextButton.click();
    }

    async goToPrevious() {
        await this.previousButton.click();
    }

    async submitSession() {
        await this.submitButton.click();
    }

    async expectQuestionVisible() {
        await expect(this.questionStem).toBeVisible();
    }

    async expectOptionSelected(option: 'A' | 'B' | 'C' | 'D' | 'E') {
        const optionButton = this.page.locator(`button:has-text("${option}.")`).first();
        await expect(optionButton).toHaveAttribute('class', /selected|active|primary/);
    }

    async getProgressPercentage(): Promise<number> {
        const progressText = await this.progressBar.textContent();
        if (!progressText) return 0;
        const match = progressText.match(/(\d+)%/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async switchReasoningTab(tab: 'Association' | 'Hypothesis' | 'Constraints' | 'Arguments') {
        const tabButton = this.page.getByRole('tab', { name: new RegExp(tab, 'i') });
        await tabButton.click();
    }
}

/**
 * Session review page object
 */
export class SessionReviewPage extends BasePage {
    readonly summaryCard: Locator;
    readonly questionReviews: Locator;
    readonly correctCount: Locator;
    readonly totalTime: Locator;
    readonly backButton: Locator;

    constructor(page: Page) {
        super(page);
        this.summaryCard = page.locator('[class*="summary"], [class*="overview"]').first();
        this.questionReviews = page.locator('[class*="review"], [class*="question-item"]');
        this.correctCount = page.locator('text=/\\d+\\/\\d+|\\d+% correct/i');
        this.totalTime = page.locator('text=/\\d+:\\d+|\\d+ min/i');
        this.backButton = page.getByRole('button', { name: /back|dashboard/i });
    }

    async goto(sessionId: string) {
        await super.goto(`/review/${sessionId}`);
        await this.waitForPageLoad();
    }

    async expectSummaryVisible() {
        await expect(this.summaryCard).toBeVisible();
    }

    async getCorrectCount(): Promise<string> {
        return await this.correctCount.textContent() || '';
    }

    async goToDashboard() {
        await this.backButton.click();
    }
}

/**
 * History page object
 */
export class HistoryPage extends BasePage {
    readonly sessionList: Locator;
    readonly filterDropdown: Locator;
    readonly paginationControls: Locator;

    constructor(page: Page) {
        super(page);
        this.sessionList = page.locator('[class*="session-list"], [class*="history-item"]');
        this.filterDropdown = page.locator('select, [class*="filter"]');
        this.paginationControls = page.locator('[class*="pagination"]');
    }

    async goto() {
        await super.goto('/history');
        await this.waitForPageLoad();
    }

    async expectSessionsVisible() {
        await expect(this.sessionList.first()).toBeVisible();
    }

    async clickSession(index: number) {
        const sessions = await this.sessionList.all();
        if (sessions[index]) {
            await sessions[index].click();
        }
    }
}

/**
 * Settings page object
 */
export class SettingsPage extends BasePage {
    readonly themeToggle: Locator;
    readonly difficultySelect: Locator;
    readonly saveButton: Locator;

    constructor(page: Page) {
        super(page);
        this.themeToggle = page.locator('[class*="theme"], [aria-label*="theme"]');
        this.difficultySelect = page.locator('select[name*="difficulty"], [class*="difficulty"]');
        this.saveButton = page.getByRole('button', { name: /save/i });
    }

    async goto() {
        await super.goto('/settings');
        await this.waitForPageLoad();
    }

    async toggleTheme() {
        await this.themeToggle.click();
    }
}
