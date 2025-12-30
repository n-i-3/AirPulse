const Report = require('../models/Report');
const crypto = require('crypto');

/**
 * Get recent reports
 * GET /api/reports
 */
const getReports = async (req, res) => {
    try {
        // Fetch last 50 reports, sorted by newest first
        const reports = await Report.find()
            .sort({ timestamp: -1 })
            .limit(50);

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Create a new report
 * POST /api/reports
 */
const createReport = async (req, res) => {
    try {
        const { description, category, location, zkProof, reporter } = req.body;

        if (!description || !location) {
            return res.status(400).json({ message: 'Description and Location are required' });
        }

        // Generate a pseudo-CID (Content ID) to simulate IPFS hash
        // In production, this would be returned by Pinata/IPFS
        const mockCid = 'Qm' + crypto.createHash('sha256').update(description + Date.now()).digest('hex').substring(0, 44);

        const newReport = new Report({
            cid: mockCid,
            reporter: reporter || 'Anonymous', // Wallet address or User ID
            metadata: {
                description,
                category: category || 'General',
                zkProof: zkProof || null,
                confidence: 0.95 // Simulated AI confidence
            },
            location: {
                type: 'Point',
                coordinates: [location.lng, location.lat] // GeoJSON format: [lng, lat]
            },
            status: 'verified' // Auto-verify for demo purposes
        });

        await newReport.save();
        res.status(201).json(newReport);
    } catch (error) {
        console.error("Report Create Error:", error);
        res.status(500).json({ message: 'Failed to submit report', error: error.message });
    }
};

module.exports = {
    getReports,
    createReport
};
