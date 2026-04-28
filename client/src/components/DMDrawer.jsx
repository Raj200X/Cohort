import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../api';

const DMDrawer = ({ isOpen, onClose, initialContact }) => {
    const socket = useSocket();
    const user = JSON.parse(localStorage.getItem('user'));
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [unread, setUnread] = useState({}); // contactId → unread count
    const messagesEndRef = useRef(null);

    // Register user with socket for DM routing
    useEffect(() => {
        if (socket && user?._id) {
            socket.emit('register-user', user._id);
        }
    }, [socket, user?._id]);

    // Fetch connections (DM contacts)
    useEffect(() => {
        if (!isOpen) return;
        api.get('/api/connections').then(res => {
            const people = res.data.map(c => c.user);
            setContacts(people);
        }).catch(console.error);
    }, [isOpen]);

    // Open specific contact if passed (from People page)
    useEffect(() => {
        if (initialContact) setActiveContact(initialContact);
    }, [initialContact]);

    // Load thread when contact changes
    useEffect(() => {
        if (!activeContact) return;
        api.get(`/api/messages/${activeContact._id}`)
            .then(res => {
                setMessages(res.data);
                // Clear unread for this contact
                setUnread(u => ({ ...u, [activeContact._id]: 0 }));
            })
            .catch(console.error);
    }, [activeContact]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for incoming DMs
    useEffect(() => {
        if (!socket) return;

        const onDmReceive = (msg) => {
            const senderId = msg.sender?._id || msg.sender;
            if (activeContact && senderId === activeContact._id) {
                setMessages(prev => [...prev, msg]);
            } else {
                setUnread(u => ({ ...u, [senderId]: (u[senderId] || 0) + 1 }));
            }
        };

        const onDmSentConfirm = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        socket.on('dm-receive', onDmReceive);
        socket.on('dm-sent-confirm', onDmSentConfirm);
        return () => {
            socket.off('dm-receive', onDmReceive);
            socket.off('dm-sent-confirm', onDmSentConfirm);
        };
    }, [socket, activeContact]);

    const sendMessage = () => {
        if (!text.trim() || !activeContact || !socket) return;
        socket.emit('dm-send', {
            toUserId: activeContact._id,
            fromUserId: user._id,
            text: text.trim()
        });
        setText('');
    };

    const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#1c1c1e] border-l border-gray-200 dark:border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100 dark:border-white/10 shrink-0">
                            {activeContact ? (
                                <button
                                    onClick={() => setActiveContact(null)}
                                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="font-semibold">{activeContact.username}</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} className="text-indigo-500" />
                                    <h2 className="font-bold text-gray-900 dark:text-white">Messages</h2>
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {!activeContact ? (
                            /* Contact List */
                            <div className="flex-1 overflow-y-auto">
                                {contacts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                                        <div className="text-5xl mb-4">💬</div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Connect with study peers to start chatting.</p>
                                    </div>
                                ) : (
                                    contacts.map(contact => (
                                        <button
                                            key={contact._id}
                                            onClick={() => setActiveContact(contact)}
                                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-50 dark:border-white/5"
                                        >
                                            <img
                                                src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`}
                                                alt={contact.username}
                                                className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                        {contact.username}
                                                    </span>
                                                    {unread[contact._id] > 0 && (
                                                        <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                                                            {unread[contact._id]}
                                                        </span>
                                                    )}
                                                </div>
                                                {contact.studyGoal && (
                                                    <span className="text-xs text-gray-400">{contact.studyGoal}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Message Thread */
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 && (
                                        <div className="text-center text-gray-400 text-sm mt-10">
                                            Say hi to {activeContact.username}! 👋
                                        </div>
                                    )}
                                    {messages.map((msg, i) => {
                                        const isMe = (msg.sender?._id || msg.sender)?.toString() === user._id;
                                        return (
                                            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                                    isMe
                                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                                        : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-none'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-gray-100 dark:border-white/10 shrink-0">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                            placeholder={`Message ${activeContact.username}...`}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!text.trim()}
                                            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DMDrawer;
export { DMDrawer };
