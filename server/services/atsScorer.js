// ============================================================
// ATS Scorer — Resume quality scoring (no JD required)
// ============================================================

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
    if (wordCount < 100) {
        issues.push('Resume appears too short. Aim for at least 300-500 words.');
        score -= 20;
    } else if (wordCount > 2000) {
        issues.push('Resume may be too long. Consider condensing to 1-2 pages.');
        score -= 10;
    }

    const specialCharRatio = (resumeText.match(/[^a-zA-Z0-9\s.,;:!?()'-]/g) || []).length / resumeText.length;
    if (specialCharRatio > 0.05) {
        issues.push('High density of special characters. ATS systems may have trouble parsing.');
        score -= 15;
    }

    const hasBullets = /[•\-\*\►\●\○\■\□\→\»]/g.test(resumeText);
    const hasNumbers = /\d+[%\+]|\$\d+/g.test(resumeText);
    if (!hasBullets && lines.length < 20) {
        issues.push('Consider using bullet points to improve readability.');
        score -= 10;
    }

    if (!hasNumbers) {
        issues.push('Add quantifiable achievements (percentages, dollar amounts, metrics).');
        score -= 10;
    }

    const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed',
        'built', 'launched', 'improved', 'increased', 'decreased', 'reduced',
        'achieved', 'delivered', 'optimized', 'streamlined', 'coordinated',
        'established', 'initiated', 'spearheaded', 'orchestrated', 'mentored'];
    const textLower = resumeText.toLowerCase();
    const usedVerbs = actionVerbs.filter(v => textLower.includes(v));
    if (usedVerbs.length < 3) {
        issues.push('Use more action verbs (led, managed, developed, etc.) to describe achievements.');
        score -= 10;
    }

    // Email check
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    if (!hasEmail) {
        issues.push('No email address detected. Ensure contact information is present.');
        score -= 10;
    }

    // Phone check
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
    if (!hasPhone) {
        issues.push('No phone number detected. Include a contact phone number.');
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

    // Score components for standalone resume analysis
    const weights = {
        sectionPresence: 0.25,
        formatting: 0.25,
        skillDensity: 0.25,
        contentQuality: 0.25
    };

    // Skill density — how many skills detected
    const skillCount = resumeSkills?.count || 0;
    const skillDensityScore = Math.min(100, Math.round((skillCount / 15) * 100));

    // Content quality — action verbs, quantifiable results, length
    let contentScore = 50;
    if (formatting.hasQuantifiableResults) contentScore += 20;
    if (formatting.actionVerbsUsed.length >= 5) contentScore += 15;
    else if (formatting.actionVerbsUsed.length >= 3) contentScore += 10;
    if (formatting.hasEmail) contentScore += 8;
    if (formatting.hasPhone) contentScore += 7;
    contentScore = Math.min(100, contentScore);

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

    // Blend with AI score if available
    if (llmAnalysis && llmAnalysis.qualityScore && !llmAnalysis.error) {
        atsScore = Math.round(atsScore * 0.6 + llmAnalysis.qualityScore * 0.4);
    }

    let grade, gradeColor, gradeLabel;
    if (atsScore >= 85) { grade = 'A+'; gradeColor = '#00e676'; gradeLabel = 'Excellent Resume'; }
    else if (atsScore >= 75) { grade = 'A'; gradeColor = '#69f0ae'; gradeLabel = 'Strong Resume'; }
    else if (atsScore >= 65) { grade = 'B+'; gradeColor = '#ffd740'; gradeLabel = 'Good Resume'; }
    else if (atsScore >= 55) { grade = 'B'; gradeColor = '#ffab40'; gradeLabel = 'Average Resume'; }
    else if (atsScore >= 45) { grade = 'C'; gradeColor = '#ff6e40'; gradeLabel = 'Needs Improvement'; }
    else { grade = 'D'; gradeColor = '#ff5252'; gradeLabel = 'Major Improvements Needed'; }

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
            sectionPresence: { score: components.sectionPresence, weight: '25%', label: 'Section Completeness' },
            formatting: { score: components.formatting, weight: '25%', label: 'Formatting Quality' },
            skillDensity: { score: components.skillDensity, weight: '25%', label: 'Skills Detected' },
            contentQuality: { score: components.contentQuality, weight: '25%', label: 'Content Quality' }
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
