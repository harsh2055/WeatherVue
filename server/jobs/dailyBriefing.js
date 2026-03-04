const cron = require('node-cron')
const { supabase } = require('../config/supabase')
const { owmService } = require('../services/owmService')
const { sendDailyBriefing } = require('../services/emailService')

/**
 * Runs every day at 7:00 AM server time.
 * Fetches all users who opted in for email_briefing = true,
 * gets weather for their first saved location, and emails the briefing.
 */
cron.schedule('0 7 * * *', async () => {
  console.log('[Cron] Running daily briefing job at', new Date().toISOString())

  try {
    // Fetch all users who opted in
    const { data: prefs, error } = await supabase
      .from('user_preferences')
      .select('user_id, unit')
      .eq('email_briefing', true)

    if (error) throw error
    if (!prefs?.length) return console.log('[Cron] No opted-in users.')

    for (const pref of prefs) {
      try {
        // Get user email from auth.users via admin API
        const { data: { user } } = await supabase.auth.admin.getUserById(pref.user_id)
        if (!user?.email) continue

        // Get their first saved city
        const { data: locations } = await supabase
          .from('saved_locations')
          .select('city_name')
          .eq('user_id', pref.user_id)
          .order('created_at', { ascending: true })
          .limit(1)

        const city = locations?.[0]?.city_name
        if (!city) continue

        // Fetch weather
        const weather  = await owmService.getCurrentByCity(city)
        const forecast = await owmService.getForecast(weather.coord.lat, weather.coord.lon)

        // Send email
        await sendDailyBriefing(user.email, '', weather, forecast)
        console.log(`[Cron] Briefing sent to ${user.email} for ${city}`)

      } catch (err) {
        console.error(`[Cron] Failed for user ${pref.user_id}:`, err.message)
      }
    }

    console.log('[Cron] Daily briefing job complete.')
  } catch (err) {
    console.error('[Cron] Job failed:', err.message)
  }
}, {
  timezone: 'UTC' // adjust to your preferred timezone
})

console.log('[Cron] Daily briefing job scheduled for 07:00 UTC every day.')
