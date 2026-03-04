const express = require('express')
const { weatherController } = require('../controllers/weatherController')

const router = express.Router()

router.get('/current',    weatherController.getCurrent)
router.get('/forecast',   weatherController.getForecast)
router.get('/historical', weatherController.getHistorical)
router.get('/alerts',     weatherController.getAlerts)

module.exports = router
