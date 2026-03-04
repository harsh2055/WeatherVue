/**
 * client/src/services/aiService.js
 *
 * Frontend service for the AI assistant API.
 * Re-uses the same axios instance that attaches Supabase auth tokens.
 */

import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000, // AI responses can take longer — 30s timeout
})

// Attach Supabase auth token (mirrors weatherService.js pattern)
API.interceptors.request.use(async (config) => {
  try {
    const { supabase } = await import('./supabaseClient')
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (_) {}
  return config
})

export const aiService = {
  /**
   * Send a message to the weather AI assistant.
   * @param {object} params
   * @param {object} params.forecast   - OWM One Call forecast object
   * @param {object} params.current    - OWM current weather object
   * @param {string} params.userPrompt - The user's message
   * @param {Array}  params.history    - Previous chat messages [{role, content}]
   * @param {string} params.provider   - 'gemini' | 'openai'
   */
  chat: ({ forecast, current, userPrompt, history = [], provider = 'gemini' }) =>
    API.post('/api/ai/chat', { forecast, current, userPrompt, history, provider }),

  /**
   * Generate a one-shot daily summary (no conversation history).
   * @param {object} params
   * @param {object} params.forecast
   * @param {object} params.current
   */
  summary: ({ forecast, current }) =>
    API.post('/api/ai/summary', { forecast, current }),
}