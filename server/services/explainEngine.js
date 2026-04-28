// ============================================================
// Explainable AI Engine — Transparent Scoring Explanations
// Shows WHY scores changed: "Score reduced due to missing X"
// ============================================================

/**
 * Generate human-readable explanations for all scoring decisions
 * @param {Object} params - All analysis results
 * @returns {Object} - Grouped explanations (boosters + reducers)
 */
export function generateExplanations({
    atsResult,
    sectionAnalysis,
    resumeSkills,
    semanticMatch,
    llmAnalysis,
    hasJobDescription,
    formattingDetails
}) {
    const boosters = [];
    const reducers = [];
    const insights = [];

    // ── Section Completeness Explanations ────────────────────

    const criticalSections = ['Contact Information', 'Summary/Objective', 'Experience', 'Education', 'Skills'];

    if (sectionAnalysis) {
        sectionAnalysis.found.forEach(section => {
            if (criticalSections.includes(section)) {
                boosters.push({
                    category: 'Sections',
                    icon: '📋',
                    text: `"${section}" section detected — ATS systems expect this section`,
                    impact: '+5',
                    impactColor: '#00e676'
                });
            }
        });

        sectionAnalysis.missing.forEach(section => {
            const isCritical = criticalSections.includes(section);
            reducers.push({
                category: 'Sections',
                icon: '📋',
                text: `Missing "${section}" section${isCritical ? ' — this is a critical section for ATS parsing' : ''}`,
                impact: isCritical ? '-10' : '-3',
                impactColor: isCritical ? '#ff5252' : '#ffab40'
            });
        });
    }

    // ── Skills Density Explanations ──────────────────────────

    if (resumeSkills) {
        const count = resumeSkills.count || 0;
        const categories = Object.keys(resumeSkills.categorized || {}).length;

        if (count >= 15) {
            boosters.push({
                category: 'Skills',
                icon: '🎯',
                text: `${count} skills detected across ${categories} categories — rich skill profile`,
                impact: '+15',
                impactColor: '#00e676'
            });
        } else if (count >= 8) {
            boosters.push({
                category: 'Skills',
                icon: '🎯',
                text: `${count} skills detected across ${categories} categories — good skill coverage`,
                impact: '+8',
                impactColor: '#69f0ae'
            });
        } else if (count >= 3) {
            reducers.push({
                category: 'Skills',
                icon: '🎯',
                text: `Only ${count} skills detected — consider adding a dedicated skills section with more technical and soft skills`,
                impact: '-10',
                impactColor: '#ffab40'
            });
        } else {
            reducers.push({
                category: 'Skills',
                icon: '🎯',
                text: `Very few skills detected (${count}) — ATS systems heavily rely on skill keywords for filtering`,
                impact: '-20',
                impactColor: '#ff5252'
            });
        }
    }

    // ── Formatting Explanations ──────────────────────────────

    const formatting = atsResult?.formatting || formattingDetails;
    if (formatting) {
        if (formatting.hasQuantifiableResults) {
            boosters.push({
                category: 'Content',
                icon: '📊',
                text: 'Quantifiable achievements detected (percentages, metrics) — highly valued by recruiters',
                impact: '+10',
                impactColor: '#00e676'
            });
        } else {
            reducers.push({
                category: 'Content',
                icon: '📊',
                text: 'No quantifiable achievements found — add metrics like "increased revenue by 30%" or "managed $500K budget"',
                impact: '-10',
                impactColor: '#ff5252'
            });
        }

        if (formatting.hasEmail) {
            boosters.push({
                category: 'Contact',
                icon: '📧',
                text: 'Email address detected in resume',
                impact: '+5',
                impactColor: '#00e676'
            });
        } else {
            reducers.push({
                category: 'Contact',
                icon: '📧',
                text: 'No email address detected — every resume must include contact email',
                impact: '-10',
                impactColor: '#ff5252'
            });
        }

        if (formatting.hasPhone) {
            boosters.push({
                category: 'Contact',
                icon: '📱',
                text: 'Phone number detected in resume',
                impact: '+3',
                impactColor: '#00e676'
            });
        } else {
            reducers.push({
                category: 'Contact',
                icon: '📱',
                text: 'No phone number detected — include a contact phone number',
                impact: '-5',
                impactColor: '#ffab40'
            });
        }

        const verbCount = formatting.actionVerbsUsed?.length || 0;
        if (verbCount >= 5) {
            boosters.push({
                category: 'Content',
                icon: '✍️',
                text: `${verbCount} strong action verbs used (${formatting.actionVerbsUsed.slice(0, 5).join(', ')}) — excellent for impact`,
                impact: '+10',
                impactColor: '#00e676'
            });
        } else if (verbCount >= 3) {
            boosters.push({
                category: 'Content',
                icon: '✍️',
                text: `${verbCount} action verbs detected — consider adding more power verbs like "spearheaded", "orchestrated"`,
                impact: '+5',
                impactColor: '#69f0ae'
            });
        } else {
            reducers.push({
                category: 'Content',
                icon: '✍️',
                text: 'Few action verbs used — start bullet points with strong verbs: led, managed, developed, created, optimized',
                impact: '-10',
                impactColor: '#ff5252'
            });
        }

        if (formatting.wordCount < 100) {
            reducers.push({
                category: 'Length',
                icon: '📏',
                text: `Resume is very short (${formatting.wordCount} words) — aim for 400-800 words for optimal ATS parsing`,
                impact: '-15',
                impactColor: '#ff5252'
            });
        } else if (formatting.wordCount > 2000) {
            reducers.push({
                category: 'Length',
                icon: '📏',
                text: `Resume is quite long (${formatting.wordCount} words) — condense to 1-2 pages for better readability`,
                impact: '-5',
                impactColor: '#ffab40'
            });
        } else {
            boosters.push({
                category: 'Length',
                icon: '📏',
                text: `Good resume length (${formatting.wordCount} words) — within optimal range`,
                impact: '+5',
                impactColor: '#00e676'
            });
        }
    }

    // ── Semantic Match Explanations ──────────────────────────

    if (semanticMatch && !semanticMatch.error && hasJobDescription) {
        const score = semanticMatch.overallScore;
        if (score >= 70) {
            boosters.push({
                category: 'Semantic Match',
                icon: '🧠',
                text: `High semantic similarity (${score}%) with job description — your resume meaning aligns well with the role`,
                impact: '+15',
                impactColor: '#00e676'
            });
        } else if (score >= 50) {
            insights.push({
                category: 'Semantic Match',
                icon: '🧠',
                text: `Moderate semantic similarity (${score}%) — your resume partially aligns with the JD. Consider rephrasing experience to mirror job requirements`,
                impact: '~',
                impactColor: '#ffd740'
            });
        } else {
            reducers.push({
                category: 'Semantic Match',
                icon: '🧠',
                text: `Low semantic similarity (${score}%) — your resume content doesn't closely match the job description's meaning`,
                impact: '-10',
                impactColor: '#ff5252'
            });
        }

        // Section-level insights
        if (semanticMatch.sectionSimilarities) {
            Object.entries(semanticMatch.sectionSimilarities).forEach(([section, sim]) => {
                if (sim !== null) {
                    const label = section.charAt(0).toUpperCase() + section.slice(1);
                    if (sim >= 70) {
                        insights.push({
                            category: 'Section Match',
                            icon: '📐',
                            text: `"${label}" section has strong semantic alignment (${sim}%) with JD`,
                            impact: '▲',
                            impactColor: '#00e676'
                        });
                    } else if (sim < 40) {
                        insights.push({
                            category: 'Section Match',
                            icon: '📐',
                            text: `"${label}" section has weak semantic alignment (${sim}%) — consider tailoring this section to the JD`,
                            impact: '▼',
                            impactColor: '#ffab40'
                        });
                    }
                }
            });
        }
    }

    // ── LLM Analysis Explanations ───────────────────────────

    if (llmAnalysis && !llmAnalysis.error) {
        if (llmAnalysis.qualityScore) {
            const q = llmAnalysis.qualityScore;
            if (q >= 80) {
                boosters.push({
                    category: 'AI Assessment',
                    icon: '🤖',
                    text: `Groq AI rated resume quality at ${q}/100 (${llmAnalysis.overallQuality}) — blended into final score`,
                    impact: '+' + Math.round((q - 60) * 0.4),
                    impactColor: '#00e676'
                });
            } else if (q < 50) {
                reducers.push({
                    category: 'AI Assessment',
                    icon: '🤖',
                    text: `Groq AI rated resume quality at ${q}/100 (${llmAnalysis.overallQuality}) — significant room for improvement`,
                    impact: '-' + Math.round((60 - q) * 0.4),
                    impactColor: '#ff5252'
                });
            }
        }

        if (llmAnalysis.jdMatch && hasJobDescription) {
            const jdScore = llmAnalysis.jdMatch.matchScore;
            insights.push({
                category: 'JD Match',
                icon: '🎯',
                text: `AI JD Match Score: ${jdScore}/100 — ${llmAnalysis.jdMatch.matchLevel}`,
                impact: jdScore >= 70 ? '▲' : '▼',
                impactColor: jdScore >= 70 ? '#00e676' : '#ffab40'
            });

            if (llmAnalysis.jdMatch.missingSkills?.length) {
                const missing = llmAnalysis.jdMatch.missingSkills.slice(0, 5).join(', ');
                reducers.push({
                    category: 'JD Skills',
                    icon: '🔍',
                    text: `Missing JD-required skills: ${missing}`,
                    impact: '-' + Math.min(15, llmAnalysis.jdMatch.missingSkills.length * 3),
                    impactColor: '#ff5252'
                });
            }

            if (llmAnalysis.jdMatch.matchedSkills?.length) {
                const matched = llmAnalysis.jdMatch.matchedSkills.slice(0, 5).join(', ');
                boosters.push({
                    category: 'JD Skills',
                    icon: '✅',
                    text: `Matched ${llmAnalysis.jdMatch.matchedSkills.length} JD-required skills: ${matched}`,
                    impact: '+' + Math.min(15, llmAnalysis.jdMatch.matchedSkills.length * 2),
                    impactColor: '#00e676'
                });
            }
        }
    }

    // ── Final Score Context ──────────────────────────────────

    const finalScore = atsResult?.score || 0;
    let scoreContext;
    if (finalScore >= 85) scoreContext = 'Your resume is in the top tier. Minor polish can make it perfect.';
    else if (finalScore >= 70) scoreContext = 'Solid resume. Address the reducers below to push into the top tier.';
    else if (finalScore >= 55) scoreContext = 'Good foundation but several issues are holding your score back.';
    else scoreContext = 'Your resume needs significant improvements. Focus on the critical reducers first.';

    return {
        scoreContext,
        finalScore,
        boosters: boosters.sort((a, b) => parseInt(b.impact) - parseInt(a.impact)),
        reducers: reducers.sort((a, b) => parseInt(a.impact) - parseInt(b.impact)),
        insights,
        totalBoosters: boosters.length,
        totalReducers: reducers.length,
        netImpact: boosters.reduce((s, b) => s + parseInt(b.impact || 0), 0) +
                   reducers.reduce((s, r) => s + parseInt(r.impact || 0), 0)
    };
}
