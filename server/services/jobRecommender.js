// ============================================================
// Job Recommendation Engine — AI-powered job suggestions
// Suggests matching roles based on resume skills & profile
// LinkedIn/Naukri Smart Match style recommendations
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

let model = null;

export function initJobRecommender(geminiModel) {
    model = geminiModel;
}

function parseGeminiJSON(text) {
    let jsonText = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];
    return JSON.parse(jsonText);
}

/**
 * Generate job recommendations based on resume analysis
 * @param {string} resumeText - Full resume text
 * @param {string[]} detectedSkills - Skills found in resume
 * @param {Object} candidateProfile - Profile from LLM analysis (if available)
 * @param {string} jobDescription - Optional JD for context
 * @returns {Object} - Job recommendations
 */
export async function generateJobRecommendations(resumeText, detectedSkills, candidateProfile = null, jobDescription = null) {
    if (!model) return null;

    const skillList = detectedSkills.slice(0, 30).join(', ');
    const profileContext = candidateProfile
        ? `\nCandidate Profile: ${candidateProfile.estimatedRole || 'Unknown'}, ${candidateProfile.experienceLevel || 'Mid Level'}, Industry: ${candidateProfile.industry || 'Technology'}`
        : '';
    const jdContext = jobDescription
        ? `\nThe candidate is interested in roles similar to: ${jobDescription.substring(0, 500)}`
        : '';

    const prompt = `You are a career advisor and job matching expert. Based on the resume and skills below, generate personalized job recommendations.
${profileContext}
${jdContext}

## Resume Excerpt:
${resumeText.substring(0, 3000)}

## Detected Skills:
${skillList}

Generate 6 highly relevant job recommendations. For each job, analyze which of the candidate's skills match and which they're missing.

Respond in valid JSON only (no markdown):
{
    "careerCluster": "<string: primary career cluster for this candidate, e.g. 'Full-Stack Web Development', 'Data Engineering', 'IT Management'>",
    "marketIntelligence": {
        "trendingSkills": ["<string: trending skill 1>", "<string: trending skill 2>", "<string: trending skill 3>"],
        "averageSalary": "<string: typical salary range for this cluster, e.g. '$100K - $140K' or '₹10L - ₹20L'>",
        "demandLevel": "<string: Hot 🔥 / High / Moderate>",
        "insight": "<string: 1-2 sentence insight about the current job market for this cluster>"
    },
    "recommendations": [
        {
            "title": "<string: specific job title>",
            "companyType": "<string: type of company that hires for this, e.g. 'Tech Startups', 'Enterprise SaaS', 'FAANG'>",
            "matchScore": <number: 0-100, how well candidate fits>,
            "salaryRange": "<string: estimated salary range, e.g. '$90K - $130K' or '₹8L - ₹15L'>",
            "description": "<string: 1-2 sentence role description>",
            "requiredSkills": ["<string>", "<string>", "<string>", "<string>", "<string>"],
            "candidateHas": ["<string: skill from resume that matches>", "<string>"],
            "candidateMissing": ["<string: skill candidate should learn>", "<string>"],
            "growthPotential": "<string: High / Medium / Low>",
            "demandLevel": "<string: Hot 🔥 / High / Moderate / Growing>"
        }
    ],
    "skillClusters": [
        {
            "cluster": "<string: skill cluster name, e.g. 'Backend Development'>",
            "skills": ["<string>", "<string>"],
            "strength": "<string: Strong / Moderate / Emerging>"
        }
    ],
    "careerAdvice": "<string: 2-3 sentence personalized career direction advice>"
}`;

    try {
        const result = await model.generateContent(prompt);
        const data = parseGeminiJSON(result.response.text());

        // Sort recommendations by match score
        if (data.recommendations) {
            data.recommendations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }

        return data;
    } catch (error) {
        console.error('Job recommendation generation failed:', error.message);
        return { error: true, message: 'Could not generate job recommendations.' };
    }
}
