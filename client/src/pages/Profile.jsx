import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, RefreshCw } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const Profile = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [formData, setFormData] = useState({
        username: user.username || '',
        email: user.email || '', // Read-only usually
        password: '',
        confirmPassword: '',
        avatar: user.avatar || ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Preset avatars from DiceBear
    const presetAvatars = [
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka`,
        `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
        `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarSelect = (url) => {
        setFormData({ ...formData, avatar: url });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        try {
            const updatePayload = {
                username: formData.username,
                avatar: formData.avatar
            };
            if (formData.password) {
                updatePayload.password = formData.password;
            }

            const res = await axios.put(`${API_URL}/api/users/${user._id}`, updatePayload);

            // Update local storage and state
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setMessage('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (err) {
            console.error(err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-12 flex justify-center items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Visual Side / Avatar Selection */}
                <div className="md:w-1/3 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <h2 className="text-3xl font-bold font-display mb-8 relative z-10">Your Profile</h2>

                    <div className="relative mb-8 group">
                        <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-sm p-1 shadow-xl border-4 border-white/30 overflow-hidden">
                            <img
                                src={formData.avatar || presetAvatars[0]}
                                alt="Profile"
                                className="w-full h-full object-cover bg-white"
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full cursor-pointer">
                            <span className="text-xs font-bold">Current</span>
                        </div>
                    </div>

                    <div className="w-full space-y-4 relative z-10">
                        <p className="text-center text-indigo-100 text-sm font-medium uppercase tracking-wide">Choose Avatar</p>
                        <div className="flex justify-center gap-2 flex-wrap">
                            {presetAvatars.map((url, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleAvatarSelect(url)}
                                    className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-all hover:scale-110 bg-white ${formData.avatar === url ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <p className="text-xs text-center text-indigo-200 mb-2">Or paste a custom URL</p>
                            <input
                                type="text"
                                placeholder="https://example.com/me.png"
                                value={formData.avatar}
                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                className="w-full px-3 py-2 bg-white/10 border border-indigo-400/30 rounded-lg text-xs text-white placeholder-indigo-300/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Edit Form Side */}
                <div className="md:w-2/3 p-8 md:p-12 bg-gray-50">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Details</h3>

                    {message && (
                        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <Save size={16} /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 my-6 pt-6">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Lock size={16} className="text-indigo-600" /> Change Password
                            </h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
