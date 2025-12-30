const axios = require('axios');

// OpenWeather free tier - no key needed for basic data
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Get weather data for a location
 * @param {number} lat
 * @param {number} lng  
 * @returns {Promise<Object>} Weather data
 */
const getWeatherData = async (lat, lng) => {
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.warn('OPENWEATHER_API_KEY not set');
            return generateMockWeather(lat, lng);
        }

        const response = await axios.get(OPENWEATHER_URL, {
            params: {
                lat,
                lon: lng,
                appid: apiKey,
                units: 'metric'
            }
        });

        return {
            temp: response.data.main.temp,
            humidity: response.data.main.humidity,
            wind_speed: response.data.wind.speed,
            wind_deg: response.data.wind.deg,
            pressure: response.data.main.pressure,
            description: response.data.weather[0].description
        };
    } catch (error) {
        console.error('Weather API error:', error.message);
        return generateMockWeather(lat, lng);
    }
};

const generateMockWeather = (lat, lng) => {
    return {
        temp: 15 + Math.random() * 10,
        humidity: 40 + Math.random() * 40,
        wind_speed: 2 + Math.random() * 8,
        wind_deg: Math.random() * 360,
        pressure: 1010 + Math.random() * 20,
        description: 'partly cloudy'
    };
};

/**
 * Analyze if weather conditions contribute to pollution
 * @param {Object} weather Weather data
 * @returns {Object} Analysis
 */
const analyzeWeatherImpact = (weather) => {
    const factors = [];
    let severity = 'low';

    // Low wind speed traps pollutants
    if (weather.wind_speed < 3) {
        factors.push({
            factor: 'Low Wind Speed',
            impact: 'High',
            description: `Wind speed of ${weather.wind_speed.toFixed(1)} m/s insufficient for pollutant dispersion.`
        });
        severity = 'high';
    }

    // High humidity + pollution = smog
    if (weather.humidity > 75) {
        factors.push({
            factor: 'High Humidity',
            impact: 'Medium',
            description: `${weather.humidity}% humidity increases particulate matter absorption and smog formation.`
        });
        if (severity === 'low') severity = 'medium';
    }

    // Temperature inversion (proxy: low temp + high pressure)
    if (weather.temp < 15 && weather.pressure > 1020) {
        factors.push({
            factor: 'Temperature Inversion',
            impact: 'Critical',
            description: `Cold air trapped under warm layer - pollutants cannot escape.`
        });
        severity = 'critical';
    }

    return {
        factors,
        severity,
        wind_direction: getWindDirection(weather.wind_deg)
    };
};

const getWindDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
};

module.exports = {
    getWeatherData,
    analyzeWeatherImpact
};
