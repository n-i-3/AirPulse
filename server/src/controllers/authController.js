const User = require('../models/User');
const { PrivyClient } = require('@privy-io/server-auth');
const jwt = require('jsonwebtoken');

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

// Verify Privy Token and Set Session Cookie
exports.login = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Verify token with Privy
        const verifiedClaims = await privy.verifyAuthToken(token);
        const privyId = verifiedClaims.userId;

        // Find or Create User
        let user = await User.findOne({ privyId });

        // Extract meta info might need additional call or extracting from claims if available
        // For now, we update on login if we can, or just create basic
        if (!user) {
            user = new User({
                privyId,
                email: verifiedClaims.email || undefined,
                walletAddress: verifiedClaims.wallet?.address || undefined
            });
            await user.save();
        } else {
            // Update last login
            user.lastLogin = Date.now();
            await user.save();
        }

        // Create JWT Session
        const sessionToken = jwt.sign(
            { id: user._id, role: user.role, privyId: user.privyId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set HttpOnly Cookie
        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                walletAddress: user.walletAddress,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

// Logout
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// Check Session
exports.me = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-__v');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ success: true, user });

    } catch (error) {
        res.clearCookie('token');
        res.status(401).json({ error: 'Session expired' });
    }
};
