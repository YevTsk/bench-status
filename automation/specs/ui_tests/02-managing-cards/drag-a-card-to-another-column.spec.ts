import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As the owner, I can drag a card into a different column', () => {
    test('dragging a card moves it and updates both counts', async ({ boardPage }) => {
        await boardPage.goto({ owner: true });

        await boardPage.dragCardToColumn('c1', 'hold');

        await expect(boardPage.column('hold').locator('.task-card[data-id="c1"]')).toBeVisible();
        await expect(boardPage.column('todo').locator('.task-card[data-id="c1"]')).toHaveCount(0);
        await expect(boardPage.summaryCount('todo')).toHaveText('0');
        await expect(boardPage.summaryCount('hold')).toHaveText('2');
    });
});
