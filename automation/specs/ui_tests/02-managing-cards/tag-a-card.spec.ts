import { test, expect } from '@fixtures/ui-fixtures';

test.describe('As the owner, I can label a card with tags', () => {
    test('adding a tag via Manage Tags makes it available when editing a card', async ({ boardPage, tagsModal, cardModal, cardDetailView, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.tagsButton.click();
        await expect(tagsModal.overlay).toBeVisible();
        await tagsModal.addTag('Side Project');
        await expect(tagsModal.row('Side Project')).toBeVisible();
        await tagsModal.close();

        await boardPage.openEditCard('c1');
        await cardModal.toggleTag('Side Project');
        await expect(cardModal.tagOption('Side Project')).toHaveClass(/selected/);
        await cardModal.save();
        await expect(cardModal.overlay).toBeHidden();

        await page.getByText('Sample Todo Card').click();
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.tags.filter({ hasText: 'Side Project' })).toBeVisible();
    });

    test('renaming a tag updates it in the palette and on every card that had it', async ({ boardPage, tagsModal, cardDetailView, page }) => {
        // c1 (Sample Todo Card) starts with the "AI Tooling" tag, see utils/mock-data.ts
        await boardPage.goto({ owner: true });

        await boardPage.tagsButton.click();
        await tagsModal.renameTag('AI Tooling', 'AI Tools');
        await expect(tagsModal.row('AI Tools')).toBeVisible();
        await expect(tagsModal.row('AI Tooling')).toHaveCount(0);
        await tagsModal.close();

        await page.getByText('Sample Todo Card').click();
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.tags).toContainText('AI Tools');
    });

    test('renaming a tag to one that already exists is rejected', async ({ boardPage, tagsModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.tagsButton.click();
        await tagsModal.renameTag('AI Tooling', 'Anthropic Academy');

        await expect(tagsModal.row('AI Tooling'), 'the rename should be rejected, both tags should still exist').toBeVisible();
        await expect(tagsModal.rowInput('AI Tooling')).toHaveValue('AI Tooling');
    });

    test('deleting a tag removes it from the palette and from every card that had it', async ({ boardPage, tagsModal, cardDetailView, page }) => {
        // c2 (Sample In Progress Card) has only the "Anthropic Academy" tag
        await boardPage.goto({ owner: true });

        await boardPage.tagsButton.click();
        await tagsModal.deleteTag('Anthropic Academy');
        await expect(tagsModal.row('Anthropic Academy')).toHaveCount(0);
        await tagsModal.close();

        await page.getByText('Sample In Progress Card').click();
        await expect(cardDetailView.overlay).toBeVisible();
        await expect(cardDetailView.tags, 'the card had no other tags left after the deleted one').toHaveCount(0);
    });

    test('clicking the × icon closes the tags window', async ({ boardPage, tagsModal }) => {
        await boardPage.goto({ owner: true });

        await boardPage.tagsButton.click();
        await expect(tagsModal.overlay).toBeVisible();
        await tagsModal.closeWithIcon();

        await expect(tagsModal.overlay).toBeHidden();
    });

    test('the card editor only lets you toggle tags, not add, rename or delete them', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });

        await boardPage.openEditCard('c1');
        await expect(page.locator('#new-tag-input')).toHaveCount(0);
        await expect(page.locator('#add-tag-btn')).toHaveCount(0);
        await expect(page.locator('.tag-row-delete')).toHaveCount(0);
        await expect(cardModal.tagOption('AI Tooling')).toBeVisible();
    });
});
