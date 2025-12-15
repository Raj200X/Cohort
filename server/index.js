const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./config/passport');
const passport = require('passport');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/', (req, res) => {
    res.send('Server is running');
});

// TEMPORARY: Trigger seeding via HTTP
app.get('/api/seed', async (req, res) => {
    try {
        const Category = require('./models/Category');
        const Post = require('./models/Post');
        const Goal = require('./models/Goal');
        const StudySession = require('./models/StudySession');
        const User = require('./models/User');
        const Room = require('./models/Room');

        // 1. Categories
        await Category.deleteMany({});
        await Category.insertMany([
            { name: "Computer Science", icon: "Code", color: "bg-blue-100 text-blue-600" },
            { name: "Mathematics", icon: "Atom", color: "bg-purple-100 text-purple-600" },
            { name: "Literature", icon: "BookOpen", color: "bg-amber-100 text-amber-600" },
            { name: "General Study", icon: "Users", color: "bg-green-100 text-green-600" }
        ]);

        // 2. Dummy User
        let demoUser = await User.findOne({ email: 'demo@example.com' });
        if (!demoUser) {
            demoUser = await User.create({
                username: 'DemoUser',
                email: 'demo@example.com',
                password: 'password123',
                studyStats: { totalHours: 24.5, streak: 5 }
            });
        }

        // 3. Posts
        await Post.deleteMany({});
        await Post.insertMany([
            {
                author: demoUser._id,
                content: "Just finished a 4-hour deep work session! Using the Pomodoro technique really helped me stay focused.",
                tags: ["#productivity", "#studyhacks"],
                likes: 24,
                comments: 5,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                author: demoUser._id,
                content: "Looking for a study buddy for Advanced Physics. Ideally someone in timezone EST.",
                tags: ["#physics", "#studybuddy"],
                likes: 12,
                comments: 8,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
            }
        ]);

        // 4. Rooms
        const roomCount = await Room.countDocuments();
        if (roomCount === 0) {
            await Room.create({ roomId: 'demo-room-1', name: 'Late Night Coding 🌙', createdBy: demoUser._id });
            await Room.create({ roomId: 'demo-room-2', name: 'Calculus Cram Session', createdBy: demoUser._id });
            await Room.create({ roomId: 'demo-room-3', name: 'Chill Lofi Study', createdBy: demoUser._id });
        }

        res.send('Database seeded successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Seeding failed: ' + err.message);
    }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/users', require('./routes/users'));
app.use('/api/explore', require('./routes/explore'));
app.use('/api/community', require('./routes/community'));
app.use('/api/insights', require('./routes/insights'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyroom', {
    family: 4 // Force IPv4 to avoid some local connection issues
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        // Fallback for some local environments if 127.0.0.1 fails
        if (err.name === 'MongoServerSelectionError' && !process.env.MONGO_URI) {
            console.log('Retrying with localhost...');
            mongoose.connect('mongodb://localhost:27017/studyroom', { family: 4 })
                .then(() => console.log('MongoDB connected (fallback)'))
                .catch(e => console.error('Fallback failed:', e));
        }
    });

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);
    });

    socket.on('send-message', (data) => {
        io.to(data.roomId).emit('receive-message', data);
    });

    socket.on('call-user', (data) => {
        io.to(data.userToCall).emit('call-user', { signal: data.signalData, from: data.from, name: data.name });
    });

    socket.on('answer-call', (data) => {
        io.to(data.to).emit('call-accepted', { signal: data.signal, from: socket.id, name: data.name }); // Pass name back
    });

    socket.on('send-changes', (delta) => {
        socket.broadcast.to(delta.roomId).emit('receive-changes', delta);
    });

    socket.on('whiteboard-draw', (data) => {
        socket.broadcast.to(data.roomId).emit('whiteboard-draw', data);
    });

    socket.on('toggle-media', ({ roomId, peerID, type, status }) => {
        socket.broadcast.to(roomId).emit('media-toggled', { peerID, type, status });
    });

    socket.on('whiteboard-clear', (roomId) => {
        socket.broadcast.to(roomId).emit('whiteboard-clear');
    });

    socket.on('disconnecting', () => {
        // Broadcast "user-disconnected" with ID to all rooms the user is in
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.to(roomId).emit('user-disconnected', socket.id);
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socket.broadcast.emit('call-ended');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
