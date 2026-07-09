/**
 * Generates a single self-contained HTML page summarizing test coverage in plain
 * language for a non-technical audience — combines the same two automated,
 * non-circular signals used by the developer-facing scripts:
 *   - V8 code coverage (automation/coverage/report/coverage-report.json)
 *   - UI control coverage (coverage/collect-ui-coverage.js)
 *
 * Run `npm run coverage` first so coverage-report.json exists, then this script.
 * `npm run report` does both in one step.
 */

const fs = require('fs');
const path = require('path');
const { collectUiCoverage } = require('./collect-ui-coverage');

const REPORT_DIR = path.join(__dirname, 'report');
const COVERAGE_JSON = path.join(REPORT_DIR, 'coverage-report.json');
const OUTPUT_FILE = path.join(REPORT_DIR, 'dashboard.html');

// Plain-language labels for every static-id control we know about, so the
// dashboard never shows a raw DOM id to a non-technical reader.
const CONTROL_LABELS = {
    'add-tag-btn': 'Add custom tag',
    'avatar-btn': 'Change profile photo',
    'avatar-input': 'Upload profile photo',
    'delete-card-btn': 'Delete card',
    'new-tag-input': 'Type a new tag',
    'save-btn': 'Save (publish to GitHub)',
    'theme-toggle': 'Light / dark theme switch',
    'token-btn': 'Connect GitHub',
    'token-input': 'GitHub token field',
    'token-remove': 'Disconnect GitHub',
    'token-save': 'Save GitHub token',
    'view-edit': 'Edit (from card details)',
    'cancel-btn': 'Cancel (card editor)',
    'token-cancel': 'Cancel (GitHub connection window)',
    'token-close': 'Close × (GitHub connection window)',
    'view-close2': 'Close (card details window)',
    'modal-close': 'Close × (card editor window)',
    'view-close': 'Close × (card details window)',
};

function labelFor(id) {
    return CONTROL_LABELS[id] || id;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function statusWord(status) {
    if (status === 'high') return { word: 'Good', color: '#16a34a', bg: '#ecfdf5' };
    if (status === 'medium') return { word: 'Needs attention', color: '#b45309', bg: '#fffbeb' };
    return { word: 'Weak', color: '#dc2626', bg: '#fef2f2' };
}

function overallStatus(codeStatus, uiPct) {
    const uiStatus = uiPct >= 80 ? 'high' : uiPct >= 50 ? 'medium' : 'low';
    const order = { low: 0, medium: 1, high: 2 };
    return order[codeStatus] <= order[uiStatus] ? codeStatus : uiStatus;
}

function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function main() {
    if (!fs.existsSync(COVERAGE_JSON)) {
        console.error(`Missing ${COVERAGE_JSON} — run "npm test" (or "npm run report") first.`);
        process.exit(1);
    }

    const coverage = readJson(COVERAGE_JSON);
    const linesStatus = coverage.summary.lines.status;
    const linesPct = coverage.summary.lines.pct;
    const branchesPct = coverage.summary.branches.pct;

    const ui = collectUiCoverage();
    const uiPct = ui.total ? Math.round((ui.tested.length / ui.total) * 100) : 0;
    const gaps = [...new Set([...ui.notWired, ...ui.wiredNotTested])].sort();

    const overall = overallStatus(linesStatus, uiPct);
    const overallInfo = statusWord(overall);
    const codeInfo = statusWord(linesStatus);
    const uiInfo = statusWord(uiPct >= 80 ? 'high' : uiPct >= 50 ? 'medium' : 'low');

    const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

    const gapsHtml = gaps.length
        ? `<ul class="gap-list">${gaps.map((id) => `<li>${escapeHtml(labelFor(id))}</li>`).join('')}</ul>`
        : '<p class="all-clear">Everything on screen has an automated check. 🎉</p>';

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bench Status — Test Coverage Summary</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px 20px 60px;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    background: #f2f2f7; color: #1c1c1e;
  }
  @media (prefers-color-scheme: dark) {
    body { background: #000; color: #f2f2f7; }
    .card { background: #1c1c1e !important; border-color: #2c2c2e !important; }
    .muted { color: #98989d !important; }
  }
  .page { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #8a8a8e; font-size: 14px; margin: 0 0 28px; }
  .card {
    background: #fff; border: 1px solid #e5e5ea; border-radius: 16px;
    padding: 24px 28px; margin-bottom: 18px;
  }
  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 700; font-size: 15px; padding: 6px 16px; border-radius: 20px;
  }
  .headline { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .headline p { margin: 10px 0 0; font-size: 15px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #8a8a8e; margin: 0 0 14px; }
  .bar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
  .bar-label { width: 220px; font-size: 14px; flex-shrink: 0; }
  .bar-track { flex: 1; height: 10px; background: #e5e5ea; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; }
  .bar-pct { width: 48px; text-align: right; font-size: 13px; font-weight: 600; flex-shrink: 0; }
  .gap-list { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.9; }
  .all-clear { font-size: 14px; margin: 0; }
  footer { font-size: 12px; color: #8a8a8e; text-align: center; margin-top: 20px; }
</style>
</head>
<body>
<div class="page">

  <h1>Bench Status — Test Coverage Summary</h1>
  <p class="muted">Plain-language rollup of automated test coverage. Generated from real test runs, not maintained by hand.</p>

  <div class="card">
    <div class="headline">
      <div>
        <div class="section-title">Overall</div>
        <span class="badge" style="color:${overallInfo.color};background:${overallInfo.bg}">${overallInfo.word}</span>
      </div>
    </div>
    <p>Automated tests cover <strong>${linesPct}%</strong> of the app's logic and check <strong>${uiPct}%</strong> of the on-screen controls that matter.</p>
  </div>

  <div class="card">
    <div class="section-title">How much of the app actually runs during tests</div>
    <div class="bar-row">
      <span class="bar-label">Overall logic</span>
      <div class="bar-track"><div class="bar-fill" style="width:${linesPct}%;background:${codeInfo.color}"></div></div>
      <span class="bar-pct">${linesPct}%</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">Decision branches (edge cases)</span>
      <div class="bar-track"><div class="bar-fill" style="width:${branchesPct}%;background:${statusWord(coverage.summary.branches.status).color}"></div></div>
      <span class="bar-pct">${branchesPct}%</span>
    </div>
  </div>

  <div class="card">
    <div class="section-title">Which buttons/fields have an automated check</div>
    <div class="bar-row">
      <span class="bar-label">Header, toolbar &amp; pop-up controls</span>
      <div class="bar-track"><div class="bar-fill" style="width:${uiPct}%;background:${uiInfo.color}"></div></div>
      <span class="bar-pct">${uiPct}%</span>
    </div>
    <p class="muted" style="margin:16px 0 10px">Not yet checked by an automated test:</p>
    ${gapsHtml}
  </div>

  <footer>Generated ${generatedAt} · automation/coverage/generate-dashboard.js</footer>

</div>
</body>
</html>
`;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
    console.log(`Dashboard written to ${OUTPUT_FILE}`);
}

main();
