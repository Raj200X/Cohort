const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }, // Simplified for now, just a count
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
