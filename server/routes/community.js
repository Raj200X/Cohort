const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username');
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/', async (req, res) => {
    try {
        const { content, userId, tags } = req.body;
        const newPost = new Post({
            content,
            author: userId,
            tags
        });
        await newPost.save();
        res.json(newPost);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
