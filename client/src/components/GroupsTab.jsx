import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowLeft, Plus, Users, Lock, Unlock, Crown, LogOut, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { FileUploadButton, FileAttachment } from './FileUpload';
import api from '../api';

const STUDY_GOALS = ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'Class 10/12', 'CS Placement', 'Other'];
const GOAL_COLORS = {
    'JEE': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    'NEET': 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
    'UPSC': 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
    'CAT': 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    'GATE': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
    'Class 10/12': 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    'CS Placement': 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    'Other': 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300',
};

const EMOJIS = ['📚', '🎯', '🔬', '📐', '💻', '🏛️', '📊', '✏️', '🧪', '🌍'];

const GroupsTab = ({ goalFilter }) => {
    const socket = useSocket();
    const user = JSON.parse(localStorage.getItem('user'));
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [pendingFile, setPendingFile] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Create form state
    const [form, setForm] = useState({ name: '', description: '', emoji: '📚', studyGoal: '', isPrivate: false });
    const [creating, setCreating] = useState(false);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const params = goalFilter ? { goal: goalFilter } : {};
            const res = await api.get('/api/groups', { params });
            setGroups(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchGroups(); }, [goalFilter]);

    // Load group chat when activeGroup changes
    useEffect(() => {
        if (!activeGroup || !socket) return;
        socket.emit('group-join-room', activeGroup._id);
        api.get(`/api/groups/${activeGroup._id}/messages`)
            .then(res => setMessages(res.data))
            .catch(console.error);

        return () => {
            socket.emit('group-leave-room', activeGroup._id);
        };
    }, [activeGroup, socket]);

    // Real-time group messages
    useEffect(() => {
        if (!socket) return;
        const handler = (msg) => {
            if (activeGroup && msg.group === activeGroup._id) {
                setMessages(prev => [...prev, msg]);
            }
        };
        socket.on('group-message-receive', handler);
        return () => socket.off('group-message-receive', handler);
    }, [socket, activeGroup]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const createGroup = async () => {
        if (!form.name.trim()) return;
        setCreating(true);
        try {
            const res = await api.post('/api/groups', form);
            setGroups(prev => [res.data, ...prev]);
            setShowCreate(false);
            setForm({ name: '', description: '', emoji: '📚', studyGoal: '', isPrivate: false });
            setActiveGroup(res.data);
        } catch (err) { console.error(err); }
        finally { setCreating(false); }
    };

    const joinGroup = async (group) => {
        try {
            await api.post(`/api/groups/${group._id}/join`);
            setGroups(prev => prev.map(g =>
                g._id === group._id ? { ...g, members: [...g.members, { _id: user._id, username: user.username, avatar: user.avatar }] } : g
            ));
        } catch (err) { console.error(err); }
    };

    const leaveGroup = async (group) => {
        try {
            await api.delete(`/api/groups/${group._id}/leave`);
            setGroups(prev => prev.map(g =>
                g._id === group._id ? { ...g, members: g.members.filter(m => m._id !== user._id) } : g
            ));
            if (activeGroup?._id === group._id) setActiveGroup(null);
        } catch (err) { console.error(err); }
    };

    const deleteGroup = async (group) => {
        if (!window.confirm('Delete this group and all its messages?')) return;
        try {
            await api.delete(`/api/groups/${group._id}`);
            setGroups(prev => prev.filter(g => g._id !== group._id));
            if (activeGroup?._id === group._id) setActiveGroup(null);
        } catch (err) { console.error(err); }
    };

    const sendMessage = () => {
        if ((!text.trim() && !pendingFile) || !activeGroup || !socket) return;
        socket.emit('group-message', {
            groupId: activeGroup._id,
            fromUserId: user._id,
            text: text.trim(),
            ...(pendingFile || {})
        });
        setText('');
        setPendingFile(null);
    };

    const isMember = (group) => group.members?.some(m => (m._id || m) === user._id);
    const isCreator = (group) => (group.createdBy?._id || group.createdBy) === user._id;

    // ── GROUP LIST VIEW ──
    if (!activeGroup) return (
        <div>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">{groups.length} groups {goalFilter ? `for ${goalFilter}` : 'found'}</p>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={15} /> Create Group
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-16">Loading groups...</div>
            ) : groups.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">👥</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No groups yet. Be the first to create one!</p>
                    <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
                        Create Group
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid gap-4">
                        {groups.map(group => (
                            <motion.div
                                key={group._id}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass p-5 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Emoji Icon */}
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-3xl shrink-0">
                                        {group.emoji}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
                                            {group.studyGoal && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GOAL_COLORS[group.studyGoal] || GOAL_COLORS['Other']}`}>
                                                    {group.studyGoal}
                                                </span>
                                            )}
                                            {group.isPrivate && <Lock size={12} className="text-gray-400" />}
                                            {isCreator(group) && <Crown size={12} className="text-yellow-500" title="You created this" />}
                                        </div>
                                        {group.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{group.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                            <Users size={11} />
                                            <span>{group.members?.length || 0} members</span>
                                            <span>·</span>
                                            <span>by {group.createdBy?.username}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isMember(group) ? (
                                            <>
                                                <button
                                                    onClick={() => setActiveGroup(group)}
                                                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
                                                >
                                                    Open Chat
                                                </button>
                                                {isCreator(group) ? (
                                                    <button onClick={() => deleteGroup(group)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => leaveGroup(group)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                        <LogOut size={14} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => joinGroup(group)}
                                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 hover:text-white text-gray-600 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-white/10 transition-all"
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreate && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowCreate(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto border border-gray-100 dark:border-white/10 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Study Group</h2>
                                        <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Emoji picker */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Emoji</label>
                                            <div className="flex flex-wrap gap-2">
                                                {EMOJIS.map(e => (
                                                    <button
                                                        key={e}
                                                        onClick={() => setForm(f => ({ ...f, emoji: e }))}
                                                        className={`w-10 h-10 rounded-xl text-xl transition-all ${form.emoji === e ? 'bg-indigo-100 dark:bg-indigo-500/30 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                                    >{e}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Group Name *</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                placeholder="e.g. JEE Drop 2025"
                                                maxLength={60}
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                placeholder="What's this group about?"
                                                rows={2}
                                                maxLength={300}
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                            />
                                        </div>

                                        {/* Goal + Privacy row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Study Goal</label>
                                                <select
                                                    value={form.studyGoal}
                                                    onChange={e => setForm(f => ({ ...f, studyGoal: e.target.value }))}
                                                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Any</option>
                                                    {STUDY_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Privacy</label>
                                                <button
                                                    onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.isPrivate ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                                                >
                                                    {form.isPrivate ? <><Lock size={13} /> Private</> : <><Unlock size={13} /> Public</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={createGroup}
                                            disabled={!form.name.trim() || creating}
                                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold transition-all"
                                        >
                                            {creating ? 'Creating...' : 'Create Group'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );

    // ── GROUP CHAT VIEW ──
    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 glass rounded-2xl mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveGroup(null)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="text-2xl">{activeGroup.emoji}</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-white">{activeGroup.name}</h3>
                            {activeGroup.studyGoal && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GOAL_COLORS[activeGroup.studyGoal] || ''}`}>
                                    {activeGroup.studyGoal}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">{activeGroup.members?.length || 0} members</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${showMembers ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-white/20'}`}
                    >
                        <Users size={13} /> Members
                    </button>
                    {isCreator(activeGroup) ? (
                        <button onClick={() => deleteGroup(activeGroup)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <Trash2 size={14} />
                        </button>
                    ) : (
                        <button onClick={() => leaveGroup(activeGroup)} className="p-1.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <LogOut size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex gap-4 flex-1 min-h-0">
                {/* Messages */}
                <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-sm mt-8">
                                No messages yet. Say hello! 👋
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = (msg.sender?._id || msg.sender)?.toString() === user._id;
                            return (
                                <div key={msg._id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <img
                                            src={msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username}`}
                                            className="w-7 h-7 rounded-full shrink-0 bg-gray-100"
                                            alt=""
                                        />
                                    )}
                                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                        {!isMe && (
                                            <span className="text-[10px] text-gray-400 ml-1">{msg.sender?.username}</span>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-none'}`}>
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.fileUrl && (
                                                <FileAttachment
                                                    fileUrl={msg.fileUrl}
                                                    fileType={msg.fileType}
                                                    originalName={msg.originalName}
                                                    mimeType={msg.mimeType}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-white/10">
                        <div className="flex gap-2 items-center">
                            <FileUploadButton onFileReady={setPendingFile} disabled={false} />
                            <input
                                type="text"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder={`Message ${activeGroup.name}...`}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!text.trim() && !pendingFile}
                                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Members Panel */}
                <AnimatePresence>
                    {showMembers && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '200px' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="glass rounded-2xl overflow-hidden shrink-0"
                        >
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                    Members ({activeGroup.members?.length})
                                </h4>
                                <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                                    {activeGroup.members?.map(m => (
                                        <div key={m._id || m} className="flex items-center gap-2">
                                            <img
                                                src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`}
                                                className="w-8 h-8 rounded-full bg-gray-100 shrink-0"
                                                alt=""
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{m.username}</p>
                                                {(m._id || m) === (activeGroup.createdBy?._id || activeGroup.createdBy) && (
                                                    <p className="text-[10px] text-yellow-500 flex items-center gap-1"><Crown size={9} /> Admin</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GroupsTab;
