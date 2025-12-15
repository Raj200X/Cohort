import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import Logo from './Logo';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full border transition-all duration-500 ${isScrolled
                ? 'bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)]'
                : 'bg-white/10 backdrop-blur-xl border-white/20 shadow-lg shadow-indigo-500/5'
                }`}
        >
            <div className="px-6 sm:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                <Logo className="w-8 h-8" />
                            </div>
                            <span className="text-3xl font-bold text-gray-800 tracking-tight font-logo">
                                Cohort
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center space-x-1">
                            {['Home', 'Explore', 'Insights', 'Community'].map((item) => {
                                const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
                                const active = isActive(path);
                                return (
                                    <Link
                                        key={item}
                                        to={path}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${active
                                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50/50'
                                            }`}
                                    >
                                        {item}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Auth Buttons / Profile */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-200">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block font-display">{user.username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Logout"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Log In</Link>
                                <Link
                                    to="/register"
                                    className="btn-primary px-6 py-2.5 rounded-full text-sm font-medium"
                                >
                                    Sign Up Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
