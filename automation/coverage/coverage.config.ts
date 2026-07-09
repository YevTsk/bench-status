import path from 'path';

// V8 (Chromium DevTools Protocol) coverage — no source instrumentation needed,
// works directly on the site's plain <script> files. Scoped to just the app's
// own scripts (store.js/render.js/app.js/theme-*.js), excluding anything else
// the browser might load.
export const coverageOptions = {
    name: 'Bench Status — JS Coverage',
    outputDir: path.join(__dirname, 'report'),
    reports: ['v8', 'v8-json', 'console-summary'],
    entryFilter: (entry: { url: string }) => /\/(store|render|app|theme-toggle|theme-init)\.js(\?|$)/.test(entry.url),
};
