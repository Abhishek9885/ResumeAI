// ============================================================
// Recruiter Route — POST /api/recruiter/analyze
// Upload JD + multiple resumes → ranked candidate analysis
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { extractText } from '../services/fileParser.js';
import { processText } from '../services/nlpEngine.js';
import { extractSkills } from '../services/skillExtractor.js';
import {
    analyzeResume, isGroqAvailable
} from '../services/groqService.js';
import { calculateATSScore, analyzeSections } from '../services/atsScorer.js';
import { computeSemanticMatch, isSemanticAvailable } from '../services/semanticMatcher.js';
import { generateExplanations } from '../services/explainEngine.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.docx', '.txt'];
        const ext = '.' + file.originalname.split('.').pop().toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
});

/**
 * POST /api/recruiter/analyze
 * Upload multiple resumes + JD text → ranked candidates
 */
router.post('/analyze', upload.array('resumes', 10), async (req, res) => {
    try {
        const startTime = Date.now();

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No resume files uploaded.' });
        }

        const jobDescription = req.body.jobDescription || null;
        if (!jobDescription || jobDescription.trim().length < 20) {
            return res.status(400).json({ error: 'Please provide a job description (at least 20 characters).' });
        }

        console.log(`📋 Recruiter: Analyzing ${req.files.length} resumes against JD...`);

        // Process each resume in parallel
        const candidatePromises = req.files.map(async (file, index) => {
            try {
                console.log(`  📄 Processing resume ${index + 1}: ${file.originalname}`);

                // Step 1: Extract text
                const resumeText = await extractText(file.buffer, file.originalname);
                if (resumeText.trim().length < 50) {
                    return {
                        fileName: file.originalname,
                        error: 'Extracted text too short',
                        score: 0
                    };
                }

                // Step 2: NLP Processing
                const resumeNLP = processText(resumeText);

                // Step 3: Skill Extraction
                const resumeSkills = extractSkills(resumeText, resumeNLP.filtered, resumeNLP.bigrams);

                // Step 4: Section Analysis
                const sectionAnalysis = analyzeSections(resumeText);

                // Step 5: AI Analysis (if available)
                let llmAnalysis = null;
                if (isGroqAvailable()) {
                    try {
                        llmAnalysis = await analyzeResume(resumeText, jobDescription);
                    } catch (err) {
                        console.error(`  ⚠️ AI analysis failed for ${file.originalname}:`, err.message);
                    }
                }

                // Step 6: ATS Score
                const atsResult = calculateATSScore({
                    sectionAnalysis,
                    resumeText,
                    resumeSkills,
                    llmAnalysis
                });

                // Step 7: Semantic Match
                let semanticMatch = null;
                if (isSemanticAvailable()) {
                    try {
                        semanticMatch = await computeSemanticMatch(resumeText, jobDescription);
                    } catch (err) {
                        console.error(`  ⚠️ Semantic match failed for ${file.originalname}:`, err.message);
                    }
                }

                // Step 8: Composite Score (ATS 40% + Semantic 30% + JD Match 30%)
                let compositeScore = atsResult.score;
                if (semanticMatch && !semanticMatch.error) {
                    compositeScore = Math.round(
                        atsResult.score * 0.4 +
                        semanticMatch.overallScore * 0.3 +
                        (llmAnalysis?.jdMatch?.matchScore || semanticMatch.overallScore) * 0.3
                    );
                } else if (llmAnalysis?.jdMatch?.matchScore) {
                    compositeScore = Math.round(
                        atsResult.score * 0.5 +
                        llmAnalysis.jdMatch.matchScore * 0.5
                    );
                }

                // Determine rank badge
                let rankBadge;
                if (compositeScore >= 85) rankBadge = { label: 'Excellent', color: '#00e676' };
                else if (compositeScore >= 70) rankBadge = { label: 'Strong', color: '#69f0ae' };
                else if (compositeScore >= 55) rankBadge = { label: 'Good', color: '#ffd740' };
                else if (compositeScore >= 40) rankBadge = { label: 'Fair', color: '#ffab40' };
                else rankBadge = { label: 'Weak', color: '#ff5252' };

                return {
                    fileName: file.originalname,
                    candidateName: llmAnalysis?.candidateProfile?.estimatedRole
                        ? `${file.originalname.replace(/\.[^.]+$/, '')} — ${llmAnalysis.candidateProfile.estimatedRole}`
                        : file.originalname.replace(/\.[^.]+$/, ''),
                    compositeScore,
                    rankBadge,
                    atsScore: atsResult.score,
                    atsGrade: atsResult.grade,
                    atsGradeColor: atsResult.gradeColor,
                    semanticScore: semanticMatch?.overallScore || null,
                    jdMatchScore: llmAnalysis?.jdMatch?.matchScore || null,
                    jdMatchLevel: llmAnalysis?.jdMatch?.matchLevel || null,
                    matchedSkills: llmAnalysis?.jdMatch?.matchedSkills || [],
                    missingSkills: llmAnalysis?.jdMatch?.missingSkills || [],
                    skillCount: resumeSkills.count,
                    topSkills: resumeSkills.all.slice(0, 8),
                    experienceLevel: llmAnalysis?.candidateProfile?.experienceLevel || null,
                    estimatedRole: llmAnalysis?.candidateProfile?.estimatedRole || null,
                    summary: llmAnalysis?.summary || `ATS Score: ${atsResult.score}/100`,
                    strengths: llmAnalysis?.strengths || [],
                    weaknesses: llmAnalysis?.weaknesses || [],
                    wordCount: resumeNLP.tokenCount
                };

            } catch (err) {
                console.error(`  ❌ Failed to process ${file.originalname}:`, err.message);
                return {
                    fileName: file.originalname,
                    error: err.message,
                    compositeScore: 0,
                    rankBadge: { label: 'Error', color: '#ff5252' }
                };
            }
        });

        const candidates = await Promise.all(candidatePromises);

        // Sort by composite score (descending)
        candidates.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

        // Add rank numbers
        candidates.forEach((c, i) => { c.rank = i + 1; });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Recruiter analysis complete: ${candidates.length} candidates in ${processingTime}ms`);

        res.json({
            success: true,
            processingTime: `${processingTime}ms`,
            totalCandidates: candidates.length,
            jobDescription: jobDescription.substring(0, 200) + '...',
            candidates,
            summary: {
                avgScore: Math.round(candidates.reduce((s, c) => s + (c.compositeScore || 0), 0) / candidates.length),
                topCandidate: candidates[0]?.fileName || 'N/A',
                excellentCount: candidates.filter(c => c.compositeScore >= 85).length,
                strongCount: candidates.filter(c => c.compositeScore >= 70 && c.compositeScore < 85).length,
                needsWorkCount: candidates.filter(c => c.compositeScore < 55).length
            }
        });

    } catch (error) {
        console.error('❌ Recruiter analysis error:', error);
        res.status(500).json({
            error: error.message || 'Recruiter analysis failed.',
            suggestion: 'Please check your files and try again.'
        });
    }
});

export default router;
