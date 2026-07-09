import { Locator, Page } from '@playwright/test';

export class CardDetailView {
    readonly page: Page;
    readonly overlay: Locator;
    readonly title: Locator;
    readonly description: Locator;
    readonly dates: Locator;
    readonly tags: Locator;
    readonly link: Locator;
    readonly editButton: Locator;
    readonly closeButton: Locator;
    readonly closeIcon: Locator;

    constructor(page: Page) {
        this.page = page;
        this.overlay = this.page.locator('#view-overlay');
        this.title = this.page.locator('#view-title');
        this.description = this.page.locator('.view-desc');
        this.dates = this.page.locator('.view-dates');
        this.tags = this.page.locator('#view-body .tag');
        this.link = this.page.locator('.view-link');
        this.editButton = this.page.locator('#view-edit');
        this.closeButton = this.page.locator('#view-close2');
        this.closeIcon = this.page.locator('#view-close');
    }

    async close() {
        await this.closeButton.click();
    }

    async closeWithIcon() {
        await this.closeIcon.click();
    }

    async edit() {
        await this.editButton.click();
    }
}
