const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authController = require('./controllers/authController');

// Initialize app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            process.env.ALLOWED_ORIGIN,
            'https://air-pulse-one.vercel.app'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow cookies
}));
app.use(helmet()); // Secure HTTP headers
app.use(morgan('dev')); // Logger
app.use(cookieParser()); // Parse cookies

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'AirPulse API Active', status: 'SYSTEM_ACTIVE' });
});

// Auth Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authController.me);

app.use('/api/aqi', require('./routes/aqiRoutes'));
app.use('/api/sources', require('./routes/sourceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

module.exports = app;
