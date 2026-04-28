import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from '../pages/Home';
import Room from '../pages/Room';
import Login from '../pages/Login';
import Register from '../pages/Register';
import People from '../pages/People';
import Insights from '../pages/Insights';
import Community from '../pages/Community';
import Profile from '../pages/Profile';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';
import CookiePolicy from '../pages/CookiePolicy';
import PageWrapper from './PageWrapper';

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <PageWrapper>
                            <Home />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <PageWrapper>
                            <Login />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PageWrapper>
                            <Register />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/room/:roomId"
                    element={
                        <PageWrapper>
                            <Room />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/people"
                    element={
                        <PageWrapper>
                            <People />
                        </PageWrapper>
                    }
                />
                {/* Redirect old /explore links to /people */}
                <Route path="/explore" element={<Navigate to="/people" replace />} />
                <Route
                    path="/insights"
                    element={
                        <PageWrapper>
                            <Insights />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/community"
                    element={
                        <PageWrapper>
                            <Community />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PageWrapper>
                            <Profile />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/privacy"
                    element={
                        <PageWrapper>
                            <PrivacyPolicy />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/terms"
                    element={
                        <PageWrapper>
                            <TermsOfService />
                        </PageWrapper>
                    }
                />
                <Route
                    path="/cookie-policy"
                    element={
                        <PageWrapper>
                            <CookiePolicy />
                        </PageWrapper>
                    }
                />
            </Routes>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
