import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import '../config/env.js';

import { csrfProtection } from './csrf.js';

// Helmet security headers
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"]
        },
    },
    crossOriginEmbedderPolicy: false
});

// CORS configuration (Strict for Enterprise)
export const corsConfig = cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-EduNexus-CSRF']
});

// Global rate limiter
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Rate limit exceeded.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Enterprise Account Lockout Middleware
export const enforceAccountLockout = (req, res, next) => {
    // This is handled in the controller logic (authController.js), 
    // but we add this here for documentation of the 15-min threshold.
    next();
};

// Login-specific rate limiter
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 attempts per window
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export { csrfProtection };

// Admin routes rate limiter (stricter)
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many admin requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
