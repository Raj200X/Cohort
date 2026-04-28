const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// POST /api/upload — upload a single file (image or document)
// Returns: { url, fileType, originalName, size }
router.post('/', auth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const isImage = req.file.mimetype.startsWith('image/');

    res.json({
        url: req.file.path,          // Cloudinary URL
        fileType: isImage ? 'image' : 'document',
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
    });
}, (err, req, res, next) => {
    // Multer/cloudinary error handler
    res.status(400).json({ message: err.message || 'Upload failed' });
});

module.exports = router;
