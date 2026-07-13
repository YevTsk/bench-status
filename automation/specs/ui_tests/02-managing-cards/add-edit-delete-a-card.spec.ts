import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As the owner, I can add, edit and delete cards', () => {
    test('the "+" button only appears in the To Do column', async ({ boardPage }) => {
        await boardPage.goto({ owner: true });

        await expect(boardPage.addCardButton('todo')).toBeVisible();
        await expect(boardPage.addCardButton('progress')).toHaveCount(0);
    });

    test('adding a card places it in the chosen column and updates the count', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await expect(cardModal.overlay).toBeVisible();

        await cardModal.fillTitle('New Test Card');
        await cardModal.save();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('New Test Card')).toBeVisible();
        await expect(boardPage.summaryCount('todo')).toHaveText('2');
    });

    test('editing a card updates its title', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await expect(cardModal.title).toHaveText('Edit card');
        await expect(cardModal.titleInput).toHaveValue('Sample Todo Card');

        await cardModal.fillTitle('Updated Todo Card');
        await cardModal.save();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('Updated Todo Card')).toBeVisible();
        await expect(page.getByText('Sample Todo Card')).toHaveCount(0);
    });

    test('deleting a card removes it from the board and updates the count', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.delete();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('Sample Todo Card')).toHaveCount(0);
        await expect(boardPage.summaryCount('todo')).toHaveText('0');
    });

    test('a card cannot be saved without a title', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.save();

        await expect(cardModal.overlay, 'the editor should stay open when the title is empty').toBeVisible();
    });

    test('clicking Cancel closes the editor without saving changes', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('This should not be saved');
        await cardModal.cancel();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('This should not be saved')).toHaveCount(0);
        await expect(page.getByText('Sample Todo Card')).toBeVisible();
    });

    test('clicking the × icon closes the editor without saving changes', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('This should not be saved either');
        await cardModal.closeWithIcon();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('This should not be saved either')).toHaveCount(0);
        await expect(page.getByText('Sample Todo Card')).toBeVisible();
    });
});
