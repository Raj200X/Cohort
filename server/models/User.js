const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: ''
    },
    studyStats: {
        totalHours: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastStudyDate: { type: Date, default: null }
    },
    studyGoal: {
        type: String,
        default: '',
        enum: ['', 'JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'Class 10/12', 'CS Placement', 'Other']
    },
    bio: {
        type: String,
        default: '',
        maxlength: 200
    }
});

module.exports = mongoose.model('User', userSchema);
