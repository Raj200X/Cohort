import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const Explore = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [trendingRooms, setTrendingRooms] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL} /api/explore`);
                setCategories(res.data.categories);
                setTrendingRooms(res.data.trendingRooms);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    // Helper to map icon string to Component
    const getIcon = (iconName) => {
        if (iconName === 'Code') return <Code size={20} />;
        if (iconName === 'Atom') return <Atom size={20} />;
        if (iconName === 'BookOpen') return <BookOpen size={20} />;
        return <Users size={20} />;
    };

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4">
                    <Compass size={16} />
                    <span>Discover</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">Explore Study Rooms</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Find the perfect environment to focus, collaborate, and learn with others.</p>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl mx-auto mb-16 relative"
            >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search for topics, rooms, or tags..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-lg"
                />
            </motion.div>

            {/* Categories */}
            <div className="mb-16">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
                        >
                            <div className={`p - 3 rounded - full ${cat.color} `}>
                                {getIcon(cat.icon)}
                            </div>
                            <span className="font-semibold text-gray-700">{cat.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Trending */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Trending Now</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {trendingRooms.map((room) => (
                        <motion.div
                            key={room._id}
                            whileHover={{ y: -5 }}
                            onClick={() => navigate(`/ room / ${room.roomId} `)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-bold uppercase">General</span>
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <Users size={14} />
                                    <span>{room.participants?.length || 0}</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{room.name}</h3>
                            <button className="w-full py-2 mt-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Join Room</button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Explore;
