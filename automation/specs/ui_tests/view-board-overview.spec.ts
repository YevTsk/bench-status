import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a visitor I can see an overview of the board', () => {
    test('the board renders all four columns with their cards', async ({ boardPage, page }) => {
        await boardPage.goto();

        await expect(boardPage.columns).toHaveCount(4);
        await expect(boardPage.columnTitles).toHaveText(['To Do', 'In Progress', 'On Hold', 'Done']);
        await expect(page.getByText('Sample Todo Card')).toBeVisible();
        await expect(page.getByText('Sample Done Card')).toBeVisible();
    });

    test('the summary chips reflect the card counts', async ({ boardPage }) => {
        await boardPage.goto();

        await expect(boardPage.summaryCount('todo')).toHaveText('1');
        await expect(boardPage.summaryCount('progress')).toHaveText('1');
        await expect(boardPage.summaryCount('hold')).toHaveText('1');
        await expect(boardPage.summaryCount('done')).toHaveText('1');
    });
});
