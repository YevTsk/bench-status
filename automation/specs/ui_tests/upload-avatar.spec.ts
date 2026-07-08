import path from 'path';
import { test, expect } from '../../fixtures/ui-fixtures';

const TEST_IMAGE = path.join(__dirname, '..', '..', 'fixtures', 'files', 'test-avatar.png');

test.describe('As the owner I can upload a profile avatar', () => {
    test('uploading an image replaces the monogram with the photo', async ({ boardPage }) => {
        await boardPage.goto({ owner: true });

        await expect(boardPage.avatarMono).toBeVisible();
        await expect(boardPage.avatarImage).toBeHidden();

        // the visible avatar button just opens this hidden file input on click
        await boardPage.avatarInput.setInputFiles(TEST_IMAGE);

        await expect(boardPage.avatarImage).toBeVisible();
        await expect(boardPage.avatarMono).toBeHidden();

        const src = await boardPage.avatarImage.getAttribute('src');
        expect(src, 'the uploaded image should be re-encoded to a JPEG data URL by the canvas resize step').toMatch(/^data:image\/jpeg;base64,/);
    });
});
