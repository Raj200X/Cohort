const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Get User Dashboard Data
router.get('/:userId/dashboard', auth, async (req, res) => {
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
router.post('/:userId/stats', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Only allow a user to update their own stats
        if (req.user.id !== userId) {
            return res.status(403).json({ msg: 'Forbidden' });
        }

        const { hoursToAdd } = req.body; // e.g., 0.5 for 30 mins

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.studyStats.totalHours += hoursToAdd || 0;

        // Proper streak logic: compare calendar dates
        const now = new Date();
        const lastDate = user.studyStats?.lastStudyDate;

        if (lastDate) {
            const lastMidnight = new Date(lastDate);
            lastMidnight.setHours(0, 0, 0, 0);
            const todayMidnight = new Date(now);
            todayMidnight.setHours(0, 0, 0, 0);

            const diffDays = Math.round(
                (todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
                user.studyStats.streak += 1; // Consecutive day — extend streak
            } else if (diffDays === 0) {
                // Same calendar day — do not change streak
            } else {
                user.studyStats.streak = 1; // Gap in days — reset streak to 1
            }
        } else {
            user.studyStats.streak = 1; // First ever session
        }

        user.studyStats.lastStudyDate = now;

        await user.save(); // single save — duplicate removed
        res.json(user.studyStats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update User Profile
router.put('/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Only allow a user to update their own profile
        if (req.user.id !== userId) {
            return res.status(403).json({ msg: 'Forbidden' });
        }

        const { username, avatar, password, oldPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update basic fields
        if (username) user.username = username;
        if (avatar) user.avatar = avatar;

        // Update Password
        if (password) {
            // Optional: Check old password if not a Google user or if strict security is required
            // For now, we'll assume the client handles the "re-enter password" or we trust the session

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        // Return updated user object (excluding password)
        const updatedUser = user.toObject();
        delete updatedUser.password;

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
