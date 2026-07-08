import { Locator, Page } from '@playwright/test';

export class CardModal {
    readonly page: Page;
    readonly overlay: Locator;
    readonly title: Locator;
    readonly titleInput: Locator;
    readonly descriptionInput: Locator;
    readonly columnSelect: Locator;
    readonly startInput: Locator;
    readonly endInput: Locator;
    readonly linkInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly deleteButton: Locator;
    readonly newTagInput: Locator;
    readonly addTagButton: Locator;
    readonly tagOptions: Locator;

    constructor(page: Page) {
        this.page = page;
        this.overlay = this.page.locator('#modal-overlay');
        this.title = this.page.locator('#modal-title');
        this.titleInput = this.page.locator('#card-form [name="title"]');
        this.descriptionInput = this.page.locator('#card-form [name="description"]');
        this.columnSelect = this.page.locator('#card-form [name="column"]');
        this.startInput = this.page.locator('#card-form [name="start"]');
        this.endInput = this.page.locator('#card-form [name="end"]');
        this.linkInput = this.page.locator('#card-form [name="link"]');
        this.saveButton = this.page.locator('#card-form button[type="submit"]');
        this.cancelButton = this.page.locator('#cancel-btn');
        this.deleteButton = this.page.locator('#delete-card-btn');
        this.newTagInput = this.page.locator('#new-tag-input');
        this.addTagButton = this.page.locator('#add-tag-btn');
        this.tagOptions = this.page.locator('.tag-option');
    }

    tagOption(name: string): Locator {
        return this.tagOptions.filter({ hasText: name });
    }

    async addCustomTag(name: string) {
        await this.newTagInput.fill(name);
        await this.addTagButton.click();
    }

    async fillTitle(value: string) {
        await this.titleInput.fill(value);
    }

    async save() {
        await this.saveButton.click();
    }

    async delete() {
        await this.deleteButton.click();
    }
}
