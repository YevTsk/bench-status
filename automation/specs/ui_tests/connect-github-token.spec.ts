import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a visitor I can connect and disconnect a GitHub token', () => {
    test('connecting a token unlocks the owner UI', async ({ boardPage, tokenModal }) => {
        await boardPage.goto();
        await expect(boardPage.saveButton).toBeHidden();
        await expect(boardPage.githubIcon).not.toHaveClass(/connected/);

        await boardPage.githubIcon.click();
        await expect(tokenModal.overlay).toBeVisible();

        await tokenModal.connect('dummy-token-for-testing');

        await expect(tokenModal.overlay).toBeHidden();
        await expect(boardPage.githubIcon).toHaveClass(/connected/);
        await expect(boardPage.addCardButton('todo')).toBeVisible();
    });

    test('removing the token locks the UI again', async ({ boardPage, tokenModal }) => {
        await boardPage.goto({ owner: true });
        await expect(boardPage.addCardButton('todo')).toBeVisible();

        await boardPage.githubIcon.click();
        await expect(tokenModal.overlay).toBeVisible();
        await expect(tokenModal.removeButton).toBeVisible();

        await tokenModal.remove();

        await expect(tokenModal.overlay).toBeHidden();
        await expect(boardPage.addCardButton('todo')).toHaveCount(0);
        await expect(boardPage.githubIcon).not.toHaveClass(/connected/);
    });
});
