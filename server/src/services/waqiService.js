const axios = require('axios');

const WAQI_BASE_URL = 'https://api.waqi.info/feed';
const WAQI_MAP_URL = 'https://api.waqi.info/map/bounds';

/**
 * Fetch AQI data for a specific location (lat, lng)
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<Object>} AQI Data
 */
const getAQIByLocation = async (lat, lng) => {
    try {
        const token = process.env.WAQI_TOKEN;
        if (!token) {
            console.warn('WAQI_TOKEN not set, returning mock data');
            return { aqi: Math.floor(Math.random() * 300) + 50 }; // Mock for dev
        }

        const response = await axios.get(`${WAQI_BASE_URL}/geo:${lat};${lng}/?token=${token}`);

        if (response.data.status !== 'ok') {
            throw new Error(response.data.data);
        }

        return response.data.data;
    } catch (error) {
        console.error('Error fetching WAQI data:', error.message);
        throw error;
    }
};

/**
 * Fetch all stations within geographic bounds
 * @param {number} lat1 South-West Lat
 * @param {number} lng1 South-West Lng
 * @param {number} lat2 North-East Lat
 * @param {number} lng2 North-East Lng
 * @returns {Promise<Array>} List of stations with AQI
 */
const getAQIByBounds = async (lat1, lng1, lat2, lng2) => {
    try {
        const token = process.env.WAQI_TOKEN;
        if (!token) return [];

        // WAQI expects latlng={lat1},{lng1},{lat2},{lng2}
        const response = await axios.get(`${WAQI_MAP_URL}/?latlng=${lat1},${lng1},${lat2},${lng2}&token=${token}`);

        if (response.data.status !== 'ok') {
            throw new Error(response.data.data);
        }

        return response.data.data;
    } catch (error) {
        console.error('Error fetching WAQI bounds data:', error.message);
        return [];
    }
};

module.exports = {
    getAQIByLocation,
    getAQIByBounds
};
