# Bench Status

A personal status board — a Kanban-style tracker for what I'm working on while on the bench (To Do / In Progress / On Hold / Done), plus completed courses and certifications.

Live: https://yevtsk.github.io/bench-status/

## Stack

Static HTML/CSS/JS, no build step, no dependencies. Hosted on GitHub Pages, deployed straight from `main`.

## How it works

- **`data.json`** is the single source of truth for board content (cards + profile/avatar). The page fetches it on load.
- **Editing happens in the browser**, not in an editor: open the live site, connect a GitHub token (icon in the header), and the board becomes editable — add/edit/delete cards, drag between columns, upload an avatar.
- **Save** commits the current board straight to `data.json` in this repo via the GitHub Contents API, so the change is live for everyone within about a minute (GitHub Pages rebuild time).
- **Without a token, the board is read-only.** No edit/add/drag controls are rendered at all for guests — visitors can browse and open card details, nothing else.
- The GitHub token is a fine-grained PAT scoped to this one repository (`Contents: Read and write`), stored only in the browser's `localStorage`. It is never committed anywhere.

## File structure

```
index.html        markup + modals (card editor, card detail view, GitHub token)
styles.css         all styling (theming via CSS custom properties, light/dark)
store.js           data layer — state, localStorage persistence, GitHub sync (no DOM)
render.js          state → DOM (board/cards/stats/toolbar), no data mutation
app.js             event wiring, modals, drag & drop — orchestrates store + render
theme-init.js       applies saved theme before first paint (avoids flash)
theme-toggle.js     the light/dark toggle button
data.json           published board content (cards + profile) — committed by Save
favicon.svg / og-image.svg   branding assets
automation/         Playwright + TypeScript end-to-end tests (see Testing below)
```

`store.js` → `render.js` → `app.js` is also the script load order in `index.html`; each attaches itself to a shared `window.Bench` namespace instead of using ES module imports, so the page still works when opened directly from disk (`file://`), where module scripts are blocked by CORS.

## Local development

Just open `index.html` in a browser — no server or build step required.

On `file://`, fetching the local `data.json` is blocked by the browser, so the app falls back to fetching the published `data.json` straight from `raw.githubusercontent.com`. This means local runs show live board content, not stale seed data.

**Cache-busting:** `styles.css`, `store.js`, `render.js`, `app.js`, and `favicon.svg` are loaded with a `?v=N` query string in `index.html`. Bump the relevant `N` whenever you edit one of those files, otherwise GitHub Pages visitors may keep an old cached copy after deploy.

## Deploying

Push to `main` — GitHub Pages rebuilds automatically (usually within ~1 minute). No CI/CD pipeline.

## Testing

All testing lives in [`automation/`](automation) — a self-contained Playwright + TypeScript project (Page Object Model + fixtures), kept separate from the zero-build-step site itself. End-to-end tests run against a local static server, never against the live site or the real GitHub API. No CI wiring — run locally before pushing UI/logic changes.

```bash
cd automation
npm install
npx playwright install chromium   # first time only
npm test                          # or: npm run testui (Playwright UI mode)
```

See [`automation/README.md`](automation/README.md) for the full folder breakdown, mocking strategy, and how to add a new test.
