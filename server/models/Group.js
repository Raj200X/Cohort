const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 300 },
    emoji: { type: String, default: '📚' },
    studyGoal: {
        type: String,
        default: '',
        enum: ['', 'JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'Class 10/12', 'CS Placement', 'Other']
    },
    isPrivate: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

groupSchema.index({ studyGoal: 1 });

module.exports = mongoose.model('Group', groupSchema);
