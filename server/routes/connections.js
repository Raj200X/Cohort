const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const auth = require('../middleware/auth');

// POST /api/connections/request/:targetId — send friend request
router.post('/request/:targetId', auth, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.targetId;

        if (senderId === receiverId)
            return res.status(400).json({ message: 'Cannot add yourself' });

        // Check if already connected or request already sent in either direction
        const existing = await Connection.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });
        if (existing) return res.status(409).json({ message: 'Request already exists', status: existing.status });

        const conn = await Connection.create({ sender: senderId, receiver: receiverId });
        res.status(201).json(conn);
    } catch (err) {
        res.status(500).json({ message: 'Error sending request' });
    }
});

// PUT /api/connections/accept/:senderId — accept incoming request
router.put('/accept/:senderId', auth, async (req, res) => {
    try {
        const conn = await Connection.findOneAndUpdate(
            { sender: req.params.senderId, receiver: req.user.id, status: 'pending' },
            { status: 'accepted' },
            { new: true }
        );
        if (!conn) return res.status(404).json({ message: 'Request not found' });
        res.json(conn);
    } catch (err) {
        res.status(500).json({ message: 'Error accepting request' });
    }
});

// DELETE /api/connections/:userId — unfriend, decline, or cancel
router.delete('/:userId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;
        await Connection.deleteOne({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId }
            ]
        });
        res.json({ message: 'Connection removed' });
    } catch (err) {
        res.status(500).json({ message: 'Error removing connection' });
    }
});

// GET /api/connections — my accepted connections
router.get('/', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const conns = await Connection.find({
            $or: [{ sender: myId }, { receiver: myId }],
            status: 'accepted'
        }).populate('sender', 'username avatar studyGoal bio studyStats')
          .populate('receiver', 'username avatar studyGoal bio studyStats');

        // Return the "other" person in each connection
        const people = conns.map(c => {
            const other = c.sender._id.toString() === myId ? c.receiver : c.sender;
            return { connectionId: c._id, user: other };
        });
        res.json(people);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching connections' });
    }
});

// GET /api/connections/pending — incoming pending requests
router.get('/pending', auth, async (req, res) => {
    try {
        const reqs = await Connection.find({ receiver: req.user.id, status: 'pending' })
            .populate('sender', 'username avatar studyGoal bio');
        res.json(reqs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending requests' });
    }
});

// GET /api/connections/status/:userId — check status with a specific user
router.get('/status/:userId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;
        const conn = await Connection.findOne({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId }
            ]
        });
        if (!conn) return res.json({ status: 'none' });
        if (conn.status === 'accepted') return res.json({ status: 'connected' });
        if (conn.sender.toString() === myId) return res.json({ status: 'pending_sent' });
        return res.json({ status: 'pending_received', connectionId: conn._id });
    } catch (err) {
        res.status(500).json({ message: 'Error checking status' });
    }
});

module.exports = router;
