/**
 * client/src/hooks/useAIChat.js
 *
 * Custom hook encapsulating all AI chat state and logic.
 * Keeps the WeatherAssistant component clean and testable.
 */

import { useState, useCallback } from 'react'
import { aiService } from '../services/aiService'

export const SUGGESTED_PROMPTS = [
  "What's the best day this week for a hike?",
  "Should I pack an umbrella for tomorrow?",
  "Give me a morning briefing for today.",
  "Is it safe to exercise outside with this AQI?",
  "What should I wear for the next 3 days?",
  "Any severe weather I should be aware of?",
]

export function useAIChat({ forecast, current }) {
  const [messages, setMessages] = useState([])   // { id, role, content, timestamp }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const addMessage = useCallback((role, content) => {
    const msg = { id: Date.now() + Math.random(), role, content, timestamp: new Date() }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    setError(null)
    setInput('')
    addMessage('user', trimmed)
    setLoading(true)

    // Build history from current messages for multi-turn context
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const { data } = await aiService.chat({
        forecast,
        current,
        userPrompt: trimmed,
        history,
      })
      addMessage('assistant', data.reply)
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(msg)
      // Remove the user message on error so they can retry
      setMessages(prev => prev.slice(0, -1))
      setInput(trimmed)
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, forecast, current, addMessage])

  const fetchSummary = useCallback(async () => {
    if (summaryLoading) return
    setSummaryLoading(true)
    setError(null)
    try {
      const { data } = await aiService.summary({ forecast, current })
      addMessage('assistant', data.summary)
    } catch (err) {
      setError('Failed to generate summary. Check your AI API key.')
    } finally {
      setSummaryLoading(false)
    }
  }, [forecast, current, summaryLoading, addMessage])

  const clearChat = useCallback(() => {
    setMessages([])
    setInput('')
    setError(null)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  return {
    messages,
    input,
    setInput,
    loading,
    summaryLoading,
    error,
    sendMessage,
    fetchSummary,
    clearChat,
    handleKeyDown,
    hasWeatherData: !!(forecast || current),
  }
}