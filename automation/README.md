# Bench Status — Automation

Playwright + TypeScript end-to-end tests for the [bench-status](..) board. Self-contained: everything test-related (config, dependencies, specs) lives in this folder, separate from the zero-build-step site in the repo root.

## Setup

```bash
npm install
npx playwright install chromium   # first time only
```

## Running the tests

```bash
npm test          # headless run
npm run testui    # Playwright's UI mode — step through tests, inspect locators
```

`playwright.config.ts` spins up a local static server (`http-server ..`) serving the site from the repo root at `http://localhost:4173`, and points every test at it. Tests never touch the live site or the real GitHub API — see [Test data & mocking](#test-data--mocking) below.

## Project structure

```
automation/
  playwright.config.ts   Playwright config: browser, base URL, local webServer
  tsconfig.json           TypeScript compiler options for this project

  pages/                  Page Object Model — one class per screen/component
    board.page.ts           the board: columns, cards, summary chips, header controls,
                             goto() (navigation + mocking + owner setup)
    card-modal.page.ts      the add/edit card form (#modal-overlay)
    card-detail-view.page.ts the read-only card detail view (#view-overlay)

  fixtures/
    ui-fixtures.ts          extends Playwright's `test` to inject page objects
                             (boardPage, cardModal, cardDetailView) into every spec

  utils/
    mock-data.ts             DEFAULT_CARDS fixture, data.json route mocking,
                              fake-owner-token helper

  specs/
    ui_tests/                one file per user-facing behaviour, named
                              <action>-<resource>.spec.ts
      view-board-overview.spec.ts    columns render, cards render, summary counts
      toggle-theme.spec.ts            light/dark toggle + persistence
      view-board-as-guest.spec.ts     read-only mode: no edit/add/drag controls
      manage-cards-as-owner.spec.ts   owner mode: add / edit / delete cards
      view-card-details.spec.ts       detail view: desc/dates/tags/link, guest vs owner
```

**Why this layering:** specs describe user-facing behaviour and stay readable; `pages/*` hold the actual locators and low-level actions, so a markup change only needs updating in one place; `fixtures/ui-fixtures.ts` wires page objects into `test` so specs just destructure what they need (`{ boardPage, cardModal }`) instead of constructing page objects by hand in every test.

## Test data & mocking

- **`data.json` is mocked**, not fetched from the real repo. `utils/mock-data.ts` intercepts the request and returns a small fixed set of cards (`DEFAULT_CARDS`). This keeps tests deterministic — they don't break just because someone edited the real published board.
- **Owner mode needs no real GitHub token.** The app's `isOwner()` (in `store.js`) only checks that *some* non-empty value exists in `localStorage.gh-token` — it never validates it against GitHub. `BoardPage.goto({ owner: true })` seeds a dummy token before navigation, which is enough to unlock the real owner UI (add/edit/delete/drag) with zero network calls.
- **The Save → GitHub API flow is intentionally not exercised.** Clicking Save for real would hit `api.github.com` and could publish test data to the live board. Testing it properly would mean mocking `**/api.github.com/**` and asserting the request shape (method, body, headers) — not yet written.

## Adding a new test

1. If it needs a new locator/action, add it to the relevant `pages/*.page.ts` (or create a new page object if it's a new screen/component).
2. If the page object is new, register it in `fixtures/ui-fixtures.ts`.
3. Add the spec under `specs/ui_tests/`, named after the behaviour under test, and import `test`/`expect` from `../../fixtures/ui-fixtures` (not `@playwright/test` directly — that would skip the injected page objects).
