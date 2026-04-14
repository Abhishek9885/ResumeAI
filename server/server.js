// ============================================================
// Express Server — AI Resume Analyzer Backend
// ============================================================

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/recruiter', recruiterRouter);
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
