const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

// Create Room
router.post('/create', async (req, res) => {
    try {
        const { name, userId } = req.body;
        const roomId = uuidv4();
        const newRoom = new Room({
            roomId,
            name,
            createdBy: userId,
            participants: [userId]
        });
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room' });
    }
});

// Join Room
router.post('/join', async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error joining room' });
    }
});

// Get All Rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 }).limit(10).populate('participants', 'username');
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Get Room
router.get('/:roomId', async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId }).populate('participants', 'username');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room' });
    }
});

module.exports = router;
