/**
 * client/src/tests/unit/SearchBar.test.jsx
 *
 * Component-level tests for the SearchBar component.
 * Tests rendering, user interaction, and context integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '../../components/weather/SearchBar'

// ─── Mock WeatherContext ──────────────────────────────────────────────────────
const mockFetchWeather = vi.fn()
const mockUseWeather = vi.fn(() => ({
  fetchWeather: mockFetchWeather,
  loading: false,
}))
vi.mock('../../context/WeatherContext', () => ({
  useWeather: () => mockUseWeather(),
}))

// ─── Mock useGeolocation ──────────────────────────────────────────────────────
const mockGetPosition = vi.fn()
vi.mock('../../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    getPosition: mockGetPosition,
    loading: false,
    error: null,
  }),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWeather.mockReturnValue({ fetchWeather: mockFetchWeather, loading: false })
    mockGetPosition.mockResolvedValue({ lat: 51.5, lon: -0.12 })
  })

  it('renders search input and buttons', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /my location/i })).toBeInTheDocument()
  })

  it('disables the search button when input is empty', () => {
    render(<SearchBar />)
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('enables the search button when input has text', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search city/i), 'London')
    expect(screen.getByRole('button', { name: /search/i })).not.toBeDisabled()
  })

  it('calls fetchWeather with city name on form submit', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search city/i), 'Tokyo')
    await user.click(screen.getByRole('button', { name: /search/i }))
    expect(mockFetchWeather).toHaveBeenCalledWith({ city: 'Tokyo' })
    expect(mockFetchWeather).toHaveBeenCalledTimes(1)
  })

  it('calls fetchWeather on Enter key press', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search city/i), 'Paris{Enter}')
    expect(mockFetchWeather).toHaveBeenCalledWith({ city: 'Paris' })
  })

  it('trims whitespace from city name before searching', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search city/i), '  Berlin  {Enter}')
    expect(mockFetchWeather).toHaveBeenCalledWith({ city: 'Berlin' })
  })

  it('does not call fetchWeather for whitespace-only input', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.type(screen.getByPlaceholderText(/search city/i), '   ')
    fireEvent.submit(screen.getByPlaceholderText(/search city/i).closest('form'))
    expect(mockFetchWeather).not.toHaveBeenCalled()
  })

  it('calls fetchWeather with coords when using geolocation', async () => {
    const user = userEvent.setup()
    render(<SearchBar />)
    await user.click(screen.getByRole('button', { name: /my location/i }))
    await waitFor(() => {
      expect(mockFetchWeather).toHaveBeenCalledWith({ lat: 51.5, lon: -0.12 })
    })
  })

  it('disables buttons while loading', () => {
    mockUseWeather.mockReturnValue({ fetchWeather: mockFetchWeather, loading: true })
    render(<SearchBar />)
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /location/i })).toBeDisabled()
  })
})