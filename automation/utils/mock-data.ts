import { Page } from '@playwright/test';

export type Card = {
    id: string;
    column: 'todo' | 'progress' | 'hold' | 'done';
    title: string;
    desc: string;
    start: string;
    end: string;
    link: string;
    tags: string[];
};

export const DEFAULT_CARDS: Card[] = [
    { id: 'c1', column: 'todo', title: 'Sample Todo Card', desc: 'A sample task in To Do.', start: '', end: '', link: '', tags: ['AI Tooling'] },
    { id: 'c2', column: 'progress', title: 'Sample In Progress Card', desc: 'Doing something.', start: '2026-01-01', end: '', link: '', tags: ['Anthropic Academy'] },
    { id: 'c3', column: 'hold', title: 'Sample On Hold Card', desc: 'Waiting on something.', start: '', end: '', link: '', tags: [] },
    { id: 'c4', column: 'done', title: 'Sample Done Card', desc: '', start: '', end: '2026-01-02', link: 'https://example.com/cert', tags: ['Anthropic Academy'] },
];

// Serves a fixed board payload instead of the real (constantly-changing) data.json,
// so tests don't depend on whatever cards happen to be live on the site right now.
export async function mockBoardData(page: Page, cards: Card[] = DEFAULT_CARDS, profile: Record<string, unknown> = {}) {
    const payload = JSON.stringify({ profile, cards });
    const handler = (route: import('@playwright/test').Route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: payload });

    await page.route('**/data.json*', handler);
    await page.route('https://raw.githubusercontent.com/**', handler);
}

// isOwner() in store.js only checks that a non-empty token string exists in
// localStorage — it never validates it against GitHub. That's enough to drive
// the owner-mode UI in tests without touching the real GitHub API.
export async function setOwnerToken(page: Page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('gh-token', 'test-owner-token');
    });
}
