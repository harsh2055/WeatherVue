/**
 * client/src/components/ai/WeatherAssistant.jsx
 *
 * AI-Powered Weather Assistant — chat-style UI component.
 *
 * Usage in any page:
 *   import WeatherAssistant from '../components/ai/WeatherAssistant'
 *   <WeatherAssistant />
 *
 * The component reads forecast + current from WeatherContext automatically.
 */

import { useEffect, useRef } from 'react'
import { useWeather } from '../../context/WeatherContext'
import { useAIChat, SUGGESTED_PROMPTS } from '../../hooks/useAIChat'

// ─── Markdown Renderer ────────────────────────────────────────────────────────
// Lightweight inline markdown — avoids pulling in a full markdown library.
function renderMarkdown(text) {
  if (!text) return ''
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs font-mono">$1</code>')
    // Headers
    .replace(/^### (.*$)/gm, '<h4 class="font-semibold mt-3 mb-1 text-sm">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold mt-4 mb-2">$1</h3>')
    // Bullet list items
    .replace(/^[•\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-1 my-2">$&</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const time = message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 animate-fade-in">
        <div className="max-w-[80%]">
          <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
            {message.content}
          </div>
          <p className="text-xs text-slate-400 text-right mt-1">{time}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-sm flex-shrink-0">
          👤
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
        🤖
      </div>
      <div className="max-w-[85%]">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
          <p
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm flex-shrink-0">
        🤖
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onSuggest, onSummary, summaryLoading, hasData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
        🤖
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-white">WeatherVue Assistant</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {hasData
            ? 'Ask me anything about the current forecast.'
            : 'Search for a city first to activate the assistant.'}
        </p>
      </div>

      {hasData && (
        <>
          <button
            onClick={onSummary}
            disabled={summaryLoading}
            className="btn-primary text-sm flex items-center gap-2 w-full max-w-xs justify-center"
          >
            {summaryLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <> ✨ Generate Daily Briefing</>
            )}
          </button>

          <div className="w-full max-w-sm space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Try asking</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_PROMPTS.slice(0, 4).map(prompt => (
                <button
                  key={prompt}
                  onClick={() => onSuggest(prompt)}
                  className="text-left text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 rounded-xl px-3 py-2 transition-colors border border-slate-100 dark:border-slate-700"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WeatherAssistant() {
  const { forecast, current } = useWeather()
  const {
    messages, input, setInput, loading, summaryLoading, error,
    sendMessage, fetchSummary, clearChat, handleKeyDown, hasWeatherData,
  } = useAIChat({ forecast, current })

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="card p-0 overflow-hidden flex flex-col" style={{ height: '540px' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">🤖</div>
          <div>
            <h3 className="font-semibold text-white text-sm">WeatherVue Assistant</h3>
            <p className="text-blue-200 text-xs">
              {hasWeatherData ? `AI-powered • ${current?.name ?? 'Weather analysis'}` : 'Search a city to begin'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-blue-200 hover:text-white text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
          <EmptyState
            onSuggest={sendMessage}
            onSummary={fetchSummary}
            summaryLoading={summaryLoading}
            hasData={hasWeatherData}
          />
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}

        {loading && <TypingIndicator />}

        {error && (
          <div className="flex justify-center animate-fade-in">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2 max-w-[90%] text-center border border-red-100 dark:border-red-800">
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* Suggested prompts strip */}
        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading || !hasWeatherData}
                className="whitespace-nowrap text-xs bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-300 rounded-full px-3 py-1.5 transition-colors flex-shrink-0 disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasWeatherData ? 'Ask about the forecast, activities, travel...' : 'Search for a city first...'}
            disabled={!hasWeatherData || loading}
            rows={1}
            className="input flex-1 resize-none leading-relaxed py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !hasWeatherData}
            className="btn-primary px-4 py-2 self-end disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}