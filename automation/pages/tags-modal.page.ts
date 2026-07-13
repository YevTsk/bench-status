import { Locator, Page } from '@playwright/test';

export class TagsModal {
    readonly page: Page;
    readonly overlay: Locator;
    readonly list: Locator;
    readonly newInput: Locator;
    readonly addButton: Locator;
    readonly closeIcon: Locator;
    readonly doneButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.overlay = this.page.locator('#tags-overlay');
        this.list = this.page.locator('#tags-list');
        this.newInput = this.page.locator('#tags-new-input');
        this.addButton = this.page.locator('#tags-add-btn');
        this.closeIcon = this.page.locator('#tags-close');
        this.doneButton = this.page.locator('#tags-done-btn');
    }

    row(name: string): Locator {
        return this.page.locator(`.tag-row[data-tag="${name}"]`);
    }

    rowInput(name: string): Locator {
        return this.row(name).locator('.tag-row-input');
    }

    rowDeleteButton(name: string): Locator {
        return this.row(name).locator('.tag-row-delete');
    }

    async addTag(name: string) {
        await this.newInput.fill(name);
        await this.addButton.click();
    }

    async deleteTag(name: string) {
        await this.rowDeleteButton(name).click();
    }

    async renameTag(oldName: string, newName: string) {
        const input = this.rowInput(oldName);
        await input.fill(newName);
        await input.blur();
    }

    async close() {
        await this.doneButton.click();
    }

    async closeWithIcon() {
        await this.closeIcon.click();
    }
}
