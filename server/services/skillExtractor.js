// ============================================================
// Skill Extractor — Extracts and categorizes skills from text
// ============================================================

import { SKILL_DATABASE, ALL_SKILLS, SKILL_ALIASES } from '../data/skills.js';

/**
 * Extract skills from processed text
 * @param {string} rawText - Original raw text (for multi-word matching)
 * @param {string[]} tokens - Processed tokens from NLP engine
 * @param {string[]} bigrams - Bigrams from NLP engine
 * @returns {Object} - Extracted skills categorized
 */
export function extractSkills(rawText, tokens, bigrams) {
    const textLower = rawText.toLowerCase();
    const foundSkills = new Map(); // skill -> category

    // 1. Match multi-word skills first (from raw text)
    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
        skills.forEach(skill => {
            if (skill.includes(' ') || skill.includes('.') || skill.includes('#') || skill.includes('+')) {
                // Multi-word or special character skills — match in raw text
                if (textLower.includes(skill)) {
                    foundSkills.set(skill, category);
                }
            }
        });
    });

    // 2. Match single-word skills from tokens
    const tokenSet = new Set(tokens);
    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
        skills.forEach(skill => {
            if (!skill.includes(' ') && !skill.includes('.') && !skill.includes('#') && !skill.includes('+')) {
                if (tokenSet.has(skill)) {
                    foundSkills.set(skill, category);
                }
            }
        });
    });

    // 3. Match bigrams
    const bigramSet = new Set(bigrams);
    Object.entries(SKILL_DATABASE).forEach(([category, skills]) => {
        skills.forEach(skill => {
            if (skill.includes(' ') && bigramSet.has(skill)) {
                foundSkills.set(skill, category);
            }
        });
    });

    // 4. Resolve aliases
    tokenSet.forEach(token => {
        if (SKILL_ALIASES[token]) {
            const canonical = SKILL_ALIASES[token];
            if (ALL_SKILLS[canonical]) {
                foundSkills.set(canonical, ALL_SKILLS[canonical]);
            }
        }
    });

    // Organize by category
    const categorized = {};
    foundSkills.forEach((category, skill) => {
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(skill);
    });

    // Sort categories by number of skills
    const sorted = {};
    Object.keys(categorized)
        .sort((a, b) => categorized[b].length - categorized[a].length)
        .forEach(key => sorted[key] = categorized[key].sort());

    return {
        categorized: sorted,
        all: Array.from(foundSkills.keys()).sort(),
        count: foundSkills.size
    };
}

/**
 * Perform gap analysis — find skills required by JD but missing in resume
 * @param {Object} resumeSkills - Extracted resume skills
 * @param {Object} jdSkills - Extracted JD skills
 * @returns {Object} - Gap analysis results
 */
export function analyzeSkillGap(resumeSkills, jdSkills) {
    const resumeSet = new Set(resumeSkills.all);
    const jdSet = new Set(jdSkills.all);

    const matchedSkills = [...jdSet].filter(s => resumeSet.has(s));
    const missingSkills = [...jdSet].filter(s => !resumeSet.has(s));
    const extraSkills = [...resumeSet].filter(s => !jdSet.has(s));

    // Categorize missing skills
    const missingCategorized = {};
    missingSkills.forEach(skill => {
        const category = ALL_SKILLS[skill] || 'Other';
        if (!missingCategorized[category]) missingCategorized[category] = [];
        missingCategorized[category].push(skill);
    });

    const coveragePercent = jdSet.size > 0 
        ? Math.round((matchedSkills.length / jdSet.size) * 100) 
        : 0;

    return {
        matched: matchedSkills,
        missing: missingSkills,
        missingCategorized,
        extra: extraSkills,
        coveragePercent,
        totalRequired: jdSet.size,
        totalFound: matchedSkills.length
    };
}
