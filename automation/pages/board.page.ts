import { Locator, Page } from '@playwright/test';
import { Card, DEFAULT_CARDS, mockBoardData, setOwnerToken } from '@utils/mock-data';

export type GotoOptions = {
    owner?: boolean;
    cards?: Card[];
};

export class BoardPage {
    readonly page: Page;
    readonly columns: Locator;
    readonly columnTitles: Locator;
    readonly cards: Locator;
    readonly themeToggle: Locator;
    readonly githubIcon: Locator;
    readonly tagsButton: Locator;
    readonly saveButton: Locator;
    readonly saveStatus: Locator;
    readonly avatarButton: Locator;
    readonly avatarImage: Locator;
    readonly avatarMono: Locator;
    readonly avatarInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.columns = this.page.locator('.board-column');
        this.columnTitles = this.page.locator('.board-column-title');
        this.cards = this.page.locator('.task-card');
        this.themeToggle = this.page.locator('#theme-toggle');
        this.githubIcon = this.page.locator('#token-btn');
        this.tagsButton = this.page.locator('#tags-btn');
        this.saveButton = this.page.locator('#save-btn');
        this.saveStatus = this.page.locator('#save-status');
        this.avatarButton = this.page.locator('#avatar-btn');
        this.avatarImage = this.page.locator('#avatar-img');
        this.avatarMono = this.page.locator('#avatar-mono');
        this.avatarInput = this.page.locator('#avatar-input');
    }

    async goto(options: GotoOptions = {}) {
        if (options.owner) await setOwnerToken(this.page);
        await mockBoardData(this.page, options.cards ?? DEFAULT_CARDS);
        await this.page.goto('/');
        await this.cards.first().waitFor({ state: 'visible' });
    }

    column(colId: 'todo' | 'progress' | 'hold' | 'done'): Locator {
        return this.page.locator(`.board-column[data-col="${colId}"]`);
    }

    addCardButton(colId: 'todo' | 'progress' | 'hold' | 'done'): Locator {
        return this.column(colId).locator('.card-add');
    }

    columnHeader(colId: 'todo' | 'progress' | 'hold' | 'done'): Locator {
        return this.column(colId).locator('.board-column-header');
    }

    summaryCount(colId: 'todo' | 'progress' | 'hold' | 'done'): Locator {
        return this.page.locator(`[data-count="${colId}"]`);
    }

    card(id: string): Locator {
        return this.page.locator(`.task-card[data-id="${id}"]`);
    }

    editButton(id: string): Locator {
        return this.card(id).locator('.card-edit');
    }

    async openAddCard(colId: 'todo' | 'progress' | 'hold' | 'done') {
        await this.addCardButton(colId).click();
    }

    async openEditCard(id: string) {
        await this.editButton(id).click();
    }

    async dragCardToColumn(id: string, colId: 'todo' | 'progress' | 'hold' | 'done') {
        await this.card(id).dragTo(this.page.locator(`.board-column-body[data-col="${colId}"]`));
    }

    async openCardDetail(id: string) {
        // Clicking a card opens its detail view, except when the click lands on the
        // linked title (that navigates to the certificate instead — see app.js), or
        // on the edit pencil (top-right, owner only). The bottom-left padding is
        // always empty regardless of card content, so it's a safe click target.
        const card = this.card(id);
        const box = await card.boundingBox();
        if (!box) throw new Error(`Card "${id}" is not visible`);
        await card.click({ position: { x: 10, y: box.height - 6 } });
    }
}
