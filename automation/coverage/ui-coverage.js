/**
 * UI control coverage — mirrors the Axys "endpoint coverage" idea, applied to DOM
 * controls instead of API endpoints:
 *
 *   index.html (interactive elements with a static id)   <- the "universe"
 *   pages/*.page.ts (which ids are wired into a locator)  <- "implemented"
 *   specs/ui_tests/**.spec.ts (which of those are used)   <- "tested"
 *
 * Both "universe" and "wired" are derived from the app/POM source, not from the
 * specs themselves, so the resulting percentage isn't circular.
 *
 * Scope: only elements with a static `id` in index.html (header, toolbar, both
 * modals). Dynamically rendered card-level controls (.card-add, .card-edit, drag
 * & drop, per-card tags) use classes/data-attributes, not ids — they're out of
 * this script's reach and are tracked separately via the manual scenario list.
 */

const { collectUiCoverage } = require('./collect-ui-coverage');

function pct(n, total) {
    return total ? Math.round((n / total) * 100) : 0;
}

function main() {
    const { total, wired, tested, notWired, wiredNotTested } = collectUiCoverage();

    console.log('UI control coverage (static elements with an id, from index.html)');
    console.log('='.repeat(70));
    console.log(`Total interactive elements: ${total}`);
    console.log(`Wired into a Page Object:   ${wired.length} (${pct(wired.length, total)}%)`);
    console.log(`Exercised by a spec:        ${tested.length} (${pct(tested.length, total)}%)`);
    console.log();

    if (notWired.length) {
        console.log('Not wired into any Page Object:');
        notWired.forEach((id) => console.log(`  - #${id}`));
        console.log();
    }

    if (wiredNotTested.length) {
        console.log('Wired but never exercised by a spec:');
        wiredNotTested.forEach((id) => console.log(`  - #${id}`));
        console.log();
    }

    console.log("Note: static id-based elements only (header/toolbar/modals). Dynamic");
    console.log("card-level controls (add/edit/drag/tags) use classes, not ids, and are");
    console.log('tracked separately in the manual scenario list (README).');
}

main();
