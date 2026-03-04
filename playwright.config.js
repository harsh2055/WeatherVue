/**
 * playwright.config.js  (place at project root: weathervue/)
 *
 * Playwright E2E test configuration.
 *
 * Install: npm install -D @playwright/test
 * Download browsers: npx playwright install --with-deps chromium
 * Run: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run headed: npx playwright test --headed
 */

const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  // Directory containing test files
  testDir: './client/src/tests/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // On CI run 2 workers; locally use 50% of CPU cores
  workers: process.env.CI ? 2 : undefined,

  // Reporter: show results in terminal + generate HTML report
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    // Base URL for navigation helpers (page.goto('/map'))
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Capture trace on first retry for debugging
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',

    // Video recording on first retry
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Uncomment to run in Firefox and Safari too:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Start the dev server before running tests (remove if running against a deployed URL)
  webServer: {
    command: 'npm run dev',
    cwd: './client',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000, // 60s to start
  },
})