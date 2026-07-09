import { test, expect } from '../../../fixtures/ui-fixtures';

test.describe('As the owner, I can label a card with tags', () => {
    test('typing a new tag adds it to the card and it is still there afterwards', async ({ boardPage, cardModal, cardDetailView, page }) => {
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
});
