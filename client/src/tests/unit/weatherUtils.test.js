/**
 * client/src/tests/unit/weatherUtils.test.js
 *
 * Unit tests for all pure utility functions in weatherUtils.js
 *
 * Run: npx vitest run src/tests/unit/weatherUtils.test.js
 */

import { describe, it, expect } from 'vitest'
import {
  celsiusToFahrenheit,
  formatTemp,
  getAQIInfo,
  getUVInfo,
  getRecommendation,
  formatDate,
  formatTime,
  degreesToDirection,
} from '../../utils/weatherUtils'

// ─── Temperature Conversion ───────────────────────────────────────────────────
describe('celsiusToFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
  })

  it('converts 100°C to 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBe(212)
  })

  it('converts -40°C to -40°F (crossover point)', () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40)
  })

  it('converts 22°C to 72°F (rounded)', () => {
    expect(celsiusToFahrenheit(22)).toBe(72)
  })

  it('handles fractional values with rounding', () => {
    // 37°C = 98.6°F → rounds to 99
    expect(celsiusToFahrenheit(37)).toBe(99)
  })
})

describe('formatTemp', () => {
  it('formats metric temperature with °C suffix', () => {
    expect(formatTemp(20, 'metric')).toBe('20°C')
  })

  it('formats imperial temperature with °F suffix', () => {
    // 20°C = 68°F
    expect(formatTemp(20, 'imperial')).toBe('68°F')
  })

  it('rounds fractional temperatures', () => {
    expect(formatTemp(20.7, 'metric')).toBe('21°C')
    expect(formatTemp(20.3, 'metric')).toBe('20°C')
  })

  it('handles negative temperatures', () => {
    expect(formatTemp(-10, 'metric')).toBe('-10°C')
    expect(formatTemp(-10, 'imperial')).toBe('14°F')
  })

  it('handles extreme temperatures', () => {
    expect(formatTemp(50, 'metric')).toBe('50°C')
    expect(formatTemp(-50, 'imperial')).toBe('-58°F')
  })
})

// ─── AQI ──────────────────────────────────────────────────────────────────────
describe('getAQIInfo', () => {
  const cases = [
    { aqi: 1, expectedLabel: 'Good',      expectedCls: 'aqi-good' },
    { aqi: 2, expectedLabel: 'Fair',      expectedCls: 'aqi-fair' },
    { aqi: 3, expectedLabel: 'Moderate',  expectedCls: 'aqi-poor' },
    { aqi: 4, expectedLabel: 'Poor',      expectedCls: 'aqi-bad' },
    { aqi: 5, expectedLabel: 'Hazardous', expectedCls: 'aqi-hazard' },
  ]

  cases.forEach(({ aqi, expectedLabel, expectedCls }) => {
    it(`returns "${expectedLabel}" for AQI ${aqi}`, () => {
      const result = getAQIInfo(aqi)
      expect(result.label).toBe(expectedLabel)
      expect(result.cls).toBe(expectedCls)
    })
  })

  it('returns a result object with expected shape', () => {
    const result = getAQIInfo(1)
    expect(result).toHaveProperty('label')
    expect(result).toHaveProperty('color')
    expect(result).toHaveProperty('cls')
  })

  it('handles boundary value — AQI exactly at max', () => {
    // AQI 3 should match the level with max: 3
    const result = getAQIInfo(3)
    expect(result.label).toBe('Moderate')
  })
})

// ─── UV Index ─────────────────────────────────────────────────────────────────
describe('getUVInfo', () => {
  it('returns "Low" for UV 0–2', () => {
    expect(getUVInfo(0).label).toBe('Low')
    expect(getUVInfo(1).label).toBe('Low')
    expect(getUVInfo(2).label).toBe('Low')
  })

  it('returns "Moderate" for UV 3–5', () => {
    expect(getUVInfo(3).label).toBe('Moderate')
    expect(getUVInfo(5).label).toBe('Moderate')
  })

  it('returns "High" for UV 6–7', () => {
    expect(getUVInfo(6).label).toBe('High')
    expect(getUVInfo(7).label).toBe('High')
  })

  it('returns "Very High" for UV 8–10', () => {
    expect(getUVInfo(8).label).toBe('Very High')
    expect(getUVInfo(10).label).toBe('Very High')
  })

  it('returns "Extreme" for UV 11+', () => {
    expect(getUVInfo(11).label).toBe('Extreme')
    expect(getUVInfo(20).label).toBe('Extreme')
  })

  it('includes advice text for each level', () => {
    [0, 3, 6, 9, 12].forEach(uvi => {
      const result = getUVInfo(uvi)
      expect(result.advice).toBeTruthy()
      expect(typeof result.advice).toBe('string')
    })
  })
})

// ─── Weather Recommendations ──────────────────────────────────────────────────
describe('getRecommendation', () => {
  it('recommends storm shelter for thunderstorm conditions', () => {
    const rec = getRecommendation({ temp: 18, description: 'thunderstorm', wind_speed: 8, humidity: 70 })
    expect(rec.icon).toBe('⛈️')
    expect(rec.text).toMatch(/storm/i)
  })

  it('recommends umbrella for rainy conditions', () => {
    const rec = getRecommendation({ temp: 15, description: 'light rain', wind_speed: 5, humidity: 80 })
    expect(rec.icon).toBe('☔')
  })

  it('recommends cold weather gear for freezing temps', () => {
    const rec = getRecommendation({ temp: 2, description: 'clear sky', wind_speed: 3, humidity: 40 })
    expect(rec.icon).toBe('🧣')
  })

  it('recommends outdoor workout for perfect conditions', () => {
    const rec = getRecommendation({ temp: 22, description: 'clear sky', wind_speed: 3, humidity: 50 })
    expect(rec.icon).toBe('🏃')
    expect(rec.text).toMatch(/run|workout|outdoor/i)
  })

  it('recommends hydration for hot & humid conditions', () => {
    const rec = getRecommendation({ temp: 34, description: 'clear sky', wind_speed: 2, humidity: 85 })
    expect(rec.icon).toBe('🥵')
  })

  it('returns a default recommendation for edge cases', () => {
    const rec = getRecommendation({ temp: 20, description: 'few clouds', wind_speed: 3, humidity: 55 })
    expect(rec).toHaveProperty('icon')
    expect(rec).toHaveProperty('text')
    expect(rec.text.length).toBeGreaterThan(5)
  })

  it('prioritizes storm over rain when both match', () => {
    const rec = getRecommendation({ temp: 15, description: 'heavy thunderstorm with rain', wind_speed: 12, humidity: 90 })
    expect(rec.icon).toBe('⛈️')
  })
})

// ─── Wind Direction ───────────────────────────────────────────────────────────
describe('degreesToDirection', () => {
  const cases = [
    { deg: 0,   expected: 'N'  },
    { deg: 45,  expected: 'NE' },
    { deg: 90,  expected: 'E'  },
    { deg: 135, expected: 'SE' },
    { deg: 180, expected: 'S'  },
    { deg: 225, expected: 'SW' },
    { deg: 270, expected: 'W'  },
    { deg: 315, expected: 'NW' },
    { deg: 360, expected: 'N'  }, // Wrap around
  ]

  cases.forEach(({ deg, expected }) => {
    it(`returns "${expected}" for ${deg}°`, () => {
      expect(degreesToDirection(deg)).toBe(expected)
    })
  })
})

// ─── Date / Time Formatters ───────────────────────────────────────────────────
describe('formatDate', () => {
  it('returns a human-readable date string from a unix timestamp', () => {
    // 2024-01-15 noon UTC
    const ts = 1705320000
    const result = formatDate(ts)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(3)
  })

  it('includes weekday and date information', () => {
    const ts = 1705320000
    const result = formatDate(ts)
    // Should include some weekday-like text (Mon, Tue, etc.)
    expect(result).toMatch(/[A-Z][a-z]{2}/)
  })
})

describe('formatTime', () => {
  it('returns a time string from a unix timestamp', () => {
    const ts = 1705320000
    const result = formatTime(ts)
    expect(typeof result).toBe('string')
    // Should contain AM/PM or HH:MM pattern
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})