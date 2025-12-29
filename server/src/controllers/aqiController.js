const waqiService = require('../services/waqiService');

/**
 * Get AQI for a ward/location
 * GET /api/aqi?lat=...&lng=...
 */
const getAQI = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const data = await waqiService.getAQIByLocation(lat, lng);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Get AQI for all stations in bounds
 * GET /api/aqi/bounds?lat1=...&lng1=...&lat2=...&lng2=...
 */
const getAQIByBounds = async (req, res) => {
    try {
        const { lat1, lng1, lat2, lng2 } = req.query;

        if (!lat1 || !lng1 || !lat2 || !lng2) {
            return res.status(400).json({ message: 'Bounds coordinates required' });
        }

        const data = await waqiService.getAQIByBounds(lat1, lng1, lat2, lng2);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAQI,
    getAQIByBounds
};
