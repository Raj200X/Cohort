import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserCheck, Clock, MessageSquare, Users, X, Check } from 'lucide-react';
import api from '../api';
import GroupsTab from '../components/GroupsTab';

const STUDY_GOALS = ['JEE', 'NEET', 'UPSC', 'CAT', 'GATE', 'Class 10/12', 'CS Placement', 'Other'];

const GOAL_COLORS = {
    'JEE':          'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    'NEET':         'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
    'UPSC':         'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
    'CAT':          'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    'GATE':         'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
    'Class 10/12':  'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    'CS Placement': 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
    'Other':        'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300',
};

const People = ({ onOpenDM }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'connections' | 'requests'
    const [people, setPeople] = useState([]);
    const [connections, setConnections] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [statuses, setStatuses] = useState({}); // userId → status
    const [goalFilter, setGoalFilter] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPeople = useCallback(async () => {
        try {
            const params = {};
            if (goalFilter) params.goal = goalFilter;
            if (search) params.q = search;
            const res = await api.get('/api/people', { params });
            setPeople(res.data);
            // Batch-fetch connection statuses
            const statusMap = {};
            await Promise.all(res.data.map(async (p) => {
                const s = await api.get(`/api/connections/status/${p._id}`);
                statusMap[p._id] = s.data.status;
            }));
            setStatuses(statusMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [goalFilter, search]);

    const fetchConnections = async () => {
        try {
            const res = await api.get('/api/connections');
            setConnections(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchPending = async () => {
        try {
            const res = await api.get('/api/connections/pending');
            setPendingRequests(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchPeople();
        fetchConnections();
        fetchPending();
    }, [fetchPeople]);

    const sendRequest = async (userId) => {
        try {
            await api.post(`/api/connections/request/${userId}`);
            setStatuses(s => ({ ...s, [userId]: 'pending_sent' }));
        } catch (err) { console.error(err); }
    };

    const cancelRequest = async (userId) => {
        try {
            await api.delete(`/api/connections/${userId}`);
            setStatuses(s => ({ ...s, [userId]: 'none' }));
        } catch (err) { console.error(err); }
    };

    const acceptRequest = async (senderId) => {
        try {
            await api.put(`/api/connections/accept/${senderId}`);
            fetchPending();
            fetchConnections();
            setStatuses(s => ({ ...s, [senderId]: 'connected' }));
        } catch (err) { console.error(err); }
    };

    const unfriend = async (userId) => {
        try {
            await api.delete(`/api/connections/${userId}`);
            setStatuses(s => ({ ...s, [userId]: 'none' }));
            fetchConnections();
        } catch (err) { console.error(err); }
    };

    const ActionButton = ({ person }) => {
        const status = statuses[person._id] || 'none';
        if (status === 'connected') return (
            <div className="flex gap-2">
                <button
                    onClick={() => onOpenDM && onOpenDM(person)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
                >
                    <MessageSquare size={13} /> Message
                </button>
                <button
                    onClick={() => unfriend(person._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-xs font-semibold transition-all"
                >
                    <X size={13} />
                </button>
            </div>
        );
        if (status === 'pending_sent') return (
            <button
                onClick={() => cancelRequest(person._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400 text-xs font-semibold transition-all"
            >
                <Clock size={13} /> Pending
            </button>
        );
        if (status === 'pending_received') return (
            <button
                onClick={() => acceptRequest(person._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all"
            >
                <Check size={13} /> Accept
            </button>
        );
        return (
            <button
                onClick={() => sendRequest(person._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
            >
                <UserPlus size={13} /> Add
            </button>
        );
    };

    const UserCard = ({ person, extra }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group"
        >
            <img
                src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                alt={person.username}
                className="w-14 h-14 rounded-full border-2 border-white/20 shrink-0 bg-gray-100"
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{person.username}</h3>
                    {person.studyGoal && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GOAL_COLORS[person.studyGoal] || GOAL_COLORS['Other']}`}>
                            {person.studyGoal}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {person.bio || 'No bio yet'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                    <span>🔥 {person.studyStats?.streak || 0} day streak</span>
                    <span>⏱ {Math.round((person.studyStats?.totalHours || 0))}h studied</span>
                </div>
            </div>
            <div className="shrink-0">
                {extra || <ActionButton person={person} />}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-4xl mx-auto pb-16">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-full text-sm font-semibold mb-4">
                    <Users size={16} />
                    <span>Study Network</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 font-display">
                    Find Your <span className="text-gradient">Study Peers</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Connect with people preparing for the same goal. Study together, stay accountable.</p>
            </motion.div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 mb-8 w-fit">
                {[
                    { key: 'discover', label: 'Discover' },
                    { key: 'groups', label: 'Groups' },
                    { key: 'connections', label: `Connections ${connections.length > 0 ? `(${connections.length})` : ''}` },
                    { key: 'requests', label: `Requests ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}` }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === tab.key
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* DISCOVER TAB */}
            {activeTab === 'discover' && (
                <div>
                    {/* Search */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by username..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Goal filter chips */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setGoalFilter('')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                !goalFilter
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-indigo-400'
                            }`}
                        >
                            All
                        </button>
                        {STUDY_GOALS.map(g => (
                            <button
                                key={g}
                                onClick={() => setGoalFilter(g === goalFilter ? '' : g)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    goalFilter === g
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : `border-gray-200 dark:border-white/10 ${GOAL_COLORS[g]}`
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* People grid */}
                    {loading ? (
                        <div className="text-center text-gray-400 py-16">Loading...</div>
                    ) : people.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">🔍</div>
                            <p className="text-gray-500 dark:text-gray-400">No users found. Try a different filter.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {people.map(person => <UserCard key={person._id} person={person} />)}
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            )}

            {/* GROUPS TAB */}
            {activeTab === 'groups' && (
                <GroupsTab goalFilter={goalFilter} />
            )}

            {/* CONNECTIONS TAB */}
            {activeTab === 'connections' && (
                <div>
                    {connections.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">🤝</div>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No connections yet.</p>
                            <button onClick={() => setActiveTab('discover')} className="btn-primary px-6 py-2.5 rounded-xl text-sm">
                                Discover people
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {connections.map(({ connectionId, user: person }) => (
                                    <UserCard
                                        key={connectionId}
                                        person={person}
                                        extra={
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onOpenDM && onOpenDM(person)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all"
                                                >
                                                    <MessageSquare size={13} /> Message
                                                </button>
                                                <button
                                                    onClick={() => unfriend(person._id)}
                                                    className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
                <div>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">📬</div>
                            <p className="text-gray-500 dark:text-gray-400">No pending requests.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="space-y-3">
                                {pendingRequests.map(req => (
                                    <UserCard
                                        key={req._id}
                                        person={req.sender}
                                        extra={
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptRequest(req.sender._id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all"
                                                >
                                                    <Check size={13} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => cancelRequest(req.sender._id)}
                                                    className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>
            )}
        </div>
    );
};

export default People;
