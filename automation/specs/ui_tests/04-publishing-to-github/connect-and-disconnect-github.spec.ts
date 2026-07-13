import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As a visitor, I can connect and disconnect my GitHub account', () => {
    test('connecting GitHub reveals the add/edit buttons and Save', async ({ boardPage, tokenModal }) => {
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

    test('disconnecting GitHub hides them again', async ({ boardPage, tokenModal }) => {
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

    test('clicking Cancel closes the window without connecting', async ({ boardPage, tokenModal }) => {
        await boardPage.goto();

        await boardPage.githubIcon.click();
        await expect(tokenModal.overlay).toBeVisible();
        await tokenModal.input.fill('should-not-be-saved');
        await tokenModal.cancel();

        await expect(tokenModal.overlay).toBeHidden();
        await expect(boardPage.githubIcon).not.toHaveClass(/connected/);
        await expect(boardPage.addCardButton('todo')).toHaveCount(0);
    });

    test('clicking the × icon closes the window without connecting', async ({ boardPage, tokenModal }) => {
        await boardPage.goto();

        await boardPage.githubIcon.click();
        await expect(tokenModal.overlay).toBeVisible();
        await tokenModal.input.fill('should-not-be-saved-either');
        await tokenModal.closeWithIcon();

        await expect(tokenModal.overlay).toBeHidden();
        await expect(boardPage.githubIcon).not.toHaveClass(/connected/);
        await expect(boardPage.addCardButton('todo')).toHaveCount(0);
    });
});
