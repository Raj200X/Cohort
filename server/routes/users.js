const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');

// Get User Dashboard Data
router.get('/:userId/dashboard', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Fetch rooms created by or joined by the user
        // Note: Currently 'participants' in Room schema might not be fully utilized, 
        // but we can query by 'createdBy' for now as a fallback or if 'participants' includes userId
        const joinedRooms = await Room.find({
            $or: [
                { createdBy: userId },
                { participants: userId }
            ]
        }).sort({ createdAt: -1 });

        // Calculate simple streak logic (mock for now or basic date check)
        // In a real app, you'd check days between lastStudyDate and now
        let streak = user.studyStats?.streak || 0;
        const lastDate = user.studyStats?.lastStudyDate ? new Date(user.studyStats.lastStudyDate) : null;

        // Mocking: If last date was yesterday, increment. If today, keep. Else reset.
        // For this demo, just return stored value.

        res.json({
            username: user.username,
            studyStats: user.studyStats,
            joinedRooms
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update Study Stats (Call this when user leaves a room or periodically)
router.post('/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;
        const { hoursToAdd } = req.body; // e.g., 0.5 for 30 mins

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.studyStats.totalHours += hoursToAdd || 0;
        user.studyStats.lastStudyDate = new Date();

        // Simple streak increment logic
        // If last study date was yesterday (simplified), increment streak
        // For simplicity, we just increment if hours > 0 and it's a new day
        user.studyStats.streak += 1;

        await user.save();
        res.json(user.studyStats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
