import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Heart, Share2, MessageCircle, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/community`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        try {
            await axios.post(`${API_URL}/api/community`, {
                content: newPostContent,
                userId: '6576b9e2f9f1b9b0c0c0c0c0', // Fallback/Dummy ID mechanism (should use real user)
                tags: ["#general"] // Simplified
            });
            setNewPostContent('');
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm font-semibold mb-4">
                    <Heart size={16} />
                    <span>Community</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">Student Discussions</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">Connect, ask questions, and share your win with students worldwide.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="md:col-span-2 space-y-6">
                    {/* Create Post Input */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`} alt="avatar" />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Share something with the community..."
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                                <button onClick={handleCreatePost} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">Post</button>
                            </div>
                        </div>
                    </div>

                    {/* Posts */}
                    {posts.map((post) => (
                        <motion.div
                            key={post._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-700 font-bold text-sm overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.username}`} alt="avatar" className="w-full h-full" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{post.author?.username}</h4>
                                        <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={20} /></button>
                            </div>

                            <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags && post.tags.map((tag, i) => (
                                    <span key={i} className="text-xs font-medium text-blue-500 hover:underline cursor-pointer">{tag}</span>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 border-t border-gray-50 pt-4">
                                <button className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-colors text-sm font-medium">
                                    <Heart size={18} /> {post.likes}
                                </button>
                                <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors text-sm font-medium">
                                    <MessageCircle size={18} /> {post.comments}
                                </button>
                                <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors text-sm font-medium ml-auto">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Popular Topics</h3>
                        <ul className="space-y-2">
                            {["#ExamPrep", "#LoFiBeats", "#ComputerScience", "#MentalHealth", "#Productivity"].map((topic, i) => (
                                <li key={i} className="flex justify-between items-center text-sm text-gray-600 hover:text-indigo-600 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <span>{topic}</span>
                                    <span className="text-gray-400 text-xs">1.2k</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Community;
