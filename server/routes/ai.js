const express = require('express')
const rateLimit = require('express-rate-limit')
const { aiController } = require('../controllers/aiController')

const router = express.Router()

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a moment before trying again.' },
  validate: { xForwardedForHeader: false },
})

router.use(aiRateLimit)
router.post('/chat',    aiController.chat)
router.post('/summary', aiController.summary)

module.exports = router
