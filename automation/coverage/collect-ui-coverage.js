/**
 * Shared logic behind UI control coverage: cross-references index.html (the
 * "universe" of interactive elements with a static id), pages/*.page.ts (which
 * ids are wired into a locator), and specs/ui_tests/**.spec.ts (which of those
 * are actually exercised — directly, or through a page-object method that
 * touches them internally).
 *
 * Used by both coverage/ui-coverage.js (console output) and
 * coverage/generate-dashboard.js (plain-language HTML summary).
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..', '..');
const AUTOMATION = path.join(__dirname, '..');
const PAGES_DIR = path.join(AUTOMATION, 'pages');
const SPECS_DIR = path.join(AUTOMATION, 'specs', 'ui_tests');

const FIXTURE_TO_PAGE_FILE = {
    boardPage: 'board.page.ts',
    cardModal: 'card-modal.page.ts',
    cardDetailView: 'card-detail-view.page.ts',
    tokenModal: 'token-modal.page.ts',
    tagsModal: 'tags-modal.page.ts',
};

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function extractInteractiveIds(html) {
    const tagPattern = /<(button|input|select|textarea|a)\b[^>]*\bid="([\w-]+)"[^>]*>/gi;
    const ids = new Set();
    let match;
    while ((match = tagPattern.exec(html))) {
        ids.add(match[2]);
    }
    return ids;
}

function collectThisPropertyAccesses(node, set) {
    if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.ThisKeyword) {
        set.add(node.name.text);
    }
    node.forEachChild((child) => collectThisPropertyAccesses(child, set));
}

function parsePageObject(filePath) {
    const sourceFile = ts.createSourceFile(filePath, readFile(filePath), ts.ScriptTarget.Latest, true);
    const idToProp = new Map();
    const methodUses = new Map();

    function visit(node) {
        if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(node.left) &&
            node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
            ts.isCallExpression(node.right) &&
            ts.isPropertyAccessExpression(node.right.expression) &&
            node.right.expression.name.text === 'locator' &&
            node.right.arguments.length > 0 &&
            ts.isStringLiteral(node.right.arguments[0])
        ) {
            const idMatch = node.right.arguments[0].text.match(/^#([\w-]+)$/);
            if (idMatch) idToProp.set(idMatch[1], node.left.name.text);
        }

        if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name) && node.body) {
            const uses = new Set();
            collectThisPropertyAccesses(node.body, uses);
            methodUses.set(node.name.text, uses);
        }

        node.forEachChild(visit);
    }

    visit(sourceFile);
    return { idToProp, methodUses };
}

function parseSpecUsages(filePath, fixtureNames) {
    const sourceFile = ts.createSourceFile(filePath, readFile(filePath), ts.ScriptTarget.Latest, true);
    const used = new Set();

    function visit(node) {
        if (
            ts.isPropertyAccessExpression(node) &&
            ts.isIdentifier(node.expression) &&
            fixtureNames.includes(node.expression.text)
        ) {
            used.add(`${node.expression.text}.${node.name.text}`);
        }
        node.forEachChild(visit);
    }

    visit(sourceFile);
    return used;
}

// Returns { total, wired, tested, notWired, wiredNotTested } where the last two
// are arrays of dom ids (strings).
function collectUiCoverage() {
    const interactiveIds = extractInteractiveIds(readFile(path.join(ROOT, 'index.html')));

    const idInfo = new Map(); // id -> { fixtureName, propName }
    const methodUsesByFixture = new Map();

    Object.entries(FIXTURE_TO_PAGE_FILE).forEach(([fixtureName, fileName]) => {
        const filePath = path.join(PAGES_DIR, fileName);
        if (!fs.existsSync(filePath)) return;
        const { idToProp, methodUses } = parsePageObject(filePath);
        idToProp.forEach((propName, id) => idInfo.set(id, { fixtureName, propName }));
        methodUsesByFixture.set(fixtureName, methodUses);
    });

    const fixtureNames = Object.keys(FIXTURE_TO_PAGE_FILE);
    const specUsages = new Set();
    // specs live in named subfolders (01-viewing-the-board/, 02-managing-cards/, ...), so scan recursively
    fs.readdirSync(SPECS_DIR, { recursive: true })
        .filter((f) => f.endsWith('.spec.ts'))
        .forEach((file) => {
            parseSpecUsages(path.join(SPECS_DIR, file), fixtureNames).forEach((u) => specUsages.add(u));
        });

    function isPropTested(fixtureName, propName) {
        if (specUsages.has(`${fixtureName}.${propName}`)) return true;
        const methodUses = methodUsesByFixture.get(fixtureName);
        if (!methodUses) return false;
        for (const [methodName, propsUsed] of methodUses) {
            if (propsUsed.has(propName) && specUsages.has(`${fixtureName}.${methodName}`)) return true;
        }
        return false;
    }

    const wired = [];
    const tested = [];
    const notWired = [];
    const wiredNotTested = [];

    interactiveIds.forEach((id) => {
        const info = idInfo.get(id);
        if (!info) {
            notWired.push(id);
            return;
        }
        wired.push(id);
        if (isPropTested(info.fixtureName, info.propName)) tested.push(id);
        else wiredNotTested.push(id);
    });

    return {
        total: interactiveIds.size,
        wired: wired.sort(),
        tested: tested.sort(),
        notWired: notWired.sort(),
        wiredNotTested: wiredNotTested.sort(),
    };
}

module.exports = { collectUiCoverage };
