const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    password: {
        type: String, // Optional: if set, room is private
        select: true
    },
    settings: {
        timerDuration: { type: Number, default: 0 }, // in minutes
        timerStartTime: { type: Date }
    },
    // TTL field — MongoDB auto-deletes the document when this date is reached.
    // expireAfterSeconds: 0 means "delete as soon as expiresAt is in the past".
    expiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// MongoDB TTL index — auto-deletes expired rooms. No cron job needed.
// Documents with expiresAt: null are NOT deleted (TTL ignores null values).
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Room', roomSchema);

