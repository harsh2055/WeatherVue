/**
 * client/src/tests/setup.js
 *
 * Global setup for Vitest — runs before every test file.
 * Extends Vitest's `expect` with @testing-library/jest-dom matchers.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Mock browser APIs not available in jsdom ──────────────────────────────────

// IntersectionObserver (used by some Leaflet / Recharts internals)
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ResizeObserver (Recharts uses this)
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// matchMedia (Tailwind dark mode check)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// localStorage (ThemeContext / WeatherContext use this)
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })