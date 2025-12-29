const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    cid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    reporter: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    }
});

reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
