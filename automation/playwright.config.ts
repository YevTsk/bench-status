import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './specs',
    fullyParallel: true,
    reporter: 'list',
    globalSetup: './coverage/global-setup',
    globalTeardown: './coverage/global-teardown',
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'npx http-server .. -p 4173 -s',
        url: 'http://localhost:4173/index.html',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
});
