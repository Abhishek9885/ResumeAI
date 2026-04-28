// ============================================================
// Groq API Service — Full AI Pipeline (Free Alternative)
// Features: Resume Analysis, JD Matching, Section Scoring,
//           Skill Gap + Learning Roadmap, Mock Interview, Rewrite
// Using Groq's Lightning-Fast Inference
// ============================================================

// Compatibility shim: re-export groqService functions under legacy Gemini names
import {
    getGroq,
    getApiKey,
    initGroq,
    isGroqAvailable,
    callGroqWithRetry,
    analyzeResume as groqAnalyzeResume,
    generateMockInterview as groqGenerateMockInterview
} from './groqService.js';

export function getGemini() { return getGroq(); }
export function getApiKeyGemini() { return getApiKey(); }

export function initGemini(key) { return initGroq(key); }
export function isGeminiAvailable() { return isGroqAvailable(); }
export async function callGeminiWithRetry(prompt, retries, timeoutMs) { return callGroqWithRetry(prompt, retries, timeoutMs); }
export async function analyzeResume(resumeText, jobDescription) { return groqAnalyzeResume(resumeText, jobDescription); }
export async function generateMockInterview(resumeText, jobDescription) { return groqGenerateMockInterview(resumeText, jobDescription); }

