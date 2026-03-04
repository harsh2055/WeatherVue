const express = require('express')
const { authenticate } = require('../middleware/auth')
const { supabase } = require('../config/supabase')

const router = express.Router()

router.use(authenticate)

/** GET /api/preferences */
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
  res.json(data || {})
})

/** PUT /api/preferences */
router.put('/', async (req, res) => {
  const { unit, theme, email_briefing } = req.body
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: req.user.id, unit, theme, email_briefing, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
