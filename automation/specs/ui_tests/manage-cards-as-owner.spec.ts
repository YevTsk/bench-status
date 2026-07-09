import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As the owner I can manage cards', () => {
    test('the "+" button only appears in the To Do column', async ({ boardPage }) => {
        await boardPage.goto({ owner: true });

        await expect(boardPage.addCardButton('todo')).toBeVisible();
        await expect(boardPage.addCardButton('progress')).toHaveCount(0);
    });

    test('adding a card places it in the chosen column and updates the counter', async ({ boardPage, cardModal, page }) => {
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

    test('deleting a card removes it and decrements the counter', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.delete();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('Sample Todo Card')).toHaveCount(0);
        await expect(boardPage.summaryCount('todo')).toHaveText('0');
    });

    test('a card with no title cannot be saved', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.save();

        await expect(cardModal.overlay, 'the modal should stay open when the title is empty').toBeVisible();
    });

    test('adding a custom tag makes it available and persists on the card', async ({ boardPage, cardModal, cardDetailView, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.fillTitle('Card with custom tag');
        await cardModal.addCustomTag('Side Project');
        await expect(cardModal.tagOption('Side Project')).toHaveClass(/selected/);

        await cardModal.save();
        await expect(cardModal.overlay).toBeHidden();

        await page.getByText('Card with custom tag').click();
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.tags).toContainText('Side Project');
    });

    test('Cancel closes the editor without saving changes', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('This should not be saved');
        await cardModal.cancel();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('This should not be saved')).toHaveCount(0);
        await expect(page.getByText('Sample Todo Card')).toBeVisible();
    });

    test('the × icon closes the editor without saving changes', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('This should not be saved either');
        await cardModal.closeWithIcon();

        await expect(cardModal.overlay).toBeHidden();
        await expect(page.getByText('This should not be saved either')).toHaveCount(0);
        await expect(page.getByText('Sample Todo Card')).toBeVisible();
    });

    test('the End date field cannot be set earlier than Start date', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.startInput.fill('2026-08-15');
        await expect(cardModal.endInput, 'End date should refuse anything before the chosen Start date').toHaveAttribute('min', '2026-08-15');
    });

    test('leaving Start date empty allows any End date', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await expect(cardModal.endInput).toHaveAttribute('min', '');
    });

    test('an End date before Start date blocks saving the card', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.fillTitle('Date range test card');
        await cardModal.startInput.fill('2026-08-15');
        await cardModal.endInput.fill('2026-08-10');
        await cardModal.save();

        await expect(cardModal.overlay, 'the browser should block submission when End is before Start').toBeVisible();
    });

    test('the Start date field cannot be set later than End date', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.endInput.fill('2026-08-15');
        await expect(cardModal.startInput, 'Start date should refuse anything after the chosen End date').toHaveAttribute('max', '2026-08-15');
    });

    test('leaving End date empty allows any Start date', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await expect(cardModal.startInput).toHaveAttribute('max', '');
    });

    test('a Start date after End date blocks saving the card', async ({ boardPage, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openAddCard('todo');
        await cardModal.fillTitle('Reverse date range test card');
        await cardModal.endInput.fill('2026-08-10');
        await cardModal.startInput.fill('2026-08-15');
        await cardModal.save();

        await expect(cardModal.overlay, 'the browser should block submission when Start is after End').toBeVisible();
    });
});
