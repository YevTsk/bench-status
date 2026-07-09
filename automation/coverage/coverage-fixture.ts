import { test as base } from '@playwright/test';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage.config';

const mcr = MCR(coverageOptions);

type CoverageFixtures = {
    collectCoverage: void;
};

// V8 (Chromium-only) code coverage for every test, no opt-in needed — collection
// overhead is negligible for a suite this size. Composed into fixtures/ui-fixtures.ts.
export const test = base.extend<CoverageFixtures>({
    collectCoverage: [async ({ page }, use) => {
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
        await use();
        const jsCoverage = await page.coverage.stopJSCoverage();
        await mcr.add(jsCoverage);
    }, { scope: 'test', auto: true }],
});
