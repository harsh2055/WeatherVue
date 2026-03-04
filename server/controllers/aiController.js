/**
 * server/controllers/aiController.js
 *
 * AI-Powered Weather Assistant Controller
 * Integrates Google Gemini (primary) with OpenAI (fallback) to generate
 * conversational weather summaries and trip-planning advice.
 *
 * Install: npm install @google/generative-ai openai
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')
const OpenAI = require('openai').default

// ─── Client Initialization ────────────────────────────────────────────────────
// Lazily initialized so the server still boots if keys are missing in dev
let geminiClient = null
let openaiClient = null

function getGeminiClient() {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set.')
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return geminiClient
}

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set.')
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────
/**
 * Builds a structured system + user prompt from the forecast payload.
 * Keeping weather data in the system prompt saves tokens on follow-up turns.
 */
function buildMessages(forecast, current, userPrompt) {
  const city = current?.name ?? 'the selected location'
  const country = current?.sys?.country ?? ''

  // Serialize only the fields the LLM needs — avoids token waste
  const forecastSummary = forecast?.daily?.slice(0, 7).map((d, i) => ({
    day: i === 0 ? 'Today' : new Date(d.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
    tempHigh: `${Math.round(d.temp.max)}°C`,
    tempLow: `${Math.round(d.temp.min)}°C`,
    description: d.weather[0]?.description ?? 'unknown',
    precipChance: `${Math.round((d.pop ?? 0) * 100)}%`,
    humidity: `${d.humidity}%`,
    windSpeed: `${Math.round(d.wind_speed)} m/s`,
    uvIndex: d.uvi ?? 'N/A',
    summary: d.summary ?? '',
  })) ?? []

  const currentSummary = current
    ? {
        temp: `${Math.round(current.main?.temp)}°C`,
        feelsLike: `${Math.round(current.main?.feels_like)}°C`,
        description: current.weather?.[0]?.description,
        humidity: `${current.main?.humidity}%`,
        aqi: current.aqi ?? 'N/A',
        uvi: current.uvi ?? 'N/A',
      }
    : null

  const systemPrompt = `You are WeatherVue's friendly, expert meteorologist and travel advisor.
You have access to the following live weather data for ${city}${country ? ', ' + country : ''}:

CURRENT CONDITIONS:
${currentSummary ? JSON.stringify(currentSummary, null, 2) : 'Not available'}

7-DAY FORECAST:
${JSON.stringify(forecastSummary, null, 2)}

INSTRUCTIONS:
- Answer the user's question conversationally and helpfully.
- When giving advice about outdoor activities, factor in temperature, UV, precipitation, and wind.
- If the user asks about travel planning, mention specific days by name (e.g. "Wednesday looks ideal").
- Use markdown formatting: **bold** for key points, bullet lists for multiple items.
- Keep responses concise (under 250 words) unless the user asks for more detail.
- If asked something unrelated to weather or travel, politely redirect.
- Never fabricate data beyond what's provided.`

  return { systemPrompt, userPrompt }
}

// ─── LLM Dispatchers ─────────────────────────────────────────────────────────
async function queryGemini(systemPrompt, userPrompt, history = []) {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  })

  // Convert chat history to Gemini's format
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const chat = model.startChat({ history: geminiHistory })
  const result = await chat.sendMessage(userPrompt)
  return result.response.text()
}

async function queryOpenAI(systemPrompt, userPrompt, history = []) {
  const client = getOpenAIClient()
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userPrompt },
  ]

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 600,
    temperature: 0.7,
  })
  return response.choices[0].message.content
}

// ─── Controller ───────────────────────────────────────────────────────────────
const aiController = {
  /**
   * POST /api/ai/chat
   * Body: { forecast, current, userPrompt, history?, provider? }
   *
   * history: Array<{ role: 'user'|'assistant', content: string }>
   * provider: 'gemini' | 'openai' (defaults to gemini, falls back to openai)
   */
  async chat(req, res) {
    const { forecast, current, userPrompt, history = [], provider = 'gemini' } = req.body

    if (!userPrompt?.trim()) {
      return res.status(400).json({ error: 'userPrompt is required.' })
    }
    if (!forecast && !current) {
      return res.status(400).json({ error: 'At least one of forecast or current weather data is required.' })
    }

    // Validate history shape (prevent prompt injection via role manipulation)
    const safeHistory = (Array.isArray(history) ? history : [])
      .filter(h => ['user', 'assistant'].includes(h.role) && typeof h.content === 'string')
      .slice(-10) // Cap at last 10 messages for token efficiency

    try {
      const { systemPrompt, userPrompt: prompt } = buildMessages(forecast, current, userPrompt)

      let reply
      if (provider === 'openai') {
        reply = await queryOpenAI(systemPrompt, prompt, safeHistory)
      } else {
        // Try Gemini first, fall back to OpenAI
        try {
          reply = await queryGemini(systemPrompt, prompt, safeHistory)
        } catch (geminiErr) {
          console.warn('[AI] Gemini failed, falling back to OpenAI:', geminiErr.message)
          reply = await queryOpenAI(systemPrompt, prompt, safeHistory)
        }
      }

      res.json({ reply, provider: provider === 'openai' ? 'openai' : 'gemini' })
    } catch (err) {
      console.error('[AI] Chat error:', err.message)
      const status = err.status ?? 500
      res.status(status).json({
        error: 'AI service temporarily unavailable. Please try again.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      })
    }
  },

  /**
   * POST /api/ai/summary
   * Generates a one-shot structured daily summary (no chat history needed).
   * Body: { forecast, current }
   */
  async summary(req, res) {
    const { forecast, current } = req.body
    if (!forecast && !current) {
      return res.status(400).json({ error: 'Weather data is required.' })
    }

    const staticPrompt = `Give me a concise 3-sentence morning briefing for today's weather.
Then list the single best and worst outdoor activity window in the next 7 days with reasoning.
Finally, flag any health concerns (UV, AQI, storms) with one-line advice for each.
Format in clear sections with markdown headers.`

    try {
      const { systemPrompt } = buildMessages(forecast, current, staticPrompt)
      const reply = await queryGemini(systemPrompt, staticPrompt, [])
      res.json({ summary: reply })
    } catch (err) {
      console.error('[AI] Summary error:', err.message)
      res.status(500).json({ error: 'Failed to generate summary.' })
    }
  },
}

module.exports = { aiController }