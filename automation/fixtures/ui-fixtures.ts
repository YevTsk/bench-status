import { test as base, expect } from '@playwright/test';
import { BoardPage } from '../pages/board.page';
import { CardModal } from '../pages/card-modal.page';
import { CardDetailView } from '../pages/card-detail-view.page';
import { TokenModal } from '../pages/token-modal.page';

type UiFixtures = {
    boardPage: BoardPage;
    cardModal: CardModal;
    cardDetailView: CardDetailView;
    tokenModal: TokenModal;
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
    tokenModal: async ({ page }, use) => {
        await use(new TokenModal(page));
    },
});

export { expect };
