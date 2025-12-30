const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    privyId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined to be unique
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'authority'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
