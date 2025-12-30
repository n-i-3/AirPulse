const firmsService = require('../services/firmsService');
const weatherService = require('../services/weatherService');
const waqiService = require('../services/waqiService');

/**
 * Get ward-wise pollution source analysis
 * GET /api/sources/wards?lat1=...&lng1=...&lat2=...&lng2=...
 */
const getWardSourceAnalysis = async (req, res) => {
    try {
        const { lat1, lng1, lat2, lng2 } = req.query;

        if (!lat1 || !lng1 || !lat2 || !lng2) {
            return res.status(400).json({ message: 'Bounds coordinates required' });
        }

        // Get all stations in bounds
        const stations = await waqiService.getAQIByBounds(lat1, lng1, lat2, lng2);

        // Get fire data
        const fires = await firmsService.getFireHotspots(lat1, lng1, lat2, lng2, 2);

        // Get weather for region center
        const centerLat = (parseFloat(lat1) + parseFloat(lat2)) / 2;
        const centerLng = (parseFloat(lng1) + parseFloat(lng2)) / 2;
        const weather = await weatherService.getWeatherData(centerLat, centerLng);
        const weatherImpact = weatherService.analyzeWeatherImpact(weather);

        // Analyze each station/ward
        const wardAnalysis = stations.map(station => {
            const aqi = parseInt(station.aqi);

            // Calculate proximity to fires
            const nearbyFires = fires.filter(fire => {
                const distance = calculateDistance(station.lat, station.lon, fire.lat, fire.lon);
                return distance < 100; // Within 100km
            });

            // Determine dominant source
            const sources = analyzeWardSources(aqi, nearbyFires, weather, station);

            // Generate recommendations
            const recommendations = generateWardRecommendations(aqi, sources, station);

            return {
                ward: station.station.name,
                lat: station.lat,
                lon: station.lon,
                aqi: aqi,
                level: getAQILevel(aqi),
                sources: sources,
                recommendations: recommendations,
                last_updated: station.station.time
            };
        });

        // Sort by AQI (worst first)
        wardAnalysis.sort((a, b) => b.aqi - a.aqi);

        res.json({
            total_wards: wardAnalysis.length,
            critical_count: wardAnalysis.filter(w => w.aqi > 200).length,
            wards: wardAnalysis,
            regional_weather: {
                wind: weatherImpact.wind_direction,
                speed: weather.wind_speed,
                factors: weatherImpact.factors
            },
            regional_fires: {
                total: fires.length,
                high_confidence: fires.filter(f => f.confidence === 'high').length
            }
        });
    } catch (error) {
        console.error('Ward source analysis error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function analyzeWardSources(aqi, nearbyFires, weather, station) {
    const sources = [];

    // Fire contribution
    if (nearbyFires.length > 0) {
        sources.push({
            type: 'agricultural_burning',
            contribution: nearbyFires.length > 5 ? 'high' : 'medium',
            details: `${nearbyFires.length} fire hotspots within 100km`,
            confidence: 'high'
        });
    }

    // Weather contribution
    if (weather.wind_speed < 3) {
        sources.push({
            type: 'meteorological',
            contribution: 'high',
            details: `Low wind speed (${weather.wind_speed.toFixed(1)} m/s) trapping pollutants`,
            confidence: 'high'
        });
    }

    // Traffic (time-based)
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
        sources.push({
            type: 'vehicular',
            contribution: 'high',
            details: 'Rush hour traffic emissions',
            confidence: 'medium'
        });
    } else {
        sources.push({
            type: 'vehicular',
            contribution: 'medium',
            details: 'Baseline traffic emissions',
            confidence: 'medium'
        });
    }

    // Industrial (baseline)
    sources.push({
        type: 'industrial',
        contribution: 'low',
        details: 'Urban-industrial baseline',
        confidence: 'low'
    });

    return sources;
}

function generateWardRecommendations(aqi, sources, station) {
    const recommendations = {
        for_citizens: [],
        for_government: [],
        health_advisory: '',
        priority: 'low'
    };

    if (aqi > 300) {
        recommendations.priority = 'critical';
        recommendations.health_advisory = 'Hazardous - Stay indoors, use air purifiers, N95 masks mandatory outdoors';
        recommendations.for_citizens = [
            'Avoid all outdoor activities',
            'Keep windows/doors sealed',
            'Use HEPA air purifiers',
            'Wear N95/N99 masks if going out is essential',
            'Monitor children and elderly closely'
        ];
        recommendations.for_government = [
            'Declare public health emergency',
            'Implement GRAP-IV immediately',
            'Ban all non-essential vehicles',
            'Halt construction activities',
            'Mandate work-from-home',
            'Deploy mobile air purification units',
            'Increase public transit frequency by 50%'
        ];
    } else if (aqi > 200) {
        recommendations.priority = 'high';
        recommendations.health_advisory = 'Very Unhealthy - Limit outdoor exposure, vulnerable groups stay indoors';
        recommendations.for_citizens = [
            'Minimize outdoor activities',
            'Use N95 masks outdoors',
            'Avoid strenuous exercise',
            'Keep vulnerable individuals indoors',
            'Use air purifiers at home'
        ];
        recommendations.for_government = [
            'Activate GRAP-III protocols',
            'Restrict BS-III petrol, BS-IV diesel vehicles',
            'Implement odd-even if AQI persists >250',
            'Intensify road dust control (water spraying)',
            'Increase parking fees to discourage private vehicles',
            'Issue school closure advisory'
        ];
    } else if (aqi > 150) {
        recommendations.priority = 'medium';
        recommendations.health_advisory = 'Unhealthy - Sensitive groups should limit prolonged outdoor exposure';
        recommendations.for_citizens = [
            'Reduce prolonged/heavy outdoor exertion',
            'Sensitive groups use masks',
            'Close windows during peak pollution hours',
            'Consider indoor exercise'
        ];
        recommendations.for_government = [
            'Activate GRAP-II measures',
            'Increase mechanical road sweeping',
            'Enforce construction dust control norms',
            'Monitor industrial compliance strictly',
            'Increase public awareness campaigns'
        ];
    } else if (aqi > 100) {
        recommendations.priority = 'low';
        recommendations.health_advisory = 'Moderate - Unusually sensitive people should consider limiting prolonged outdoor exertion';
        recommendations.for_citizens = [
            'Unusually sensitive individuals limit prolonged exertion',
            'Monitor daily AQI updates',
            'Consider carpooling/public transit'
        ];
        recommendations.for_government = [
            'Continue standard monitoring',
            'Enforce vehicle emission checks',
            'Maintain construction dust norms',
            'Promote public transit usage'
        ];
    } else {
        recommendations.priority = 'low';
        recommendations.health_advisory = 'Good - Air quality is satisfactory';
        recommendations.for_citizens = [
            'Continue normal activities',
            'Maintain awareness of AQI trends'
        ];
        recommendations.for_government = [
            'Continue preventive measures',
            'Maintain monitoring infrastructure',
            'Plan for seasonal pollution spikes'
        ];
    }

    // Add source-specific recommendations
    sources.forEach(source => {
        if (source.type === 'agricultural_burning' && source.contribution === 'high') {
            recommendations.for_government.push('Deploy rapid response teams to fire-affected upwind areas');
            recommendations.for_government.push('Coordinate with neighboring states on stubble burning enforcement');
        }
        if (source.type === 'meteorological' && source.contribution === 'high') {
            recommendations.for_government.push('Issue smog alert - weather conditions unfavorable for dispersion');
        }
    });

    return recommendations;
}

function getAQILevel(aqi) {
    if (aqi > 300) return 'Hazardous';
    if (aqi > 200) return 'Very Unhealthy';
    if (aqi > 150) return 'Unhealthy';
    if (aqi > 100) return 'Unhealthy for Sensitive Groups';
    if (aqi > 50) return 'Moderate';
    return 'Good';
}

/**
 * Get pollution source analysis for a region
 * GET /api/sources?lat1=...&lng1=...&lat2=...&lng2=...
 */
const getSourceAnalysis = async (req, res) => {
    try {
        const { lat1, lng1, lat2, lng2 } = req.query;

        if (!lat1 || !lng1 || !lat2 || !lng2) {
            return res.status(400).json({ message: 'Bounds coordinates required' });
        }

        // Fetch fire data
        const fires = await firmsService.getFireHotspots(lat1, lng1, lat2, lng2, 2);

        // Get weather for region center
        const centerLat = (parseFloat(lat1) + parseFloat(lat2)) / 2;
        const centerLng = (parseFloat(lng1) + parseFloat(lng2)) / 2;
        const weather = await weatherService.getWeatherData(centerLat, centerLng);
        const weatherImpact = weatherService.analyzeWeatherImpact(weather);

        // Calculate source contributions
        const sources = {
            stubble_burning: {
                detected: fires.length > 0,
                count: fires.length,
                contribution: fires.length > 10 ? 'high' : fires.length > 3 ? 'medium' : 'low',
                hotspots: fires.slice(0, 10),
                confidence: fires.length > 0 ? 'high' : 'none'
            },
            meteorological: {
                detected: weatherImpact.factors.length > 0,
                factors: weatherImpact.factors,
                contribution: weatherImpact.severity,
                wind: {
                    speed: weather.wind_speed,
                    direction: weatherImpact.wind_direction
                },
                confidence: 'high'
            },
            traffic: {
                detected: true,
                contribution: isRushHour() ? 'high' : 'medium',
                peak_hours: ['8-10 AM', '6-8 PM'],
                confidence: 'medium'
            },
            industrial: {
                detected: true,
                contribution: 'medium',
                confidence: 'low'
            }
        };

        res.json(sources);
    } catch (error) {
        console.error('Source analysis error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const isRushHour = () => {
    const hour = new Date().getHours();
    return (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20);
};

module.exports = {
    getSourceAnalysis,
    getWardSourceAnalysis
};
