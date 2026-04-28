const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const auth = require('../middleware/auth');

// GET /api/messages/:userId — fetch thread between me and another user (newest last)
router.get('/:userId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;
        const messages = await DirectMessage.find({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId }
            ]
        }).sort({ createdAt: 1 }).limit(100);

        // Mark incoming messages as read
        await DirectMessage.updateMany(
            { sender: otherId, receiver: myId, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// POST /api/messages/:userId — persist a DM (socket relay is handled server-side)
router.post('/:userId', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Text required' });

        const msg = await DirectMessage.create({
            sender: req.user.id,
            receiver: req.params.userId,
            text: text.trim()
        });
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

// GET /api/messages/unread/count — total unread DM count for badge
router.get('/unread/count', auth, async (req, res) => {
    try {
        const count = await DirectMessage.countDocuments({ receiver: req.user.id, read: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Error counting unread' });
    }
});

module.exports = router;
