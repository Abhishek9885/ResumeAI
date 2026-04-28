// ============================================================
// Groq API Service — Full AI Pipeline
// Features: Resume Analysis, JD Matching, Section Scoring,
//           Skill Gap + Learning Roadmap, Mock Interview, Rewrite
// Using Groq's Lightning-Fast Inference
// ============================================================

import Groq from 'groq-sdk';
import { initJobRecommender } from './jobRecommender.js';

let groq = null;
let apiKey = null;

export function getGroq() { return groq; }
export function getApiKey() { return apiKey; }

export function initGroq(key) {
    if (!key || key === 'your_groq_api_key_here') {
        console.log('⚠️  Groq API key not configured — LLM features disabled.');
        return false;
    }
    try {
        apiKey = key;
        groq = new Groq({ apiKey: key });
        // Initialize sub-services
        initJobRecommender(groq);
        const configuredModel = process.env.GROQ_MODEL || 'default';
        console.log(`✅ Groq API initialized (model: ${configuredModel})`);
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Groq:', error.message);
        return false;
    }
}

export function isGroqAvailable() {
    return groq !== null;
}

// Helper: parse JSON from Groq response
function parseGroqJSON(text) {
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];
    return JSON.parse(jsonText);
}

/**
 * Call Groq with retry logic, exponential backoff, and timeout
 * @param {string} prompt - The prompt to send
 * @param {number} retries - Number of retry attempts (default 3)
 * @param {number} timeoutMs - Timeout per attempt in ms (default 90s)
 * @returns {Object} - Parsed JSON response
 */
export async function callGroqWithRetry(prompt, retries = 3, timeoutMs = 90000) {
    const model = process.env.GROQ_MODEL;
    if (!model) {
        throw new Error('GROQ_MODEL not configured in .env');
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const payload = {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2048
            };

            const result = await Promise.race([
                groq.chat.completions.create(payload),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Groq request timed out')), timeoutMs)
                )
            ]);
            return parseGroqJSON(result.choices[0].message.content);
        } catch (err) {
            const isLastAttempt = attempt === retries - 1;
            console.error(`❌ Groq attempt ${attempt + 1}/${retries} failed: ${err.message}`);
            if (isLastAttempt) throw err;
            // Exponential backoff with jitter
            const backoffMs = (1000 * Math.pow(2, attempt)) + (Math.random() * 500);
            await new Promise(r => setTimeout(r, backoffMs));
        }
    }
}

// ── 1. Comprehensive Resume Analysis + Rewrite Suggestions (Bundled) ──

export async function analyzeResume(resumeText, jobDescription = null) {
    if (!groq) return null;

    const jdBlock = jobDescription
        ? `\n## Job Description:\n${jobDescription.substring(0, 2000)}\n\nAlso evaluate how well the resume matches this specific job description. Provide a JD match score and gap analysis.`
        : '';

    const jdFields = jobDescription
        ? `"jdMatch": {
        "matchScore": <number: 0-100>,
        "matchLevel": "<string: Excellent Match / Strong Match / Good Match / Moderate Match / Weak Match>",
        "matchSummary": "<string: 2 sentence summary of how well resume fits this JD>",
        "matchedSkills": ["<string>", "<string>", "<string>"],
        "missingSkills": ["<string>", "<string>", "<string>"],
        "keywordGaps": ["<string: important JD keyword not in resume>", "<string>", "<string>"]
    },`
        : '';

    const prompt = `You are an expert HR analyst, career coach, and ATS specialist. Analyze the following resume thoroughly and provide optimization suggestions and rewritten content.

${jdBlock}

## Resume:
${resumeText.substring(0, 5000)}

## Your Task:
1. Provide a comprehensive analysis and scoring of the resume.
2. Generate AI-powered rewritten versions of key resume sections optimized for ATS systems.

## Response Format (Respond in valid JSON only, no markdown):
{
    "overallQuality": "<string: one of 'Excellent', 'Strong', 'Good', 'Average', 'Needs Work'>",
    "qualityScore": <number: 0-100>,
    "summary": "<string: 2-3 sentence executive summary>",
    "candidateProfile": {
        "estimatedRole": "<string: most likely job role>",
        "experienceLevel": "<string: Entry Level / Mid Level / Senior / Lead / Executive>",
        "industry": "<string: primary industry>",
        "topSkills": ["<string>", "<string>", "<string>", "<string>", "<string>"]
    },
    "sectionScores": {
        "contactInfo": {"score": <number: 0-100>, "feedback": "<string: 1 sentence feedback>"},
        "summary": {"score": <number: 0-100>, "feedback": "<string>"},
        "experience": {"score": <number: 0-100>, "feedback": "<string>"},
        "education": {"score": <number: 0-100>, "feedback": "<string>"},
        "skills": {"score": <number: 0-100>, "feedback": "<string>"},
        "projects": {"score": <number: 0-100>, "feedback": "<string>"},
        "certifications": {"score": <number: 0-100>, "feedback": "<string>"},
        "formatting": {"score": <number: 0-100>, "feedback": "<string>"}
    },
    ${jdFields}
    "strengths": ["<string>", "<string>", "<string>"],
    "weaknesses": ["<string>", "<string>"],
    "atsCompatibility": {
        "score": <number: 0-100>,
        "issues": ["<string>", "<string>"],
        "tips": ["<string>", "<string>"]
    },
    "suggestions": ["<string>", "<string>", "<string>", "<string>", "<string>"],
    "suggestedKeywords": ["<string>", "<string>", "<string>"],
    "sectionFeedback": {
        "experience": "<string>",
        "skills": "<string>",
        "education": "<string>",
        "overall": "<string>"
    },
    "suitableRoles": [
        {"title": "<string>", "fitLevel": "<string: Excellent/Strong/Good>"},
        {"title": "<string>", "fitLevel": "<string>"},
        {"title": "<string>", "fitLevel": "<string>"}
    ],
    "rewriteSuggestions": {
        "rewrittenSummary": "<string: A powerful 3-4 sentence professional summary>",
        "rewrittenExperience": [
            "<string: Rewritten bullet point 1 with metrics and action verbs>",
            "<string: Rewritten bullet point 2>",
            "<string: Rewritten bullet point 3>",
            "<string: Rewritten bullet point 4>",
            "<string: Rewritten bullet point 5>"
        ],
        "rewrittenSkills": "<string: Optimized skills section with categorized skills>",
        "atsOptimizedTitle": "<string: Suggested professional headline/title>",
        "coverLetterOpener": "<string: Compelling cover letter opening>",
        "linkedInHeadline": "<string: Suggested LinkedIn headline>",
        "linkedInAbout": "<string: LinkedIn About section>",
        "improvementNotes": ["<string>", "<string>"]
    }
}`;

    try {
        console.log('🤖 Calling analyzeResume with Groq...');
        return await callGroqWithRetry(prompt, 3, 90000); // 90 second timeout for complex analysis
    } catch (error) {
        console.error('❌ Groq comprehensive analysis failed:', error.message);
        return {
            error: true, message: 'AI analysis temporarily unavailable.',
            overallQuality: null, qualityScore: null,
            summary: 'AI analysis could not be completed.',
            strengths: [], weaknesses: [], suggestions: [], sectionFeedback: {}, sectionScores: {},
            rewriteSuggestions: null
        };
    }
}

// ── 2. Mock Interview Generator ─────────────────────────────

export async function generateMockInterview(resumeText, jobDescription = null) {
    if (!groq) return null;

    const jdContext = jobDescription
        ? `\n## Target Job Description:\n${jobDescription.substring(0, 2000)}\n\nTailor interview questions to this specific role.`
        : '\nGenerate interview questions for roles matching this candidate\'s profile.';

    const prompt = `You are an expert technical interviewer and HR professional. Based on the resume below, generate a comprehensive mock interview with questions across different categories.
${jdContext}

## Resume:
${resumeText.substring(0, 4000)}

Generate realistic interview questions that an interviewer would ask this specific candidate. Include a mix of behavioral, technical, and situational questions.

Respond in valid JSON only (no markdown):
{
    "candidateRole": "<string: the role being interviewed for>",
    "difficultyLevel": "<string: Entry / Mid / Senior / Lead>",
    "questions": [
        {
            "category": "<string: Technical / Behavioral / Situational / Experience-Based / Problem-Solving>",
            "question": "<string: the interview question>",
            "difficulty": "<string: Easy / Medium / Hard>",
            "tip": "<string: a helpful tip for answering this question well>",
            "sampleAnswer": "<string: a brief outline of a strong answer (2-3 sentences)>"
        }
    ],
    "interviewTips": [
        "<string: general interview preparation tip 1>",
        "<string: tip 2>",
        "<string: tip 3>"
    ],
    "prepChecklist": [
        "<string: checklist item 1>",
        "<string: checklist item 2>",
        "<string: checklist item 3>",
        "<string: checklist item 4>"
    ]
}`;

    try {
        console.log('🤖 Calling generateMockInterview with Groq...');
        return await callGroqWithRetry(prompt, 3, 90000); // 90 second timeout for mock interview
    } catch (error) {
        console.error('❌ Mock interview generation failed:', error.message);
        return { error: true, message: 'Could not generate mock interview.' };
    }
}
