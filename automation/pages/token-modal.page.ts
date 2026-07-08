import { Locator, Page } from '@playwright/test';

export class TokenModal {
    readonly page: Page;
    readonly overlay: Locator;
    readonly input: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly removeButton: Locator;
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.overlay = this.page.locator('#token-overlay');
        this.input = this.page.locator('#token-input');
        this.saveButton = this.page.locator('#token-save');
        this.cancelButton = this.page.locator('#token-cancel');
        this.removeButton = this.page.locator('#token-remove');
        this.closeButton = this.page.locator('#token-close');
    }

    async connect(token: string) {
        await this.input.fill(token);
        await this.saveButton.click();
    }

    async remove() {
        await this.removeButton.click();
    }
}
