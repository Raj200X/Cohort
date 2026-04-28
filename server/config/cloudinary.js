const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype.startsWith('image/');
        return {
            folder: 'cohort/uploads',
            resource_type: isImage ? 'image' : 'raw',
            // Keep original filename for documents
            public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
            // Images: auto-optimize; raw: keep as-is
            ...(isImage ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] } : {})
        };
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported. Allowed: images, PDF, Word, PPT, TXT'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
});

module.exports = { cloudinary, upload };
