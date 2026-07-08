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

export type GithubApiMockOptions = {
    existingSha?: string; // omit to simulate no existing data.json (first-ever publish)
    putStatus?: number; // default 200
    putErrorMessage?: string; // body.message when putStatus is not 2xx
};

// Mocks store.js's publish() calls (GET for the current file SHA, PUT to commit) so
// Save never touches the real repo. Returns the bodies of every PUT request the app
// made, so a test can assert exactly what would have been committed.
export async function mockGithubApi(page: Page, options: GithubApiMockOptions = {}) {
    const putRequests: Record<string, unknown>[] = [];

    await page.route('https://api.github.com/repos/*/*/contents/*', async (route) => {
        const request = route.request();

        if (request.method() === 'GET') {
            if (options.existingSha) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sha: options.existingSha }) });
            } else {
                await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not Found' }) });
            }
            return;
        }

        if (request.method() === 'PUT') {
            putRequests.push(JSON.parse(request.postData() || '{}'));
            const status = options.putStatus ?? 200;
            const body = status >= 200 && status < 300
                ? { content: { sha: 'new-sha-after-commit' } }
                : { message: options.putErrorMessage ?? 'Save failed' };
            await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            return;
        }

        await route.continue();
    });

    return { putRequests };
}
