/**
 * Inverse Distance Weighting (IDW) Interpolation Service
 * Calculates estimated AQI for locations without physical stations
 */

/**
 * Haversine distance between two points in km
 */
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

/**
 * Inverse Distance Weighting calculation
 * @param {number} targetLat - Target location latitude
 * @param {number} targetLon - Target location longitude
 * @param {Array} stations - Array of stations with lat, lon, aqi
 * @param {number} power - IDW power parameter (default 2, higher = more local influence)
 * @param {number} maxDistance - Maximum distance in km to consider (default 20km)
 * @returns {Object} { aqi, stationsUsed, avgDistance, confidence }
 */
function calculateIDW(targetLat, targetLon, stations, power = 2, maxDistance = 20) {
    // Filter stations within maxDistance
    const nearbyStations = stations
        .map(station => {
            const aqi = parseInt(station.aqi);
            if (isNaN(aqi) || aqi < 0) return null;

            const distance = calculateDistance(targetLat, targetLon, station.lat, station.lon);
            return {
                ...station,
                aqi,
                distance
            };
        })
        .filter(s => s !== null && s.distance <= maxDistance && s.distance > 0);

    // If no stations nearby, return null
    if (nearbyStations.length === 0) {
        return null;
    }

    // Check if target is exactly at a station (distance ~0)
    const exactMatch = nearbyStations.find(s => s.distance < 0.1); // Within 100m
    if (exactMatch) {
        return {
            aqi: exactMatch.aqi,
            stationsUsed: 1,
            avgDistance: 0,
            confidence: 100,
            method: 'direct',
            nearestStation: exactMatch.station?.name || 'Unknown'
        };
    }

    // Calculate IDW
    let weightedSum = 0;
    let weightSum = 0;

    nearbyStations.forEach(station => {
        const weight = 1 / Math.pow(station.distance, power);
        weightedSum += station.aqi * weight;
        weightSum += weight;
    });

    const interpolatedAqi = Math.round(weightedSum / weightSum);

    // Calculate average distance for confidence
    const avgDistance = nearbyStations.reduce((sum, s) => sum + s.distance, 0) / nearbyStations.length;

    // Confidence decreases with distance and increases with station count
    // Max confidence 95% (since it's interpolated, not measured)
    const distanceFactor = Math.max(0, 1 - (avgDistance / maxDistance));
    const countFactor = Math.min(nearbyStations.length / 5, 1); // More stations = better
    const confidence = Math.round((distanceFactor * 0.6 + countFactor * 0.4) * 95);

    return {
        aqi: interpolatedAqi,
        stationsUsed: nearbyStations.length,
        avgDistance: Math.round(avgDistance * 10) / 10,
        confidence,
        method: 'idw',
        nearestStation: nearbyStations.sort((a, b) => a.distance - b.distance)[0]?.station?.name || 'Unknown'
    };
}

/**
 * Major Delhi NCR locality centers for interpolation
 * 200+ localities covering all areas of Delhi NCR
 */
const DELHI_LOCALITIES = [
    // ===== CENTRAL DELHI =====
    { name: 'Connaught Place', lat: 28.6315, lon: 77.2167 },
    { name: 'India Gate', lat: 28.6129, lon: 77.2295 },
    { name: 'Chandni Chowk', lat: 28.6506, lon: 77.2303 },
    { name: 'Karol Bagh', lat: 28.6514, lon: 77.1907 },
    { name: 'Paharganj', lat: 28.6436, lon: 77.2153 },
    { name: 'Daryaganj', lat: 28.6389, lon: 77.2403 },
    { name: 'Rajendra Place', lat: 28.6424, lon: 77.1787 },
    { name: 'Patel Nagar', lat: 28.6559, lon: 77.1551 },
    { name: 'Minto Road', lat: 28.6284, lon: 77.2324 },
    { name: 'ITO', lat: 28.6289, lon: 77.2405 },
    { name: 'Kashmere Gate', lat: 28.6675, lon: 77.2282 },
    { name: 'Jama Masjid', lat: 28.6507, lon: 77.2334 },
    { name: 'Red Fort', lat: 28.6562, lon: 77.2410 },
    { name: 'Chawri Bazar', lat: 28.6485, lon: 77.2261 },
    { name: 'Sadar Bazar', lat: 28.6600, lon: 77.2015 },

    // ===== SOUTH DELHI =====
    { name: 'Saket', lat: 28.5245, lon: 77.2066 },
    { name: 'Hauz Khas', lat: 28.5494, lon: 77.2001 },
    { name: 'Greater Kailash I', lat: 28.5355, lon: 77.2428 },
    { name: 'Greater Kailash II', lat: 28.5290, lon: 77.2485 },
    { name: 'Lajpat Nagar', lat: 28.5677, lon: 77.2433 },
    { name: 'Defence Colony', lat: 28.5743, lon: 77.2319 },
    { name: 'Nehru Place', lat: 28.5491, lon: 77.2533 },
    { name: 'Okhla', lat: 28.5308, lon: 77.2713 },
    { name: 'Okhla Phase I', lat: 28.5350, lon: 77.2720 },
    { name: 'Okhla Phase II', lat: 28.5290, lon: 77.2780 },
    { name: 'Kalkaji', lat: 28.5365, lon: 77.2588 },
    { name: 'Malviya Nagar', lat: 28.5331, lon: 77.2110 },
    { name: 'Vasant Kunj', lat: 28.5207, lon: 77.1558 },
    { name: 'Vasant Vihar', lat: 28.5617, lon: 77.1596 },
    { name: 'Green Park', lat: 28.5597, lon: 77.2047 },
    { name: 'Safdarjung', lat: 28.5680, lon: 77.2020 },
    { name: 'South Extension I', lat: 28.5712, lon: 77.2230 },
    { name: 'South Extension II', lat: 28.5680, lon: 77.2260 },
    { name: 'Chittaranjan Park', lat: 28.5380, lon: 77.2490 },
    { name: 'East of Kailash', lat: 28.5530, lon: 77.2510 },
    { name: 'Jangpura', lat: 28.5830, lon: 77.2430 },
    { name: 'Nizamuddin', lat: 28.5920, lon: 77.2500 },
    { name: 'Lodhi Colony', lat: 28.5910, lon: 77.2220 },
    { name: 'Jor Bagh', lat: 28.5930, lon: 77.2150 },
    { name: 'Mehrauli', lat: 28.5182, lon: 77.1780 },
    { name: 'Qutub Minar', lat: 28.5244, lon: 77.1855 },
    { name: 'Chhatarpur', lat: 28.5070, lon: 77.1750 },
    { name: 'Sainik Farm', lat: 28.5080, lon: 77.2110 },
    { name: 'Fateh Nagar', lat: 28.5050, lon: 77.2350 },
    { name: 'Sangam Vihar', lat: 28.5020, lon: 77.2480 },
    { name: 'Tigri', lat: 28.5090, lon: 77.2580 },
    { name: 'Tughlakabad', lat: 28.5150, lon: 77.2620 },
    { name: 'Badarpur', lat: 28.5080, lon: 77.3040 },
    { name: 'Sarita Vihar', lat: 28.5310, lon: 77.2900 },
    { name: 'Jasola', lat: 28.5450, lon: 77.2820 },
    { name: 'Shaheen Bagh', lat: 28.5540, lon: 77.2920 },
    { name: 'Jamia Nagar', lat: 28.5620, lon: 77.2830 },
    { name: 'Zakir Nagar', lat: 28.5570, lon: 77.2790 },

    // ===== NORTH DELHI =====
    { name: 'Rohini Sector 1', lat: 28.7495, lon: 77.0565 },
    { name: 'Rohini Sector 3', lat: 28.7310, lon: 77.0680 },
    { name: 'Rohini Sector 7', lat: 28.7150, lon: 77.0750 },
    { name: 'Rohini Sector 11', lat: 28.7020, lon: 77.0890 },
    { name: 'Rohini Sector 14', lat: 28.7280, lon: 77.1050 },
    { name: 'Rohini Sector 16', lat: 28.7320, lon: 77.1180 },
    { name: 'Rohini Sector 22', lat: 28.7410, lon: 77.0520 },
    { name: 'Pitampura', lat: 28.7041, lon: 77.1316 },
    { name: 'Model Town', lat: 28.7136, lon: 77.1894 },
    { name: 'Civil Lines', lat: 28.6814, lon: 77.2226 },
    { name: 'Azadpur', lat: 28.7136, lon: 77.1777 },
    { name: 'Shalimar Bagh', lat: 28.7160, lon: 77.1550 },
    { name: 'Wazirpur', lat: 28.6950, lon: 77.1630 },
    { name: 'Ashok Vihar', lat: 28.6910, lon: 77.1770 },
    { name: 'Adarsh Nagar', lat: 28.7200, lon: 77.1700 },
    { name: 'GTB Nagar', lat: 28.6980, lon: 77.2080 },
    { name: 'Mukherjee Nagar', lat: 28.7050, lon: 77.2100 },
    { name: 'Shakti Nagar', lat: 28.6750, lon: 77.2050 },
    { name: 'Kamla Nagar', lat: 28.6850, lon: 77.2080 },
    { name: 'Roop Nagar', lat: 28.6780, lon: 77.1950 },
    { name: 'Timarpur', lat: 28.6980, lon: 77.2220 },
    { name: 'Burari', lat: 28.7550, lon: 77.1980 },
    { name: 'Jahangirpuri', lat: 28.7320, lon: 77.1730 },
    { name: 'Narela', lat: 28.8530, lon: 77.0920 },
    { name: 'Alipur', lat: 28.7970, lon: 77.1350 },
    { name: 'Bawana', lat: 28.7980, lon: 77.0480 },
    { name: 'Samaypur Badli', lat: 28.7450, lon: 77.1350 },
    { name: 'Badli', lat: 28.7380, lon: 77.1420 },
    { name: 'Sultanpuri', lat: 28.7100, lon: 77.0680 },
    { name: 'Mangolpuri', lat: 28.7050, lon: 77.0580 },
    { name: 'Bhalswa', lat: 28.7420, lon: 77.1620 },

    // ===== EAST DELHI =====
    { name: 'Anand Vihar', lat: 28.6469, lon: 77.3164 },
    { name: 'Preet Vihar', lat: 28.6382, lon: 77.2941 },
    { name: 'Laxmi Nagar', lat: 28.6304, lon: 77.2772 },
    { name: 'Mayur Vihar Phase I', lat: 28.6093, lon: 77.2988 },
    { name: 'Mayur Vihar Phase II', lat: 28.6150, lon: 77.3100 },
    { name: 'Mayur Vihar Phase III', lat: 28.6050, lon: 77.3200 },
    { name: 'Patparganj', lat: 28.6234, lon: 77.2873 },
    { name: 'Shahdara', lat: 28.6731, lon: 77.2878 },
    { name: 'Vivek Vihar', lat: 28.6720, lon: 77.3150 },
    { name: 'Dilshad Garden', lat: 28.6800, lon: 77.3180 },
    { name: 'Seemapuri', lat: 28.6920, lon: 77.3250 },
    { name: 'Nand Nagri', lat: 28.6950, lon: 77.3100 },
    { name: 'Mandawali', lat: 28.6350, lon: 77.3050 },
    { name: 'Geeta Colony', lat: 28.6580, lon: 77.2720 },
    { name: 'Gandhi Nagar', lat: 28.6520, lon: 77.2680 },
    { name: 'Krishna Nagar', lat: 28.6580, lon: 77.2850 },
    { name: 'Jhilmil', lat: 28.6700, lon: 77.3050 },
    { name: 'Trilokpuri', lat: 28.6110, lon: 77.3100 },
    { name: 'Kondli', lat: 28.6050, lon: 77.3250 },
    { name: 'Khichripur', lat: 28.6180, lon: 77.3150 },
    { name: 'Harsh Vihar', lat: 28.7020, lon: 77.3080 },
    { name: 'Seelampur', lat: 28.6650, lon: 77.2650 },
    { name: 'Welcome', lat: 28.6730, lon: 77.2780 },
    { name: 'Jyoti Nagar', lat: 28.6650, lon: 77.2770 },
    { name: 'Jafrabad', lat: 28.6770, lon: 77.2720 },
    { name: 'Maujpur', lat: 28.6820, lon: 77.2750 },
    { name: 'Gokulpuri', lat: 28.6980, lon: 77.2880 },
    { name: 'Shastri Park', lat: 28.6730, lon: 77.2550 },
    { name: 'IP Extension', lat: 28.6280, lon: 77.3050 },
    { name: 'New Ashok Nagar', lat: 28.5950, lon: 77.3100 },
    { name: 'Vasundhara Enclave', lat: 28.6100, lon: 77.3300 },

    // ===== WEST DELHI =====
    { name: 'Dwarka Sector 1', lat: 28.5823, lon: 77.0500 },
    { name: 'Dwarka Sector 3', lat: 28.5920, lon: 77.0450 },
    { name: 'Dwarka Sector 6', lat: 28.5780, lon: 77.0680 },
    { name: 'Dwarka Sector 7', lat: 28.5750, lon: 77.0750 },
    { name: 'Dwarka Sector 10', lat: 28.5850, lon: 77.0580 },
    { name: 'Dwarka Sector 12', lat: 28.5920, lon: 77.0350 },
    { name: 'Dwarka Sector 14', lat: 28.5950, lon: 77.0280 },
    { name: 'Dwarka Sector 21', lat: 28.5520, lon: 77.0580 },
    { name: 'Dwarka Sector 22', lat: 28.5480, lon: 77.0650 },
    { name: 'Dwarka Sector 23', lat: 28.5550, lon: 77.0720 },
    { name: 'Janakpuri', lat: 28.6219, lon: 77.0878 },
    { name: 'Uttam Nagar', lat: 28.6203, lon: 77.0621 },
    { name: 'Vikaspuri', lat: 28.6405, lon: 77.0693 },
    { name: 'Tilak Nagar', lat: 28.6408, lon: 77.0994 },
    { name: 'Subhash Nagar', lat: 28.6450, lon: 77.1150 },
    { name: 'Rajouri Garden', lat: 28.6469, lon: 77.1227 },
    { name: 'Tagore Garden', lat: 28.6510, lon: 77.1130 },
    { name: 'Kirti Nagar', lat: 28.6530, lon: 77.1450 },
    { name: 'Moti Nagar', lat: 28.6580, lon: 77.1380 },
    { name: 'Ramesh Nagar', lat: 28.6480, lon: 77.1510 },
    { name: 'Punjabi Bagh', lat: 28.6683, lon: 77.1305 },
    { name: 'Paschim Vihar', lat: 28.6683, lon: 77.1025 },
    { name: 'Meera Bagh', lat: 28.6750, lon: 77.0950 },
    { name: 'Hari Nagar', lat: 28.6280, lon: 77.1150 },
    { name: 'Nangloi', lat: 28.6810, lon: 77.0650 },
    { name: 'Mundka', lat: 28.6850, lon: 77.0280 },
    { name: 'Peera Garhi', lat: 28.6780, lon: 77.0880 },
    { name: 'Pashchim Vihar', lat: 28.6720, lon: 77.1080 },
    { name: 'Nihal Vihar', lat: 28.6680, lon: 77.0520 },
    { name: 'Najafgarh', lat: 28.6090, lon: 76.9790 },
    { name: 'Kakrola', lat: 28.6020, lon: 77.0280 },
    { name: 'Dabri', lat: 28.6150, lon: 77.0780 },
    { name: 'Palam', lat: 28.5850, lon: 77.0870 },
    { name: 'Mahavir Enclave', lat: 28.5920, lon: 77.0750 },
    { name: 'Bindapur', lat: 28.6200, lon: 77.0520 },
    { name: 'Mohan Garden', lat: 28.6280, lon: 77.0350 },

    // ===== SOUTH WEST DELHI =====
    { name: 'RK Puram Sector 1', lat: 28.5680, lon: 77.1780 },
    { name: 'RK Puram Sector 12', lat: 28.5720, lon: 77.1850 },
    { name: 'Munirka', lat: 28.5560, lon: 77.1680 },
    { name: 'JNU Campus', lat: 28.5400, lon: 77.1680 },
    { name: 'Sarojini Nagar', lat: 28.5780, lon: 77.1970 },
    { name: 'Moti Bagh', lat: 28.5820, lon: 77.1720 },
    { name: 'Netaji Nagar', lat: 28.5750, lon: 77.1920 },
    { name: 'Nauroji Nagar', lat: 28.5680, lon: 77.2050 },
    { name: 'Kidwai Nagar', lat: 28.5650, lon: 77.2100 },
    { name: 'Andrews Ganj', lat: 28.5720, lon: 77.2280 },
    { name: 'Kapashera', lat: 28.5180, lon: 77.0680 },

    // ===== NCR - NOIDA =====
    { name: 'Noida Sector 1', lat: 28.5820, lon: 77.3350 },
    { name: 'Noida Sector 15', lat: 28.5850, lon: 77.3180 },
    { name: 'Noida Sector 16', lat: 28.5780, lon: 77.3220 },
    { name: 'Noida Sector 18', lat: 28.5690, lon: 77.3234 },
    { name: 'Noida Sector 25', lat: 28.5780, lon: 77.3350 },
    { name: 'Noida Sector 27', lat: 28.5820, lon: 77.3480 },
    { name: 'Noida Sector 37', lat: 28.5650, lon: 77.3680 },
    { name: 'Noida Sector 44', lat: 28.5550, lon: 77.3550 },
    { name: 'Noida Sector 50', lat: 28.5720, lon: 77.3620 },
    { name: 'Noida Sector 52', lat: 28.5950, lon: 77.3550 },
    { name: 'Noida Sector 62', lat: 28.6270, lon: 77.3649 },
    { name: 'Noida Sector 63', lat: 28.6180, lon: 77.3750 },
    { name: 'Noida Sector 76', lat: 28.5680, lon: 77.3950 },
    { name: 'Noida Sector 93', lat: 28.5350, lon: 77.3880 },
    { name: 'Noida Sector 104', lat: 28.5150, lon: 77.3920 },
    { name: 'Noida Sector 128', lat: 28.5080, lon: 77.3750 },
    { name: 'Noida Sector 137', lat: 28.4980, lon: 77.3850 },
    { name: 'Noida Sector 142', lat: 28.4850, lon: 77.3980 },
    { name: 'Noida Sector 150', lat: 28.4720, lon: 77.4050 },
    { name: 'Greater Noida', lat: 28.4650, lon: 77.5020 },

    // ===== NCR - GURGAON =====
    { name: 'Gurgaon Sector 14', lat: 28.4680, lon: 77.0420 },
    { name: 'Gurgaon Sector 17', lat: 28.4620, lon: 77.0550 },
    { name: 'Gurgaon Sector 29', lat: 28.4595, lon: 77.0266 },
    { name: 'Gurgaon Sector 42', lat: 28.4520, lon: 77.0680 },
    { name: 'Gurgaon Sector 43', lat: 28.4580, lon: 77.0720 },
    { name: 'Gurgaon Sector 44', lat: 28.4550, lon: 77.0780 },
    { name: 'Gurgaon Sector 45', lat: 28.4510, lon: 77.0650 },
    { name: 'Gurgaon Sector 46', lat: 28.4480, lon: 77.0580 },
    { name: 'Gurgaon Sector 47', lat: 28.4420, lon: 77.0520 },
    { name: 'Gurgaon Sector 48', lat: 28.4380, lon: 77.0680 },
    { name: 'Gurgaon Sector 49', lat: 28.4350, lon: 77.0550 },
    { name: 'Gurgaon Sector 52', lat: 28.4420, lon: 77.0820 },
    { name: 'Gurgaon Sector 53', lat: 28.4380, lon: 77.0950 },
    { name: 'Gurgaon Sector 54', lat: 28.4410, lon: 77.1020 },
    { name: 'Gurgaon Sector 55', lat: 28.4450, lon: 77.1080 },
    { name: 'Gurgaon Sector 56', lat: 28.4280, lon: 77.0920 },
    { name: 'Gurgaon Sector 57', lat: 28.4250, lon: 77.0850 },
    { name: 'Gurgaon DLF Phase 1', lat: 28.4650, lon: 77.0950 },
    { name: 'Gurgaon DLF Phase 2', lat: 28.4580, lon: 77.1020 },
    { name: 'Gurgaon DLF Phase 3', lat: 28.4720, lon: 77.1050 },
    { name: 'Gurgaon Cyber City', lat: 28.4940, lon: 77.0889 },
    { name: 'Gurgaon MG Road', lat: 28.4780, lon: 77.0280 },
    { name: 'Gurgaon Sohna Road', lat: 28.4350, lon: 77.0280 },
    { name: 'Gurgaon Golf Course Road', lat: 28.4520, lon: 77.1050 },
    { name: 'Gurgaon IFFCO Chowk', lat: 28.4720, lon: 77.0350 },
    { name: 'Gurgaon Huda City Centre', lat: 28.4590, lon: 77.0720 },
    { name: 'Manesar', lat: 28.3580, lon: 76.9520 },

    // ===== NCR - GHAZIABAD =====
    { name: 'Ghaziabad', lat: 28.6692, lon: 77.4538 },
    { name: 'Indirapuram', lat: 28.6420, lon: 77.3580 },
    { name: 'Vaishali', lat: 28.6450, lon: 77.3420 },
    { name: 'Vasundhara', lat: 28.6620, lon: 77.3650 },
    { name: 'Kaushambi', lat: 28.6380, lon: 77.3280 },
    { name: 'Raj Nagar', lat: 28.6750, lon: 77.4350 },
    { name: 'Raj Nagar Extension', lat: 28.6980, lon: 77.4520 },
    { name: 'Crossings Republik', lat: 28.6280, lon: 77.4180 },
    { name: 'Mohan Nagar', lat: 28.6650, lon: 77.4280 },
    { name: 'Lal Kuan', lat: 28.6880, lon: 77.4650 },

    // ===== NCR - FARIDABAD =====
    { name: 'Faridabad', lat: 28.4089, lon: 77.3178 },
    { name: 'Faridabad Sector 15', lat: 28.3850, lon: 77.3180 },
    { name: 'Faridabad Sector 16', lat: 28.3920, lon: 77.3220 },
    { name: 'Faridabad Sector 21', lat: 28.3780, lon: 77.3120 },
    { name: 'Faridabad Sector 28', lat: 28.3680, lon: 77.3050 },
    { name: 'Faridabad Old Town', lat: 28.4120, lon: 77.3080 },
    { name: 'Ballabgarh', lat: 28.3420, lon: 77.3250 },
    { name: 'NIT Faridabad', lat: 28.3950, lon: 77.2920 },
    { name: 'Surajkund', lat: 28.4750, lon: 77.2850 }
];

/**
 * Get interpolated AQI for all Delhi localities
 * @param {Array} stations - Array of actual stations with AQI data
 * @returns {Array} Localities with interpolated/direct AQI values
 */
function getInterpolatedLocalities(stations) {
    return DELHI_LOCALITIES.map(locality => {
        const result = calculateIDW(locality.lat, locality.lon, stations);

        if (!result) {
            return {
                ...locality,
                aqi: null,
                level: 'No Data',
                confidence: 0,
                method: 'none',
                stationsUsed: 0
            };
        }

        return {
            ...locality,
            aqi: result.aqi,
            level: getAQILevel(result.aqi),
            confidence: result.confidence,
            method: result.method,
            stationsUsed: result.stationsUsed,
            avgDistance: result.avgDistance,
            nearestStation: result.nearestStation
        };
    });
}

function getAQILevel(aqi) {
    if (aqi > 300) return 'Hazardous';
    if (aqi > 200) return 'Very Unhealthy';
    if (aqi > 150) return 'Unhealthy';
    if (aqi > 100) return 'Unhealthy for Sensitive';
    if (aqi > 50) return 'Moderate';
    return 'Good';
}

module.exports = {
    calculateIDW,
    calculateDistance,
    getInterpolatedLocalities,
    DELHI_LOCALITIES
};
