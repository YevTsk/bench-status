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
  playwright.config.ts   Playwright config: browser, base URL, local webServer, coverage hooks
  tsconfig.json           TypeScript compiler options for this project
  .env.example             template for a real GitHub PAT (see Real token below)

  coverage/               everything coverage-related lives here, see Coverage below
    coverage.config.ts       shared V8 coverage options (used by the fixture + setup/teardown)
    coverage-fixture.ts      the auto-fixture that records V8 coverage for every test
    global-setup.ts          clears the coverage cache before the run
    global-teardown.ts       generates the V8 coverage report after the run
    collect-ui-coverage.js   shared cross-reference logic (index.html vs. page objects vs. specs)
    ui-coverage.js           console report built on collect-ui-coverage.js
    generate-dashboard.js    plain-language HTML summary for non-technical readers
    report/                  generated output (gitignored): coverage-report.json, index.html,
                              dashboard.html

  pages/                  Page Object Model — one class per screen/component
    board.page.ts           the board: columns, cards, summary chips, header controls,
                             goto() (navigation + mocking + owner setup), drag & drop
    card-modal.page.ts      the add/edit card form (#modal-overlay), incl. custom tags
    card-detail-view.page.ts the read-only card detail view (#view-overlay)
    token-modal.page.ts     the "Connect GitHub" token modal (#token-overlay)

  fixtures/
    ui-fixtures.ts          extends the coverage-instrumented `test` (from coverage/
                             coverage-fixture.ts) to also inject page objects
                             (boardPage, cardModal, cardDetailView, tokenModal)
    files/                  static test assets (e.g. test-avatar.png)

  utils/
    mock-data.ts             DEFAULT_CARDS fixture, data.json route mocking,
                              fake-owner-token helper, GitHub API (Save) mocking

  specs/
    ui_tests/                 grouped into numbered folders — read top to bottom and it's
                               a tour of the page, in the order a visitor would experience it
      01-viewing-the-board/     what anyone sees on first load
        board-loads-with-columns-and-cards.spec.ts
        guest-view-is-read-only.spec.ts
        light-and-dark-theme.spec.ts
      02-managing-cards/        everything the owner can do to a card
        add-edit-delete-a-card.spec.ts
        tag-a-card.spec.ts
        card-start-and-end-dates.spec.ts
        drag-a-card-to-another-column.spec.ts
      03-card-details-popup/    clicking a card to see its full details
        view-card-details.spec.ts
      04-publishing-to-github/  connecting an account and publishing changes
        connect-and-disconnect-github.spec.ts
        save-and-publish-the-board.spec.ts
      05-profile-photo/         uploading a photo in the header
        upload-a-profile-photo.spec.ts
      06-mobile-view/           the column accordion on narrow screens
        collapse-and-expand-columns.spec.ts
```

**Why this layering:** specs describe user-facing behaviour and stay readable; `pages/*` hold the actual locators and low-level actions, so a markup change only needs updating in one place; `fixtures/ui-fixtures.ts` wires page objects into `test` so specs just destructure what they need (`{ boardPage, cardModal }`) instead of constructing page objects by hand in every test. The numbered `specs/ui_tests/` folders exist so someone unfamiliar with the code — a PR reviewer, a manager skimming the test report — can find "the part that tests what I'm looking at" without knowing any implementation detail; folder and file names describe what's on screen, not internal mechanics (e.g. "card details popup", not "modal state").

## Test data & mocking

- **`data.json` is mocked**, not fetched from the real repo. `utils/mock-data.ts` intercepts the request and returns a small fixed set of cards (`DEFAULT_CARDS`). This keeps tests deterministic — they don't break just because someone edited the real published board.
- **Owner mode needs no real GitHub token.** The app's `isOwner()` (in `store.js`) only checks that *some* non-empty value exists in `localStorage.gh-token` — it never validates it against GitHub. `BoardPage.goto({ owner: true })` seeds a dummy token before navigation, which is enough to unlock the real owner UI (add/edit/delete/drag) with zero network calls. `04-publishing-to-github/connect-and-disconnect-github.spec.ts` also drives the real "Connect GitHub" window directly, still with a dummy value.
- **The Save → GitHub API flow is mocked, not real.** `utils/mock-data.ts#mockGithubApi()` intercepts `https://api.github.com/repos/*/*/contents/*` — GET returns a fake SHA (or 404, to simulate first-ever publish), PUT is captured and inspected (method, body shape, `sha` inclusion) instead of actually reaching GitHub. `04-publishing-to-github/save-and-publish-the-board.spec.ts` covers a successful publish, a first-time publish with no existing file, and a failed publish (e.g. bad token).

## Coverage

Everything coverage-related — config, scripts, and generated output — lives in
`automation/coverage/`, kept separate from the test infrastructure itself (pages/
fixtures/specs). Two independent, automated coverage signals feed it, neither derived
from the tests themselves, so neither is circular (a scenario list built *from* the
tests would trivially read 100%).

### Code coverage (V8, "how much of the logic actually ran")

```bash
npm run coverage   # same as `npm test`, coverage is collected on every run
```

Every test automatically records real [V8 coverage](https://v8.dev/blog/javascript-code-coverage)
for `store.js`, `render.js`, `app.js`, and the theme scripts, via
[`monocart-coverage-reports`](https://github.com/cenfun/monocart-coverage-reports) — no
source instrumentation needed, it reads execution data straight from Chromium's DevTools
Protocol (wired up in `coverage/coverage-fixture.ts`, `coverage/global-setup.ts` and
`coverage/global-teardown.ts`). Report: `automation/coverage/report/index.html`
(gitignored, regenerated each run).

Caveat: "line executed" isn't the same as "behaviour verified" — a line can run as a side
effect of some other test without any assertion actually checking its result.

### UI control coverage ("how much of the interactive surface is exercised")

```bash
npm run ui-coverage
```

`coverage/ui-coverage.js` (via `coverage/collect-ui-coverage.js`) cross-references three
independent sources: every element with a static `id` in `index.html` (the "universe" —
buttons/inputs in the header, toolbar, and both modals), which of those are wired into a
`pages/*.page.ts` locator, and which of *those* are actually exercised (directly, or
through a page-object method that touches them) by a spec. Prints missing/untested
elements by id.

Scope: static id-based elements only. Dynamically rendered card-level controls
(`.card-add`, `.card-edit`, drag & drop, per-card tags) use classes/data-attributes, not
ids, and aren't tracked by this script — they're covered by the manual scenario list above
instead.

### Plain-language dashboard (for a non-technical reader)

```bash
npm run report      # runs the tests, then builds the dashboard
npm run dashboard    # rebuilds the dashboard from the last test run, without re-running tests
```

`coverage/generate-dashboard.js` combines both signals above into a single self-contained
HTML page — `automation/coverage/report/dashboard.html` — with a color-coded status
(Good / Needs attention / Weak) and a plain-English list of what isn't checked yet
(e.g. "Close × (card editor window)" instead of `#modal-close`). Meant for someone who
doesn't want percentages or DOM ids, just "is this in good shape."

## Real token (`.env`) — not used by default

`.env.example` documents a `GH_TEST_TOKEN` variable, reserved for a possible future **opt-in** integration test that hits the real GitHub API end-to-end. It is not wired into anything yet — `npm test` is fully mocked and needs no real credentials. If you add such a test later: copy `.env.example` to `.env`, fill in a fine-grained PAT scoped to this repo, and make sure it never targets the real `data.json` (write to a scratch file/branch instead). `.env` is gitignored.

## Adding a new test

1. If it needs a new locator/action, add it to the relevant `pages/*.page.ts` (or create a new page object if it's a new screen/component).
2. If the page object is new, register it in `fixtures/ui-fixtures.ts`.
3. Add the spec under the `specs/ui_tests/NN-section/` folder that matches what's being tested (or add a new numbered folder if it's a genuinely new area of the page). Name the file and the `test.describe()` after the visible behaviour, not the implementation — a manager skimming the test report should recognize it. Import `test`/`expect` from `../../../fixtures/ui-fixtures` (not `@playwright/test` directly — that would skip the injected page objects).
