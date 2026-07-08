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
  .env.example             template for a real GitHub PAT (see Real token below)

  pages/                  Page Object Model — one class per screen/component
    board.page.ts           the board: columns, cards, summary chips, header controls,
                             goto() (navigation + mocking + owner setup), drag & drop
    card-modal.page.ts      the add/edit card form (#modal-overlay), incl. custom tags
    card-detail-view.page.ts the read-only card detail view (#view-overlay)
    token-modal.page.ts     the "Connect GitHub" token modal (#token-overlay)

  fixtures/
    ui-fixtures.ts          extends Playwright's `test` to inject page objects
                             (boardPage, cardModal, cardDetailView, tokenModal)
    files/                  static test assets (e.g. test-avatar.png)

  utils/
    mock-data.ts             DEFAULT_CARDS fixture, data.json route mocking,
                              fake-owner-token helper, GitHub API (Save) mocking

  specs/
    ui_tests/                one file per user-facing behaviour, named
                              <action>-<resource>.spec.ts
      view-board-overview.spec.ts     columns render, cards render, summary counts
      toggle-theme.spec.ts             light/dark toggle + persistence
      view-board-as-guest.spec.ts      read-only mode: no edit/add/drag controls
      manage-cards-as-owner.spec.ts    owner mode: add / edit / delete cards, custom tags
      view-card-details.spec.ts        detail view: desc/dates/tags/link, guest vs owner
      connect-github-token.spec.ts     connecting/removing a token via the real UI
      save-board-to-github.spec.ts     Save → GitHub API (mocked), success + failure
      drag-card-between-columns.spec.ts drag & drop moves a card and updates counters
      upload-avatar.spec.ts            uploading a photo replaces the monogram
      collapse-columns-on-mobile.spec.ts accordion collapse/expand on narrow viewports
```

**Why this layering:** specs describe user-facing behaviour and stay readable; `pages/*` hold the actual locators and low-level actions, so a markup change only needs updating in one place; `fixtures/ui-fixtures.ts` wires page objects into `test` so specs just destructure what they need (`{ boardPage, cardModal }`) instead of constructing page objects by hand in every test.

## Test data & mocking

- **`data.json` is mocked**, not fetched from the real repo. `utils/mock-data.ts` intercepts the request and returns a small fixed set of cards (`DEFAULT_CARDS`). This keeps tests deterministic — they don't break just because someone edited the real published board.
- **Owner mode needs no real GitHub token.** The app's `isOwner()` (in `store.js`) only checks that *some* non-empty value exists in `localStorage.gh-token` — it never validates it against GitHub. `BoardPage.goto({ owner: true })` seeds a dummy token before navigation, which is enough to unlock the real owner UI (add/edit/delete/drag) with zero network calls. `connect-github-token.spec.ts` also drives the real "Connect GitHub" modal directly, still with a dummy value.
- **The Save → GitHub API flow is mocked, not real.** `utils/mock-data.ts#mockGithubApi()` intercepts `https://api.github.com/repos/*/*/contents/*` — GET returns a fake SHA (or 404, to simulate first-ever publish), PUT is captured and inspected (method, body shape, `sha` inclusion) instead of actually reaching GitHub. `save-board-to-github.spec.ts` covers a successful publish, a first-time publish with no existing file, and a failed publish (e.g. bad token).

## Real token (`.env`) — not used by default

`.env.example` documents a `GH_TEST_TOKEN` variable, reserved for a possible future **opt-in** integration test that hits the real GitHub API end-to-end. It is not wired into anything yet — `npm test` is fully mocked and needs no real credentials. If you add such a test later: copy `.env.example` to `.env`, fill in a fine-grained PAT scoped to this repo, and make sure it never targets the real `data.json` (write to a scratch file/branch instead). `.env` is gitignored.

## Adding a new test

1. If it needs a new locator/action, add it to the relevant `pages/*.page.ts` (or create a new page object if it's a new screen/component).
2. If the page object is new, register it in `fixtures/ui-fixtures.ts`.
3. Add the spec under `specs/ui_tests/`, named after the behaviour under test, and import `test`/`expect` from `../../fixtures/ui-fixtures` (not `@playwright/test` directly — that would skip the injected page objects).
