const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const auth = require('../middleware/auth');

// GET /api/groups?goal=JEE — list all groups (filter by goal)
router.get('/', auth, async (req, res) => {
    try {
        const filter = {};
        if (req.query.goal) filter.studyGoal = req.query.goal;
        const groups = await Group.find(filter)
            .populate('createdBy', 'username avatar')
            .populate('members', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching groups' });
    }
});

// POST /api/groups — create a group
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, emoji, studyGoal, isPrivate } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

        const group = await Group.create({
            name: name.trim(),
            description: description?.trim() || '',
            emoji: emoji || '📚',
            studyGoal: studyGoal || '',
            isPrivate: !!isPrivate,
            createdBy: req.user.id,
            members: [req.user.id]
        });
        const populated = await group.populate([
            { path: 'createdBy', select: 'username avatar' },
            { path: 'members', select: 'username avatar' }
        ]);
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Error creating group' });
    }
});

// POST /api/groups/:id/join — join a group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const userId = req.user.id;
        if (group.members.map(m => m.toString()).includes(userId)) {
            return res.status(409).json({ message: 'Already a member' });
        }
        group.members.push(userId);
        await group.save();
        res.json({ message: 'Joined group', memberCount: group.members.length });
    } catch (err) {
        res.status(500).json({ message: 'Error joining group' });
    }
});

// DELETE /api/groups/:id/leave — leave a group
router.delete('/:id/leave', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const userId = req.user.id;
        group.members = group.members.filter(m => m.toString() !== userId);

        // Delete group if no members left
        if (group.members.length === 0) {
            await Group.deleteOne({ _id: group._id });
            return res.json({ message: 'Group deleted (last member left)' });
        }
        // If creator left, transfer ownership
        if (group.createdBy.toString() === userId && group.members.length > 0) {
            group.createdBy = group.members[0];
        }
        await group.save();
        res.json({ message: 'Left group' });
    } catch (err) {
        res.status(500).json({ message: 'Error leaving group' });
    }
});

// DELETE /api/groups/:id — delete group (creator only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the creator can delete the group' });
        }
        await Group.deleteOne({ _id: group._id });
        await GroupMessage.deleteMany({ group: group._id });
        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting group' });
    }
});

// GET /api/groups/:id/messages — fetch group chat history
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const messages = await GroupMessage.find({ group: req.params.id })
            .populate('sender', 'username avatar')
            .sort({ createdAt: 1 })
            .limit(100);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching group messages' });
    }
});

module.exports = router;
