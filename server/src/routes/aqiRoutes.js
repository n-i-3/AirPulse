const express = require('express');
const router = express.Router();
const aqiController = require('../controllers/aqiController');

router.get('/', aqiController.getAQI);
router.get('/bounds', aqiController.getAQIByBounds);

module.exports = router;
