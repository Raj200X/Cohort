const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
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
    text: {
        type: String,
        required: true,
        maxlength: 2000
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for fast thread fetching between two users
directMessageSchema.index({ sender: 1, receiver: 1 });
directMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
