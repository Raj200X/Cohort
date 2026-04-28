const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/people?goal=JEE&q=raj
// Returns all users (excluding self), optionally filtered by study goal or search query
router.get('/', auth, async (req, res) => {
    try {
        const { goal, q } = req.query;
        const selfId = req.user.id;

        const filter = { _id: { $ne: selfId } };
        if (goal) filter.studyGoal = goal;
        if (q) filter.username = { $regex: q, $options: 'i' };

        const users = await User.find(filter)
            .select('username avatar studyGoal bio studyStats')
            .sort({ 'studyStats.streak': -1 })
            .limit(50);

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching people' });
    }
});

module.exports = router;
