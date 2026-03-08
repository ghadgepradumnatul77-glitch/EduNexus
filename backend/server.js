import express from 'express';
import './config/env.js';
import { validateEnv } from './config/validator.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { globalLimiter, ipLimiter, orgLimiter, strictAuthLimiter } from './middleware/enterpriseRateLimit.js';
import { csrfProtection } from './middleware/csrf.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import marksRoutes from './routes/marks.js';
import * as healthController from './controllers/healthController.js';
import { resolveTenantIdentity } from './middleware/identity.js';
import billingRoutes from './routes/billing.js';
import onboardingRoutes from './routes/onboarding.js';
import platformRoutes from './routes/platform.js';
import analyticsRoutes from './routes/analytics.js';
import saasRoutes from './routes/saas.js';
import betaRoutes from './routes/beta.js';
import { trackUsage } from './middleware/usage.js';
import { requireActiveTenant } from './middleware/suspension.js';
import { initEventBus } from './services/eventBus.js';
import { startAuditWorker } from './workers/auditWorker.js';
import { startUsageWorker } from './workers/usageWorker.js';
import { startTelemetryWorker } from './workers/telemetryWorker.js';
import { startSubscriptionWorker } from './workers/subscriptionWorker.js';

// 1. Fail-fast Environment Validation
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Global Security Headers
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
}));

const allowedOrigins = [
    'http://localhost:5173',
    process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.vercel.app'))) {
            return callback(null, origin);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Requested-With', 'X-EduNexus-CSRF']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Body limit for DOS protection
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Layered Rate Limiting (Abuse Resistance)
// Exempt Health Checks from global middleware
app.get('/api/health', healthController.livenessCheck);
app.get('/api/health/ready', healthController.readinessCheck);

app.use(globalLimiter); // Layer 1
app.use(ipLimiter);     // Layer 2

// 4. Standard Health Checks
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'EduNexus Enterprise API v2 (Hardened) is active.',
        version: '2.0.1'
    });
});

// 4. CSRF Protection (Double-Submit Pattern)
app.use(csrfProtection);

// 5. Tenant Identity & Org-Layer Limiting
app.use(resolveTenantIdentity);
app.use(orgLimiter);    // Layer 3 (Depends on identity)

// 6. Enterprise Enforcement
app.use(trackUsage);
app.use(requireActiveTenant);

// 7. Health & Infrastructure
// Moved to top for liveness accuracy

// 8. Hardened API Routing
// Auth routes get strict IP-based limiting
app.use('/api/auth', strictAuthLimiter, authRoutes);
app.use('/api/platform', strictAuthLimiter, platformRoutes);

// Business routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/beta', betaRoutes);

// Fallback & Error Handling
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

app.use((err, req, res, next) => {
    // Forensic logging of unexpected errors
    console.error(`[CRITICAL_ERROR] ${req.method} ${req.url}:`, err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Bootstrapping
if (process.env.NODE_ENV !== 'test') {
    initEventBus().then(() => {
        startAuditWorker();
        startUsageWorker();
        startTelemetryWorker();
        startSubscriptionWorker();
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 EduNexus Enterprise V2 running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
}

export default app;
