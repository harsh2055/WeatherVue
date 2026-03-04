const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

/**
 * Sends the daily morning weather briefing email.
 * @param {string} to        - Recipient email address
 * @param {string} name      - Recipient name (optional)
 * @param {object} weather   - Current weather object from OWM
 * @param {object} forecast  - Forecast object from OWM One Call
 */
async function sendDailyBriefing(to, name, weather, forecast) {
  const todayForecast = forecast?.daily?.[0]
  const icon = weather.weather[0].description
  const temp = Math.round(weather.main.temp)
  const tempMax = todayForecast ? Math.round(todayForecast.temp.max) : '–'
  const tempMin = todayForecast ? Math.round(todayForecast.temp.min) : '–'
  const humidity = weather.main.humidity
  const city = weather.name

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f1f5f9; padding: 24px; color: #1e293b;">
    <div style="max-width: 540px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08);">
      <div style="background: linear-gradient(135deg, #1e3a5f, #3b82f6); padding: 32px 28px; color: white;">
        <p style="margin:0; font-size:13px; opacity:.75">🌤️ WeatherVue Daily Briefing</p>
        <h1 style="margin:8px 0 4px; font-size:26px;">Good Morning${name ? ', ' + name : ''}!</h1>
        <p style="margin:0; font-size:14px; opacity:.85">Here's your weather summary for today</p>
      </div>
      <div style="padding: 24px 28px;">
        <h2 style="margin:0 0 16px; font-size:20px;">📍 ${city}</h2>
        <div style="background:#f8fafc; border-radius:12px; padding:20px; margin-bottom:20px;">
          <p style="margin:0 0 8px; font-size:32px; font-weight:700;">${temp}°C</p>
          <p style="margin:0; text-transform:capitalize; color:#64748b;">${icon}</p>
          <div style="margin-top:12px; display:flex; gap:16px; font-size:13px; color:#475569;">
            <span>↑ ${tempMax}°C</span>
            <span>↓ ${tempMin}°C</span>
            <span>💧 ${humidity}%</span>
          </div>
        </div>
        ${todayForecast?.summary ? `<p style="font-size:14px; color:#475569; border-left: 3px solid #3b82f6; padding-left:12px;">${todayForecast.summary}</p>` : ''}
        <p style="font-size:12px; color:#94a3b8; margin-top:24px; text-align:center;">
          You're receiving this because you enabled Daily Briefings in WeatherVue Settings.<br>
          <a href="#" style="color:#3b82f6;">Unsubscribe</a>
        </p>
      </div>
    </div>
  </body>
  </html>`

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'WeatherVue <noreply@weathervue.app>',
    to,
    subject: `🌤️ Your WeatherVue Morning Briefing — ${city}, ${temp}°C`,
    html,
  })
}

module.exports = { sendDailyBriefing }
