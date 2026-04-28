// ============================================================
// Job Recommendation Engine — AI-powered job suggestions
// Suggests matching roles based on resume skills & profile
// LinkedIn/Naukri Smart Match style recommendations
// ============================================================

import { callGroqWithRetry } from './groqService.js';

let model = null;

export function initJobRecommender(groqClient) {
    model = groqClient;
}

/**
 * Generate comprehensive career insights (Job Matches + Skill Gap Roadmap)
 */
export async function generateJobRecommendations(resumeText, detectedSkills, candidateProfile = null, jobDescription = null) {
    if (!model) {
        console.warn('⚠️ Groq API not available for job recommendations');
        return null;
    }

    const skillList = detectedSkills.slice(0, 30).join(', ');
    const profileContext = candidateProfile
        ? `\nCandidate Profile: ${candidateProfile.estimatedRole || 'Unknown'}, ${candidateProfile.experienceLevel || 'Mid Level'}, Industry: ${candidateProfile.industry || 'Technology'}`
        : '';
    const jdContext = jobDescription
        ? `\nThe candidate is interested in roles similar to: ${jobDescription.substring(0, 500)}`
        : '\nBased on the candidate\'s profile, suggest skills to learn for career growth in their field.';

    const prompt = `You are a career advisor, job matching expert, and learning path designer. 
Analyze the resume and skills below to generate personalized job matches AND a comprehensive skill gap analysis with a learning roadmap.

${profileContext}
${jdContext}

## Resume Excerpt:
${resumeText.substring(0, 3000)}

## Detected Skills:
${skillList}

## Your Task:
1. Generate 6 highly relevant job recommendations.
2. Analyze skill gaps and provide a structured learning roadmap for career growth.

## Response Format (Respond in valid JSON only, no markdown):
{
    "careerCluster": "<string: primary career cluster, e.g. 'Full-Stack Web Development'>",
    "marketIntelligence": {
        "trendingSkills": ["<string>", "<string>", "<string>"],
        "averageSalary": "<string: e.g. '$100K - $140K'>",
        "demandLevel": "<string: Hot 🔥 / High / Moderate>",
        "insight": "<string: 1-2 sentence market insight>"
    },
    "recommendations": [
        {
            "title": "<string>",
            "companyType": "<string>",
            "matchScore": <number: 0-100>,
            "salaryRange": "<string>",
            "description": "<string>",
            "candidateHas": ["<string>"],
            "candidateMissing": ["<string>"],
            "growthPotential": "<string: High / Medium / Low>"
        }
    ],
    "careerRoadmap": {
        "currentLevel": "<string: Beginner / Intermediate / Advanced / Expert>",
        "careerTrajectory": "<string: 1-2 sentence advice>",
        "skillGaps": [
            {
                "skill": "<string>",
                "priority": "<string: Critical / High / Medium / Low>",
                "reason": "<string>",
                "currentLevel": "<string>",
                "targetLevel": "<string>"
            }
        ],
        "learningRoadmap": [
            {
                "phase": "<string: Phase 1 / Phase 2 / Phase 3>",
                "title": "<string>",
                "duration": "<string: e.g. 2-4 weeks>",
                "skills": ["<string>", "<string>"],
                "resources": [
                    {"name": "<string>", "type": "<string>", "platform": "<string>"}
                ],
                "milestone": "<string>"
            }
        ],
        "certificationPath": [
            {"name": "<string>", "provider": "<string>", "relevance": "<string: High / Medium>"}
        ],
        "estimatedTimeline": "<string: e.g. 3-6 months>"
    },
    "careerAdvice": "<string: 2-3 sentence personalized advice>"
}`;

    try {
        // Use longer timeout for job recommendations since it's a complex request
        const data = await callGroqWithRetry(prompt, 3, 90000); // 90 second timeout

        // Sort recommendations by match score
        if (data && data.recommendations) {
            data.recommendations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }

        console.log('✅ Job recommendations generated successfully');
        return data;
    } catch (error) {
        const errorMsg = error.message || 'Unknown error';
        console.error('❌ Job & Roadmap generation failed:', errorMsg);
        
        // Check if it's a quota/rate limit error
        const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota');
        
        return { 
            error: true, 
            message: isQuotaError ? 'Groq API quota exceeded' : 'Could not generate career insights.',
            reason: errorMsg.substring(0, 200) // First 200 chars of error
        };
    }
}

