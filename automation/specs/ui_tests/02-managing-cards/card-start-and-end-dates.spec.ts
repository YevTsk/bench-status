import { test, expect } from '../../../fixtures/ui-fixtures';

test.describe('As the owner, I can set a start and end date on a card', () => {
    test('the End date field refuses anything earlier than Start date', async ({ boardPage, cardModal }) => {
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

    test('the Start date field refuses anything later than End date', async ({ boardPage, cardModal }) => {
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
