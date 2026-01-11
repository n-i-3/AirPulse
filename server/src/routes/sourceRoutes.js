const express = require('express');
const router = express.Router();
const sourceController = require('../controllers/sourceController');

router.get('/', sourceController.getSourceAnalysis);
router.get('/wards', sourceController.getWardSourceAnalysis);
router.get('/interpolated', sourceController.getInterpolatedAQI);

module.exports = router;
