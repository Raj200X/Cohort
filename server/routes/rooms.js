const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Create Room
router.post('/create', auth, async (req, res) => {
    try {
        const { name, password, settings, expiryMinutes } = req.body;
        const userId = req.user.id;
        const roomId = uuidv4();

        // Hash password if provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        // Compute expiry date if creator set a duration (1–1440 mins)
        let expiresAt = null;
        if (expiryMinutes && Number(expiryMinutes) > 0) {
            expiresAt = new Date(Date.now() + Number(expiryMinutes) * 60 * 1000);
        }

        const newRoom = new Room({
            roomId,
            name,
            createdBy: userId,
            participants: [userId],
            password: hashedPassword,
            expiresAt,
            settings: settings || { timerDuration: 0 }
        });
        if (settings && settings.timerDuration > 0) {
            newRoom.settings.timerStartTime = new Date();
        }
        await newRoom.save();

        // Return safe copy (no raw password)
        const safeRoom = newRoom.toObject();
        safeRoom.hasPassword = !!safeRoom.password;
        delete safeRoom.password;
        res.status(201).json(safeRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating room' });
    }
});

// Join Room
router.post('/join', auth, async (req, res) => {
    try {
        const { roomId, password } = req.body;
        const userId = req.user.id;
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Reject if room has expired (TTL cleanup runs every ~60s, so block early)
        if (room.expiresAt && room.expiresAt < new Date()) {
            return res.status(410).json({ message: 'This room has expired and is no longer available.' });
        }

        // Password check using bcrypt
        if (room.password) {
            const isMatch = await bcrypt.compare(password || '', room.password);
            if (!isMatch) {
                return res.status(403).json({ message: 'Incorrect password', requiresPassword: true });
            }
        }

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        const safeRoom = room.toObject();
        safeRoom.hasPassword = !!safeRoom.password;
        delete safeRoom.password;
        res.status(200).json(safeRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error joining room' });
    }
});

// Get All Rooms
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        // Filter out rooms that have already expired (TTL runs every ~60s, not instant)
        const rooms = await Room.find({
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
        }).sort({ createdAt: -1 }).limit(20).populate('participants', 'username');

        const safeRooms = rooms.map(room => {
            const r = room.toObject();
            return {
                ...r,
                hasPassword: !!r.password,
                password: undefined
            };
        });
        res.status(200).json(safeRooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Get Room
router.get('/:roomId', async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId }).populate('participants', 'username');
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // For individual room fetch, we might need to know if it's protected if failing
        // But usually this call happens AFTER join validation or for room view
        // We'll mask password here too just in case
        const safeRoom = room.toObject();
        safeRoom.hasPassword = !!safeRoom.password;
        delete safeRoom.password;

        res.status(200).json(safeRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room' });
    }
});

module.exports = router;
