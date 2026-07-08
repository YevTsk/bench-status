import { test, expect } from '../../fixtures/ui-fixtures';

test.describe('As a visitor I can view full card details', () => {
    test('shows description, dates and tags for the selected card', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c2');
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.title).toHaveText('Sample In Progress Card');
        await expect(cardDetailView.description).toHaveText('Doing something.');
        await expect(cardDetailView.dates).toContainText('Jan 1');
        await expect(cardDetailView.tags).toHaveText('Anthropic Academy');
    });

    test('shows a link to the certificate when the card has one', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c4');
        await expect(cardDetailView.link).toBeVisible();
        await expect(cardDetailView.link).toHaveAttribute('href', 'https://example.com/cert');
    });

    test('a guest cannot edit from the detail view', async ({ boardPage, cardDetailView }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.editButton).toBeHidden();
    });

    test('the owner can jump from the detail view straight into editing', async ({ boardPage, cardDetailView, cardModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openCardDetail('c1');
        await cardDetailView.edit();

        await expect(cardDetailView.overlay).toBeHidden();
        await expect(cardModal.overlay).toBeVisible();
        await expect(cardModal.title).toHaveText('Edit card');
        await expect(cardModal.titleInput).toHaveValue('Sample Todo Card');
    });

    test('Escape closes the detail view', async ({ boardPage, cardDetailView, page }) => {
        await boardPage.goto();

        await boardPage.openCardDetail('c1');
        await expect(cardDetailView.overlay).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(cardDetailView.overlay).toBeHidden();
    });
});
