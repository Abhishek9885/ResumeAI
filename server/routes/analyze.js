// ============================================================
// Analyze Route — POST /api/analyze
// Upload resume + optional JD → full AI analysis pipeline
// Now includes: Semantic Matching, XAI, Job Recommendations
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import { extractText } from '../services/fileParser.js';
import { processText } from '../services/nlpEngine.js';
import { extractSkills } from '../services/skillExtractor.js';
import {
    analyzeResume, isGeminiAvailable,
    generateRewriteSuggestions,
    generateSkillGapRoadmap,
    generateMockInterview
} from '../services/geminiService.js';
import { calculateATSScore, analyzeSections } from '../services/atsScorer.js';
import { computeSemanticMatch, findSemanticSkillMatches, isSemanticAvailable } from '../services/semanticMatcher.js';
import { generateExplanations } from '../services/explainEngine.js';
import { generateJobRecommendations } from '../services/jobRecommender.js';

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
 * POST /api/analyze
 * Upload resume (required) + optional JD in body
 */
router.post('/', upload.single('resume'), async (req, res) => {
    try {
        const startTime = Date.now();

        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded.' });
        }

        const jobDescription = req.body.jobDescription || null;

        // Step 1: Extract text
        console.log('📄 Extracting text...');
        const resumeText = await extractText(req.file.buffer, req.file.originalname);
        if (resumeText.trim().length < 50) {
            return res.status(400).json({ error: 'Extracted text too short.' });
        }

        // Step 2: NLP Processing
        console.log('🧠 Running NLP pipeline...');
        const resumeNLP = processText(resumeText);

        // Step 3: Skill Extraction
        console.log('🔍 Extracting skills...');
        const resumeSkills = extractSkills(resumeText, resumeNLP.filtered, resumeNLP.bigrams);

        // Step 4: Section Analysis
        console.log('📋 Analyzing sections...');
        const sectionAnalysis = analyzeSections(resumeText);

        // Run all Gemini calls in parallel for speed
        let llmAnalysis = null;
        let rewriteSuggestions = null;
        let skillGapRoadmap = null;
        let mockInterview = null;
        let semanticMatch = null;
        let semanticSkillMatches = null;
        let jobRecommendations = null;

        if (isGeminiAvailable()) {
            console.log('🤖 Running AI pipeline (analysis + rewrite + roadmap + interview + semantic + jobs)...');
            const skillNames = resumeSkills.all.map(s => s.name || s);

            const promises = [
                analyzeResume(resumeText, jobDescription),
                generateRewriteSuggestions(resumeText),
                generateSkillGapRoadmap(resumeText, skillNames, jobDescription),
                generateMockInterview(resumeText, jobDescription),
                generateJobRecommendations(resumeText, skillNames, null, jobDescription)
            ];

            // Add semantic matching if JD provided and embeddings available
            if (jobDescription && isSemanticAvailable()) {
                promises.push(
                    computeSemanticMatch(resumeText, jobDescription),
                    findSemanticSkillMatches(skillNames, jobDescription)
                );
            }

            const results = await Promise.all(promises);

            llmAnalysis = results[0];
            rewriteSuggestions = results[1];
            skillGapRoadmap = results[2];
            mockInterview = results[3];
            jobRecommendations = results[4];

            if (jobDescription && isSemanticAvailable()) {
                semanticMatch = results[5];
                semanticSkillMatches = results[6];
            }
        }

        // Step 5: Calculate ATS Score
        console.log('🏆 Calculating ATS score...');
        const atsResult = calculateATSScore({
            sectionAnalysis,
            resumeText,
            resumeSkills,
            llmAnalysis
        });

        // Step 6: Generate XAI Explanations
        console.log('🔬 Generating explanations...');
        const explanations = generateExplanations({
            atsResult,
            sectionAnalysis,
            resumeSkills,
            semanticMatch,
            llmAnalysis,
            hasJobDescription: !!jobDescription,
            formattingDetails: atsResult.formatting
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Analysis complete in ${processingTime}ms`);

        res.json({
            success: true,
            processingTime: `${processingTime}ms`,
            hasJobDescription: !!jobDescription,
            atsScore: atsResult,
            resumeSkills,
            sectionAnalysis,
            llmAnalysis,
            rewriteSuggestions,
            skillGapRoadmap,
            mockInterview,
            semanticMatch,
            semanticSkillMatches,
            explanations,
            jobRecommendations,
            resumeStats: {
                wordCount: resumeNLP.tokenCount,
                uniqueWords: resumeNLP.uniqueTokens,
                skillCount: resumeSkills.count
            },
            geminiEnabled: isGeminiAvailable()
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({
            error: error.message || 'An unexpected error occurred.',
            suggestion: 'Please check your file format and try again.'
        });
    }
});

export default router;
