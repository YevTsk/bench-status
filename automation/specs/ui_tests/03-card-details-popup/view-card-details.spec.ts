import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As a visitor, clicking a card opens a popup with its full details', () => {
    test('the popup shows description, dates and tags for the selected card', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c2');
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.title).toHaveText('Sample In Progress Card');
        await expect(cardDetailView.description).toHaveText('Doing something.');
        await expect(cardDetailView.dates).toContainText('Jan 1');
        await expect(cardDetailView.tags).toHaveText('Anthropic Academy');
    });

    test('the popup shows a link to the certificate when the card has one', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c4');
        await expect(cardDetailView.link).toBeVisible();
        await expect(cardDetailView.link).toHaveAttribute('href', 'https://example.com/cert');
    });

    test('a guest does not see an Edit button in the popup', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.editButton).toBeHidden();
    });

    test('the owner can click Edit to open the card editor directly', async ({ boardPage, cardDetailView, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openCardDetail('c1');
        await cardDetailView.edit();

        await expect(cardDetailView.overlay).toBeHidden();
        await expect(cardModal.overlay).toBeVisible();
        await expect(cardModal.title).toHaveText('Edit card');
        await expect(cardModal.titleInput).toHaveValue('Sample Todo Card');
    });

    test('pressing Escape closes the popup', async ({ boardPage, cardDetailView, page }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.overlay).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(cardDetailView.overlay).toBeHidden();
    });

    test('clicking Close closes the popup', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.overlay).toBeVisible();
        await cardDetailView.close();
        await expect(cardDetailView.overlay).toBeHidden();
    });

    test('clicking the × icon closes the popup', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.overlay).toBeVisible();
        await cardDetailView.closeWithIcon();
        await expect(cardDetailView.overlay).toBeHidden();
    });
});
