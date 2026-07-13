import { expect } from '@playwright/test';
import { test as coverageTest } from '@coverage/coverage-fixture';
import { BoardPage } from '@pages/board.page';
import { CardModal } from '@pages/card-modal.page';
import { CardDetailView } from '@pages/card-detail-view.page';
import { TokenModal } from '@pages/token-modal.page';

type UiFixtures = {
    boardPage: BoardPage;
    cardModal: CardModal;
    cardDetailView: CardDetailView;
    tokenModal: TokenModal;
};

// Extends the coverage-instrumented `test` (see coverage/coverage-fixture.ts) with
// page-object injection, so every spec gets both automatically.
export const test = coverageTest.extend<UiFixtures>({
    boardPage: async ({ page }, use) => {
        await use(new BoardPage(page));
    },
    cardModal: async ({ page }, use) => {
        await use(new CardModal(page));
    },
    cardDetailView: async ({ page }, use) => {
        await use(new CardDetailView(page));
    },
    tokenModal: async ({ page }, use) => {
        await use(new TokenModal(page));
    },
});

export { expect };
