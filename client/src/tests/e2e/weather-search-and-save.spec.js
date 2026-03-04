/**
 * client/src/tests/e2e/weather-search-and-save.spec.js
 *
 * End-to-End test: Search for a city and save it to the dashboard.
 *
 * This test covers the full user journey:
 *   1. User lands on the homepage
 *   2. User searches for a city
 *   3. Weather data loads and displays
 *   4. User signs in (if needed) and saves the city
 *   5. Saved city appears on the dashboard
 *
 * Prerequisites:
 *   - The dev server is running (or webServer config in playwright.config.js handles it)
 *   - A test Supabase account exists:
 *       Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD in .env.test
 */

const { test, expect } = require('@playwright/test')

// ─── Page Object Model ────────────────────────────────────────────────────────
// Encapsulates selectors so tests are readable and resilient to HTML changes.
class WeatherPage {
  constructor(page) {
    this.page = page
    this.searchInput    = page.getByPlaceholder(/search city/i)
    this.searchButton   = page.getByRole('button', { name: /search/i })
    this.geoButton      = page.getByRole('button', { name: /my location/i })
    this.weatherCard    = page.locator('.card').filter({ hasText: /feels like/i })
    this.saveButton     = page.getByRole('button', { name: /save/i })
    this.savedIndicator = page.getByRole('button', { name: /saved/i })
    this.loadingSpinner = page.locator('.animate-spin')
    this.errorMessage   = page.locator('[class*="red"]').filter({ hasText: /⚠️|error|not found/i })
  }

  async searchCity(cityName) {
    await this.searchInput.fill(cityName)
    await this.searchButton.click()
  }

  async waitForWeatherLoad() {
    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 15000 })
    // Wait for weather card to appear
    await this.weatherCard.waitFor({ state: 'visible', timeout: 15000 })
  }
}

class AuthPage {
  constructor(page) {
    this.page = page
    this.emailInput    = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/password/i)
    this.signInButton  = page.getByRole('button', { name: /sign in/i })
    this.signUpToggle  = page.getByRole('button', { name: /sign up/i })
    this.signInNavLink = page.getByRole('link', { name: /sign in/i })
  }

  async signIn(email, password) {
    await this.page.goto('/auth')
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
    // Wait for redirect away from /auth
    await this.page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 10000 })
  }
}

class DashboardPage {
  constructor(page) {
    this.page = page
    this.heading       = page.getByRole('heading', { name: /my dashboard/i })
    this.savedSection  = page.getByText(/saved cities/i)
    this.favoriteCities = page.locator('button').filter({ hasText: /📍/ })
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.heading.waitFor({ timeout: 5000 })
  }

  async getCityNames() {
    const buttons = await this.favoriteCities.all()
    return Promise.all(buttons.map(btn => btn.textContent()))
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe('Weather Search', () => {
  test('user can search for a city and see weather data', async ({ page }) => {
    const weather = new WeatherPage(page)
    await page.goto('/')

    // Search input starts empty
    await expect(weather.searchInput).toBeVisible()
    await expect(weather.searchInput).toHaveValue('')

    // Type a city name and submit
    await weather.searchCity('London')

    // Loading state should appear briefly
    // (not asserting it since it can be fast)

    // Wait for weather data to load
    await weather.waitForWeatherLoad()

    // Weather card should be visible and contain city name
    await expect(weather.weatherCard).toBeVisible()
    await expect(page.getByText(/London/i)).toBeVisible()

    // Key weather stats should be visible
    await expect(page.getByText(/humidity/i)).toBeVisible()
    await expect(page.getByText(/feels like/i)).toBeVisible()
  })

  test('shows error for invalid city name', async ({ page }) => {
    const weather = new WeatherPage(page)
    await page.goto('/')

    await weather.searchCity('ThisCityDoesNotExistXYZ123')
    await weather.loadingSpinner.waitFor({ state: 'detached', timeout: 15000 })

    // An error message should appear
    await expect(weather.errorMessage).toBeVisible()
    await expect(weather.weatherCard).not.toBeVisible()
  })

  test('displays 7-day forecast after searching', async ({ page }) => {
    const weather = new WeatherPage(page)
    await page.goto('/')

    await weather.searchCity('Paris')
    await weather.waitForWeatherLoad()

    // Forecast section should show
    await expect(page.getByText(/7-day forecast/i)).toBeVisible()
    // Should have multiple day entries including "Today"
    await expect(page.getByText('Today')).toBeVisible()
  })
})

test.describe('Save City to Dashboard (authenticated)', () => {
  // Skip if no test credentials are configured
  const email    = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  test.skip(!email || !password, 'Skipped: PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    // Sign in before each test in this group
    const auth = new AuthPage(page)
    await auth.signIn(email, password)
  })

  test('authenticated user can save a city from the home page', async ({ page }) => {
    const weather   = new WeatherPage(page)
    const dashboard = new DashboardPage(page)
    const testCity  = 'Amsterdam'

    // Search for a city
    await page.goto('/')
    await weather.searchCity(testCity)
    await weather.waitForWeatherLoad()

    // Save button should be visible for authenticated users
    await expect(weather.saveButton).toBeVisible()
    await weather.saveButton.click()

    // Button should change to "Saved"
    await expect(weather.savedIndicator).toBeVisible({ timeout: 5000 })

    // Navigate to dashboard
    await dashboard.goto()

    // The saved city should appear in the favorites list
    const cityNames = await dashboard.getCityNames()
    const found = cityNames.some(name => name.includes(testCity))
    expect(found).toBe(true)
  })

  test('saved city can be removed from the dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    const initialCities = await dashboard.getCityNames()
    if (initialCities.length === 0) {
      test.skip('No saved cities to remove')
    }

    // Click the remove button (✕) on the first city
    const removeButtons = page.locator('button').filter({ hasText: '✕' })
    const firstRemoveBtn = removeButtons.first()
    const firstCityText = await dashboard.favoriteCities.first().textContent()

    await firstRemoveBtn.click()

    // Wait for city to disappear
    await page.waitForTimeout(1000)

    const remainingCities = await dashboard.getCityNames()
    const stillPresent = remainingCities.some(name => name === firstCityText)
    expect(stillPresent).toBe(false)
  })
})

test.describe('Navigation', () => {
  test('navbar links navigate to correct pages', async ({ page }) => {
    await page.goto('/')

    // Navigate to Map page
    await page.getByRole('link', { name: /map/i }).click()
    await expect(page).toHaveURL('/map')
    await expect(page.getByText(/live weather map/i)).toBeVisible()

    // Navigate back to Home
    await page.getByRole('link', { name: /home/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('unauthenticated user is redirected from dashboard to auth', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to /auth
    await expect(page).toHaveURL('/auth', { timeout: 5000 })
  })

  test('unit toggle switches between °C and °F', async ({ page }) => {
    await page.goto('/')

    const unitToggle = page.getByRole('button', { name: /°C|°F/i })
    await expect(unitToggle).toHaveText('°C')

    await unitToggle.click()
    await expect(unitToggle).toHaveText('°F')

    await unitToggle.click()
    await expect(unitToggle).toHaveText('°C')
  })
})