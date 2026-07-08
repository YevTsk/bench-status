import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a guest I can only view the board', () => {
    test('no editing controls are rendered without a GitHub token', async ({ boardPage, page }) => {
        await boardPage.goto();

        await expect(page.locator('.card-add')).toHaveCount(0);
        await expect(page.locator('.card-edit')).toHaveCount(0);
        await expect(boardPage.saveButton).toBeHidden();
        await expect(boardPage.cards.first()).toHaveAttribute('draggable', 'false');
    });

    test('the avatar is not editable without a token', async ({ boardPage }) => {
        await boardPage.goto();
        await expect(boardPage.avatarButton).not.toHaveClass(/editable/);
    });
});
