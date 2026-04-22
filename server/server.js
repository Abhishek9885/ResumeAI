// ============================================================
// Express Server — AI Resume Analyzer Backend
// ============================================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import analyzeRouter from './routes/analyze.js';
import recruiterRouter from './routes/recruiterRoute.js';
import portfolioRouter from './routes/portfolioRoute.js';
import { initGemini } from './services/geminiService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ───────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,        // Allow inline scripts in frontend
    crossOriginEmbedderPolicy: false     // Allow CDN resources
}));

// ── CORS — restrict to known origins ─────────────────────────
const allowedOrigins = [
    'https://resumeai-sck8.onrender.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, chrome extensions)
        if (!origin) return callback(null, true);
        // Allow chrome-extension:// origins
        if (origin.startsWith('chrome-extension://')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(null, true); // In dev, allow all — tighten in prod
    },
    methods: ['GET', 'POST']
}));

// ── Request Logging ──────────────────────────────────────────
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────
const analyzeRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,                     // 10 analyses per window
    message: { error: 'Too many analysis requests. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

const recruiterRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,                      // 5 bulk analyses per window
    message: { error: 'Too many recruiter requests. Please wait 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes (with rate limits) ────────────────────────────
app.use('/api/analyze', analyzeRateLimit, analyzeRouter);
app.use('/api/recruiter', recruiterRateLimit, recruiterRouter);
app.use('/api/portfolio', portfolioRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiEnabled: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    });
});

// ── Fallback: serve index.html for SPA ──────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Error handling middleware ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    if (err.message && err.message.includes('Unsupported file type')) {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Internal server error' });
});

// ── Initialize services & start server ──────────────────────
initGemini(process.env.GEMINI_API_KEY);

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║     🤖 AI Resume Analyzer — Server Running       ║
║──────────────────────────────────────────────────║
║  🌐  http://localhost:${PORT}                       ║
║  📡  API: http://localhost:${PORT}/api/analyze      ║
╚══════════════════════════════════════════════════╝
    `);
});
