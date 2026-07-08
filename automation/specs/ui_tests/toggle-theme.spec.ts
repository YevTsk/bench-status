import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a visitor I can switch between light and dark theme', () => {
    test('clicking the toggle switches theme and persists the choice across a reload', async ({ boardPage }) => {
        await boardPage.goto();
        const html = boardPage.page.locator('html');

        await boardPage.themeToggle.click();
        const firstTheme = await html.getAttribute('data-theme');
        expect(['light', 'dark'], 'theme should switch to an explicit light/dark value').toContain(firstTheme);

        const stored = await boardPage.page.evaluate(() => window.localStorage.getItem('theme'));
        expect(stored).toBe(firstTheme);

        await boardPage.page.reload();
        await expect(html).toHaveAttribute('data-theme', firstTheme as string);
    });
});
