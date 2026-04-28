const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'pending'
    }
}, { timestamps: true });

// Prevent duplicate requests in either direction
connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
