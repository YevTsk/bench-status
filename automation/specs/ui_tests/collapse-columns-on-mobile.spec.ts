import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a mobile visitor I can collapse and expand columns', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('the Done column starts collapsed while others are expanded', async ({ boardPage }) => {
        await boardPage.goto();

        await expect(boardPage.column('done')).toHaveClass(/collapsed/);
        await expect(boardPage.column('todo')).not.toHaveClass(/collapsed/);
    });

    test('tapping a column header toggles it collapsed and expanded again', async ({ boardPage }) => {
        await boardPage.goto();

        await boardPage.columnHeader('todo').click();
        await expect(boardPage.column('todo')).toHaveClass(/collapsed/);

        await boardPage.columnHeader('todo').click();
        await expect(boardPage.column('todo')).not.toHaveClass(/collapsed/);
    });

    test('tapping the Done header expands it', async ({ boardPage }) => {
        await boardPage.goto();
        await expect(boardPage.column('done')).toHaveClass(/collapsed/);

        await boardPage.columnHeader('done').click();
        await expect(boardPage.column('done')).not.toHaveClass(/collapsed/);
    });
});
