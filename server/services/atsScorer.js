

const EXPECTED_SECTIONS = [
    { name: 'Contact Information', patterns: ['email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'website'] },
    { name: 'Summary/Objective', patterns: ['summary', 'objective', 'profile', 'about', 'overview', 'introduction'] },
    { name: 'Experience', patterns: ['experience', 'employment', 'work history', 'professional experience', 'career'] },
    { name: 'Education', patterns: ['education', 'academic', 'degree', 'university', 'college', 'school', 'certification'] },
    { name: 'Skills', patterns: ['skills', 'technical skills', 'competencies', 'proficiencies', 'technologies', 'tools'] },
    { name: 'Projects', patterns: ['projects', 'portfolio', 'personal projects', 'academic projects'] },
    { name: 'Certifications', patterns: ['certifications', 'certificates', 'licenses', 'accreditations', 'credentials'] },
    { name: 'Awards', patterns: ['awards', 'honors', 'achievements', 'recognition', 'accomplishments'] }
];

export function analyzeSections(resumeText) {
    const textLower = resumeText.toLowerCase();
    const found = [];
    const missing = [];

    EXPECTED_SECTIONS.forEach(section => {
        const hasSection = section.patterns.some(p => textLower.includes(p));
        if (hasSection) found.push(section.name);
        else missing.push(section.name);
    });

    const criticalSections = EXPECTED_SECTIONS.slice(0, 5).map(s => s.name);
    const criticalFound = found.filter(s => criticalSections.includes(s));
    const criticalScore = (criticalFound.length / criticalSections.length) * 100;

    return {
        found,
        missing,
        criticalScore: Math.round(criticalScore),
        totalScore: Math.round((found.length / EXPECTED_SECTIONS.length) * 100)
    };
}

function analyzeFormatting(resumeText) {
    const lines = resumeText.split('\n').filter(l => l.trim());
    const issues = [];
    let score = 100;

    const wordCount = resumeText.split(/\s+/).length;

    // Word count penalties — stricter ranges
    if (wordCount < 150) {
        issues.push('Resume is very short. Aim for at least 400-600 words for a strong ATS score.');
        score -= 30;
    } else if (wordCount < 300) {
        issues.push('Resume is too short. Add more details to experience, projects, and skills sections.');
        score -= 18;
    } else if (wordCount > 2000) {
        issues.push('Resume may be too long. Consider condensing to 1-2 pages (600-900 words ideal).');
        score -= 12;
    } else if (wordCount >= 400 && wordCount <= 900) {
        // Ideal range — no penalty, slight bonus reflected via not deducting
    }

    // Special characters
    const specialCharRatio = (resumeText.match(/[^a-zA-Z0-9\s.,;:!?()'-]/g) || []).length / resumeText.length;
    if (specialCharRatio > 0.05) {
        issues.push('High density of special characters detected. ATS systems may fail to parse this resume.');
        score -= 18;
    }

    // Bullet points
    const hasBullets = /[•\-\*\►\●\○\■\□\→\»]/g.test(resumeText);
    if (!hasBullets) {
        issues.push('No bullet points detected. Use bullet points to make achievements ATS-friendly and scannable.');
        score -= 15;
    }

    // Quantifiable results
    const hasNumbers = /\d+[%\+]|\$\d+|\d+x\b|\d{1,3}(,\d{3})+/.test(resumeText);
    if (!hasNumbers) {
        issues.push('No measurable achievements detected (%, $, numbers). Quantify your impact — e.g., "improved speed by 40%".');
        score -= 18;
    }

    // Action verbs — check count tiers
    const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed',
        'built', 'launched', 'improved', 'increased', 'decreased', 'reduced',
        'achieved', 'delivered', 'optimized', 'streamlined', 'coordinated',
        'established', 'initiated', 'spearheaded', 'orchestrated', 'mentored',
        'architected', 'engineered', 'automated', 'deployed', 'integrated',
        'analyzed', 'researched', 'presented', 'collaborated', 'trained'];
    const textLower = resumeText.toLowerCase();
    const usedVerbs = actionVerbs.filter(v => textLower.includes(v));
    if (usedVerbs.length < 2) {
        issues.push('Very few action verbs found. Use strong action verbs like led, built, optimized, deployed.');
        score -= 18;
    } else if (usedVerbs.length < 4) {
        issues.push('Limited action verbs. Aim for 5+ strong action verbs across your experience bullets.');
        score -= 10;
    }

    // Contact info
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    if (!hasEmail) {
        issues.push('No email address found. ATS systems require contact info — add your email.');
        score -= 12;
    }

    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    if (!hasPhone) {
        issues.push('No phone number detected. Include a contact phone number.');
        score -= 8;
    }

    // LinkedIn presence
    const hasLinkedIn = /linkedin\.com\/in\//i.test(resumeText) || /linkedin/i.test(resumeText);
    if (!hasLinkedIn) {
        issues.push('No LinkedIn profile detected. Adding a LinkedIn URL boosts ATS profile completeness.');
        score -= 5;
    }

    return {
        score: Math.max(0, score),
        issues,
        wordCount,
        lineCount: lines.length,
        hasQuantifiableResults: hasNumbers,
        hasEmail,
        hasPhone,
        actionVerbsUsed: usedVerbs
    };
}

/**
 * Calculate resume quality score (no JD required)
 */
export function calculateATSScore({ sectionAnalysis, resumeText, resumeSkills, llmAnalysis }) {
    const formatting = analyzeFormatting(resumeText);
    const textLower = resumeText.toLowerCase();

    // Adjusted weights — sections and content matter most
    const weights = {
        sectionPresence: 0.30,
        formatting:      0.25,
        skillDensity:    0.20,   // reduced — skill count alone ≠ quality
        contentQuality:  0.25
    };

    // Skill density — require 30 skills for a perfect score
    const skillCount = resumeSkills?.count || 0;
    const skillDensityScore = Math.min(100, Math.round((skillCount / 30) * 100));

    // Content quality — strict baseline of 15
    let contentScore = 15;
    if (formatting.hasQuantifiableResults) contentScore += 25;
    if (formatting.actionVerbsUsed.length >= 6) contentScore += 20;
    else if (formatting.actionVerbsUsed.length >= 4) contentScore += 12;
    else if (formatting.actionVerbsUsed.length >= 2) contentScore += 6;
    if (formatting.hasEmail) contentScore += 10;
    if (formatting.hasPhone) contentScore += 8;
    if (formatting.wordCount >= 400 && formatting.wordCount <= 900) contentScore += 12;
    else if (formatting.wordCount >= 250) contentScore += 5;

    // Penalty: weak/passive language patterns that hurt real ATS ranking
    const weakPhrases = [
        'responsible for', 'duties included', 'helped with',
        'worked on', 'assisted in', 'in charge of', 'was involved in'
    ];
    const weakCount = weakPhrases.filter(p => textLower.includes(p)).length;
    if (weakCount > 0) contentScore -= weakCount * 6;

    // Penalty: personal pronouns (ATS-optimized resumes avoid "I", "my", "me")
    const pronounMatches = (resumeText.match(/\bI\b|\bmy\b|\bme\b/g) || []).length;
    if (pronounMatches > 5) contentScore -= 10;
    else if (pronounMatches > 2) contentScore -= 5;

    contentScore = Math.max(0, Math.min(100, contentScore));

    const components = {
        sectionPresence: sectionAnalysis.criticalScore,
        formatting: formatting.score,
        skillDensity: skillDensityScore,
        contentQuality: contentScore
    };

    let atsScore = 0;
    Object.keys(weights).forEach(key => {
        atsScore += components[key] * weights[key];
    });
    atsScore = Math.round(atsScore);

    // ── Industry Calibration ──────────────────────────────────
    // Our NLP engine checks ~20 signals. Real ATS tools (Jobscan, Resumeworded)
    // check 50+ signals including keyword density, job-title matching, date formats,
    // table detection, and more. Raw scores are therefore inflated.
    // Applying 0.90x calibration brings us in line with industry benchmarks.
    // NOTE: AI qualityScore is intentionally NOT blended — it is subjective and
    // tends to inflate scores by 10-15 points.
    atsScore = Math.round(atsScore * 0.90);

    let grade, gradeColor, gradeLabel;
    if (atsScore >= 85) { grade = 'A+'; gradeColor = '#00e676'; gradeLabel = 'Excellent Resume'; }
    else if (atsScore >= 75) { grade = 'A';  gradeColor = '#69f0ae'; gradeLabel = 'Strong Resume'; }
    else if (atsScore >= 65) { grade = 'B+'; gradeColor = '#ffd740'; gradeLabel = 'Good Resume'; }
    else if (atsScore >= 55) { grade = 'B';  gradeColor = '#ffab40'; gradeLabel = 'Average Resume'; }
    else if (atsScore >= 45) { grade = 'C';  gradeColor = '#ff6e40'; gradeLabel = 'Needs Improvement'; }
    else                     { grade = 'D';  gradeColor = '#ff5252'; gradeLabel = 'Major Improvements Needed'; }

    const suggestions = generateSuggestions(components, formatting, sectionAnalysis, resumeSkills);

    return {
        score: atsScore,
        grade,
        gradeColor,
        gradeLabel,
        components,
        weights,
        formatting,
        suggestions,
        breakdown: {
            sectionPresence: { score: components.sectionPresence, weight: '30%', label: 'Section Completeness' },
            formatting:      { score: components.formatting,      weight: '25%', label: 'Formatting Quality' },
            skillDensity:    { score: components.skillDensity,    weight: '20%', label: 'Skills Detected' },
            contentQuality:  { score: components.contentQuality,  weight: '25%', label: 'Content Quality' }
        }
    };
}

function generateSuggestions(components, formatting, sectionAnalysis, resumeSkills) {
    const suggestions = [];

    if (sectionAnalysis.missing.length > 0) {
        suggestions.push({
            type: 'warning', icon: '📋', title: 'Add Missing Sections',
            description: `Consider adding: ${sectionAnalysis.missing.join(', ')}`, impact: 'medium'
        });
    }

    if (components.skillDensity < 50) {
        suggestions.push({
            type: 'critical', icon: '🎯', title: 'Add More Skills',
            description: 'Your resume has few detectable skills. Add a dedicated skills section with technical and soft skills.', impact: 'high'
        });
    }

    formatting.issues.forEach(issue => {
        suggestions.push({
            type: 'info', icon: '✏️', title: 'Formatting Improvement',
            description: issue, impact: 'low'
        });
    });

    if (components.contentQuality >= 80) {
        suggestions.push({
            type: 'success', icon: '✅', title: 'Strong Content Quality',
            description: 'Good use of action verbs and quantifiable achievements!', impact: 'positive'
        });
    }

    if (resumeSkills?.count >= 15) {
        suggestions.push({
            type: 'success', icon: '🎯', title: 'Rich Skills Profile',
            description: `${resumeSkills.count} skills detected across ${Object.keys(resumeSkills.categorized).length} categories.`, impact: 'positive'
        });
    }

    return suggestions;
}
