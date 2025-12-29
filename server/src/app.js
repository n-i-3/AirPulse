const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use(helmet()); // Secure HTTP headers
app.use(morgan('dev')); // Logger

// Routes
// Routes
app.get('/', (req, res) => {
    res.send('AirPulse API is running...');
});

app.use('/api/aqi', require('./routes/aqiRoutes'));

module.exports = app;
