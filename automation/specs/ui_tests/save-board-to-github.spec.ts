import { test, expect } from '../../fixtures/ui-fixtures';
import { mockGithubApi } from '../../utils/mock-data';

test.describe('As the owner I can publish the board to GitHub', () => {
    test('Save commits the current board and shows a success message', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });
        const { putRequests } = await mockGithubApi(page, { existingSha: 'existing-sha-123' });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('Updated via test');
        await cardModal.save();
        await expect(boardPage.saveButton).toBeEnabled();

        await boardPage.saveButton.click();

        await expect(boardPage.saveStatus).toHaveText(/Сохранено/);
        await expect(boardPage.saveButton).toBeDisabled();

        expect(putRequests).toHaveLength(1);
        expect(putRequests[0]).toMatchObject({ sha: 'existing-sha-123', branch: 'main' });
        expect(putRequests[0]).toHaveProperty('message');
        expect(putRequests[0]).toHaveProperty('content');
    });

    test('publishing for the first time omits sha when no file exists yet', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });
        const { putRequests } = await mockGithubApi(page); // no existingSha => GET returns 404

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('First publish');
        await cardModal.save();
        await boardPage.saveButton.click();

        await expect(boardPage.saveStatus).toHaveText(/Сохранено/);
        expect(putRequests[0]).not.toHaveProperty('sha');
    });

    test('a failed save shows an error and leaves the change unsaved', async ({ boardPage, cardModal, page }) => {
        await boardPage.goto({ owner: true });
        await mockGithubApi(page, { existingSha: 'sha-1', putStatus: 401, putErrorMessage: 'Bad credentials' });

        await boardPage.openEditCard('c1');
        await cardModal.fillTitle('Should fail to save');
        await cardModal.save();

        await boardPage.saveButton.click();

        await expect(boardPage.saveStatus).toHaveText(/Ошибка: Bad credentials/);
        await expect(boardPage.saveButton, 'the unsaved change should stay committable after a failed save').toBeEnabled();
    });
});
