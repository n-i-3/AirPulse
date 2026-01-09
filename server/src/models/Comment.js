const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    reportId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String, // Wallet address from Privy
        required: true
    },
    text: {
        type: String,
        required: true,
        maxLength: 1000
    },
    upvotes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comment', commentSchema);
