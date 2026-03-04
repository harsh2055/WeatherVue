const express = require('express')
const { authenticate } = require('../middleware/auth')
const { sql } = require('../config/db')

const router = express.Router()
router.use(authenticate)

/** GET /api/locations/favorites */
router.get('/favorites', async (req, res) => {
  try {
    const data = await sql`SELECT * FROM saved_locations WHERE user_id = ${req.user.id} ORDER BY created_at DESC`
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/** POST /api/locations/favorites */
router.post('/favorites', async (req, res) => {
  const { city } = req.body
  if (!city?.trim()) return res.status(400).json({ error: 'city is required.' })
  try {
    const [data] = await sql`
      INSERT INTO saved_locations (user_id, city_name)
      VALUES (${req.user.id}, ${city.trim()})
      ON CONFLICT (user_id, city_name) DO NOTHING
      RETURNING *`
    if (!data) return res.status(409).json({ error: 'City already saved.' })
    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/** DELETE /api/locations/favorites/:id */
router.delete('/favorites/:id', async (req, res) => {
  try {
    const [deleted] = await sql`
      DELETE FROM saved_locations
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING *`
    if (!deleted) return res.status(404).json({ error: 'Location not found.' })
    res.json({ deleted: true, id: req.params.id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
