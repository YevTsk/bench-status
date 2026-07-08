import { test as base, expect } from '@playwright/test';
import { BoardPage } from '../pages/board.page';
import { CardModal } from '../pages/card-modal.page';
import { CardDetailView } from '../pages/card-detail-view.page';

type UiFixtures = {
    boardPage: BoardPage;
    cardModal: CardModal;
    cardDetailView: CardDetailView;
};

export const test = base.extend<UiFixtures>({
    boardPage: async ({ page }, use) => {
        await use(new BoardPage(page));
    },
    cardModal: async ({ page }, use) => {
        await use(new CardModal(page));
    },
    cardDetailView: async ({ page }, use) => {
        await use(new CardDetailView(page));
    },
});

export { expect };
