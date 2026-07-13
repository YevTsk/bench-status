import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As a guest, I can only look at the board', () => {
    test('no add, edit or drag controls appear until GitHub is connected', async ({ boardPage, page }) => {
        await boardPage.goto();

        await expect(page.locator('.card-add')).toHaveCount(0);
        await expect(page.locator('.card-edit')).toHaveCount(0);
        await expect(boardPage.saveButton).toBeHidden();
        await expect(boardPage.tagsButton).toBeHidden();
        await expect(boardPage.cards.first()).toHaveAttribute('draggable', 'false');
    });

    test('the profile photo cannot be changed until GitHub is connected', async ({ boardPage }) => {
        await boardPage.goto();
        await expect(boardPage.avatarButton).not.toHaveClass(/editable/);
    });
});
