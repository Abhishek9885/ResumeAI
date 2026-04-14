// ============================================================
// Google Gemini Service — Full AI Pipeline
// Features: Resume Analysis, JD Matching, Section Scoring,
//           Skill Gap + Learning Roadmap, Mock Interview, Rewrite
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { initEmbeddingModel } from './semanticMatcher.js';
import { initJobRecommender } from './jobRecommender.js';

let genAI = null;
let model = null;
let embeddingModel = null;

export function getGenAI() { return genAI; }
export function getModel() { return model; }

export function initGemini(apiKey) {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log('⚠️  Gemini API key not configured — LLM features disabled.');
        return false;
    }
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        // Initialize sub-services
        initEmbeddingModel(genAI);
        initJobRecommender(model);
        console.log('✅ Gemini API initialized (generative + embeddings)');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error.message);
        return false;
    }
}

export function isGeminiAvailable() {
    return model !== null;
}

// Helper: parse JSON from Gemini response
function parseGeminiJSON(text) {
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];
    return JSON.parse(jsonText);
}

// ── 1. Comprehensive Resume Analysis + Section-wise Scoring ──

export async function analyzeResume(resumeText, jobDescription = null) {
    if (!model) return null;

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

    const prompt = `You are an expert HR analyst, career coach, and ATS specialist. Analyze the following resume thoroughly.
${jdBlock}

## Resume:
${resumeText.substring(0, 5000)}

## Your Analysis (respond in valid JSON only, no markdown):
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
    ]
}`;

    try {
        const result = await model.generateContent(prompt);
        return parseGeminiJSON(result.response.text());
    } catch (error) {
        console.error('Gemini analysis failed:', error.message);
        return {
            error: true, message: 'AI analysis temporarily unavailable.',
            overallQuality: null, qualityScore: null,
            summary: 'AI analysis could not be completed.',
            strengths: [], weaknesses: [], suggestions: [], sectionFeedback: {}, sectionScores: {}
        };
    }
}

// ── 2. Skill Gap + Learning Roadmap ─────────────────────────

export async function generateSkillGapRoadmap(resumeText, detectedSkills, jobDescription = null) {
    if (!model) return null;

    const jdContext = jobDescription
        ? `\n## Target Job Description:\n${jobDescription.substring(0, 2000)}\n\nFocus the roadmap on skills needed for this specific role.`
        : '\nBased on the candidate\'s profile, suggest skills to learn for career growth in their field.';

    const prompt = `You are an expert career advisor and learning path designer. Analyze the candidate's current skills and generate a comprehensive skill gap analysis with a structured learning roadmap.

## Resume:
${resumeText.substring(0, 3000)}

## Currently Detected Skills:
${detectedSkills.join(', ')}
${jdContext}

Respond in valid JSON only (no markdown):
{
    "currentLevel": "<string: Beginner / Intermediate / Advanced / Expert>",
    "careerTrajectory": "<string: 1-2 sentence career direction advice>",
    "skillGaps": [
        {
            "skill": "<string: skill name>",
            "priority": "<string: Critical / High / Medium / Low>",
            "reason": "<string: why this skill is important>",
            "currentLevel": "<string: None / Basic / Intermediate>",
            "targetLevel": "<string: Intermediate / Advanced / Expert>"
        }
    ],
    "learningRoadmap": [
        {
            "phase": "<string: Phase 1 / Phase 2 / Phase 3>",
            "title": "<string: phase title>",
            "duration": "<string: e.g. 2-4 weeks>",
            "skills": ["<string>", "<string>"],
            "resources": [
                {"name": "<string: course/resource name>", "type": "<string: Course / Book / Tutorial / Certification>", "platform": "<string: Coursera / Udemy / YouTube / etc.>"}
            ],
            "milestone": "<string: what you should be able to do after this phase>"
        }
    ],
    "certificationPath": [
        {"name": "<string: certification name>", "provider": "<string>", "relevance": "<string: High / Medium>"}
    ],
    "estimatedTimeline": "<string: e.g. 3-6 months to reach target proficiency>"
}`;

    try {
        const result = await model.generateContent(prompt);
        return parseGeminiJSON(result.response.text());
    } catch (error) {
        console.error('Skill gap roadmap failed:', error.message);
        return { error: true, message: 'Could not generate learning roadmap.' };
    }
}

// ── 3. Mock Interview Generator ─────────────────────────────

export async function generateMockInterview(resumeText, jobDescription = null) {
    if (!model) return null;

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
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
        },
        {
            "category": "<string>",
            "question": "<string>",
            "difficulty": "<string>",
            "tip": "<string>",
            "sampleAnswer": "<string>"
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
        const result = await model.generateContent(prompt);
        return parseGeminiJSON(result.response.text());
    } catch (error) {
        console.error('Mock interview generation failed:', error.message);
        return { error: true, message: 'Could not generate mock interview.' };
    }
}

// ── 4. AI-Powered Resume Rewriting ──────────────────────────

export async function generateRewriteSuggestions(resumeText) {
    if (!model) return null;

    const prompt = `You are an expert resume writer and career coach. Given the resume below, generate AI-powered rewritten versions of key resume sections optimized for ATS systems.

## Current Resume:
${resumeText.substring(0, 5000)}

Respond in valid JSON only (no markdown):
{
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
    "coverLetterOpener": "<string: A compelling 2-3 sentence cover letter opening>",
    "linkedInHeadline": "<string: Suggested LinkedIn headline>",
    "linkedInAbout": "<string: A 3-4 sentence LinkedIn About section>",
    "improvementNotes": [
        "<string: what was changed and why 1>",
        "<string: what was changed and why 2>",
        "<string: what was changed and why 3>"
    ]
}`;

    try {
        const result = await model.generateContent(prompt);
        return parseGeminiJSON(result.response.text());
    } catch (error) {
        console.error('Rewrite generation failed:', error.message);
        return { error: true, message: 'Could not generate rewriting suggestions.' };
    }
}
