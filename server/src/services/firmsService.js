const axios = require('axios');

const FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
const FIRMS_MAP_KEY = '7e88d64cf1d79332fda99a35d5e26502'; // Public demo key

/**
 * Fetch active fire data from NASA FIRMS for a region
 * @param {number} lat1 South-West Lat
 * @param {number} lng1 South-West Lng
 * @param {number} lat2 North-East Lat
 * @param {number} lng2 North-East Lng
 * @param {number} dayRange Number of days back to check (1-10)
 * @returns {Promise<Array>} Fire hotspots
 */
const getFireHotspots = async (lat1, lng1, lat2, lng2, dayRange = 1) => {
    try {
        // FIRMS API format: /api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{bbox}/{dayRange}
        const bbox = `${lng1},${lat1},${lng2},${lat2}`;
        const url = `${FIRMS_BASE_URL}/${FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/${bbox}/${dayRange}`;

        const response = await axios.get(url);

        if (!response.data) return [];

        // Parse CSV response
        const lines = response.data.trim().split('\n');
        if (lines.length < 2) return []; // No data

        const headers = lines[0].split(',');
        const fires = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const fire = {
                lat: parseFloat(values[0]),
                lon: parseFloat(values[1]),
                brightness: parseFloat(values[2]),
                confidence: values[8],
                frp: parseFloat(values[10]), // Fire Radiative Power
                acq_date: values[5],
                acq_time: values[6]
            };
            fires.push(fire);
        }

        return fires;
    } catch (error) {
        console.error('FIRMS API error:', error.message);
        return [];
    }
};

module.exports = {
    getFireHotspots
};
