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
    analyzeResume, isGroqAvailable,
    generateMockInterview
} from '../services/groqService.js';
import { calculateATSScore, analyzeSections } from '../services/atsScorer.js';
import { computeSemanticMatch, findSemanticSkillMatches, isSemanticAvailable } from '../services/semanticMatcher.js';
import { generateExplanations } from '../services/explainEngine.js';
import { generateJobRecommendations } from '../services/jobRecommender.js';

const router = Router();

// ── Input Sanitization ───────────────────────────────────────
function sanitizeInput(text, maxLength = 5000) {
    if (!text || typeof text !== 'string') return null;
    return text
        .replace(/<[^>]*>/g, '')           // Strip HTML tags
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control chars
        .replace(/\s{3,}/g, ' ')           // Collapse excessive whitespace
        .trim()
        .substring(0, maxLength);
}

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
router.post('/',
    // Conditionally apply multer only for multipart/form-data requests so
    // JSON debug requests (resumeText) are accepted without multer interfering.
    (req, res, next) => {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            return upload.single('resume')(req, res, next);
        }
        return next();
    },
    async (req, res) => {
    try {
        console.log('DEBUG /api/analyze headers:', req.headers['content-type']);
        console.log('DEBUG /api/analyze body keys:', Object.keys(req.body || {}));
        const startTime = Date.now();

        const jobDescription = sanitizeInput(req.body.jobDescription);

        // Accept either a file upload (preferred) or direct JSON `resumeText` (testing/debug)
        let resumeText = null;
        if (req.file) {
            // Step 1: Extract text from uploaded file
            console.log('📄 Extracting text from uploaded file...');
            resumeText = await extractText(req.file.buffer, req.file.originalname);
            if (resumeText.trim().length < 50) {
                return res.status(400).json({ error: 'Extracted text too short.' });
            }
        } else if (req.body && req.body.resumeText) {
            // Allow raw resume text in request body for debugging or quick tests
            console.log('📄 Using resumeText from request body (debug mode)');
            resumeText = sanitizeInput(req.body.resumeText, 20000);
            if (!resumeText || resumeText.length < 50) {
                return res.status(400).json({ error: 'Provided resumeText too short.' });
            }
        } else {
            return res.status(400).json({ error: 'No resume file uploaded or resumeText provided.' });
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

        // Run all Groq calls in parallel for speed
        let llmAnalysis = null;
        let rewriteSuggestions = null;
        let skillGapRoadmap = null;
        let mockInterview = null;
        let semanticMatch = null;
        let semanticSkillMatches = null;
        let jobRecommendations = null;

        if (isGroqAvailable()) {
            console.log('🤖 Running optimized AI pipeline (3 bundled calls)...');
            const skillNames = resumeSkills.all.map(s => s.name || s);

            const [
                coreResult,
                careerResult,
                interviewResult,
                ...semanticResults
            ] = await Promise.allSettled([
                analyzeResume(resumeText, jobDescription), // Core Analysis + Rewrite
                generateJobRecommendations(resumeText, skillNames, null, jobDescription), // Job Matches + Roadmap
                generateMockInterview(resumeText, jobDescription),
                // Semantic matching only if JD provided and embeddings available
                ...(jobDescription && isSemanticAvailable()
                    ? [computeSemanticMatch(resumeText, jobDescription), findSemanticSkillMatches(skillNames, jobDescription)]
                    : [])
            ]);

            // Extract values, logging any failures but continuing gracefully
            const extract = (result, name) => {
                if (result.status === 'fulfilled') return result.value;
                console.error(`❌ ${name} failed:`, result.reason?.message);
                return null;
            };

            const coreData = extract(coreResult, 'CoreAnalysis');
            if (coreData && !coreData.error) {
                llmAnalysis = coreData;
                rewriteSuggestions = coreData.rewriteSuggestions;
            } else if (coreData?.error) {
                console.warn('⚠️ CoreAnalysis returned error:', coreData.message);
            }

            const careerData = extract(careerResult, 'CareerInsights');
            if (careerData && !careerData.error) {
                jobRecommendations = careerData;
                skillGapRoadmap = careerData.careerRoadmap;
            } else if (careerData?.error) {
                console.warn('⚠️ CareerInsights returned error:', careerData.message);
                // Still provide structure even if API failed
                jobRecommendations = careerData;
            }

            const interviewData = extract(interviewResult, 'generateMockInterview');
            if (interviewData && !interviewData.error) {
                mockInterview = interviewData;
            } else if (interviewData?.error) {
                console.warn('⚠️ MockInterview returned error:', interviewData.message);
            }

            if (jobDescription && isSemanticAvailable()) {
                const semanticMatchData = extract(semanticResults[0], 'computeSemanticMatch');
                const semanticSkillData = extract(semanticResults[1], 'findSemanticSkillMatches');
                if (semanticMatchData && !semanticMatchData.error) semanticMatch = semanticMatchData;
                if (semanticSkillData && !semanticSkillData.error) semanticSkillMatches = semanticSkillData;
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
        
        // Log what components are being returned
        console.log('📊 Response Components:', {
            atsScore: !!atsResult,
            llmAnalysis: !!llmAnalysis && !llmAnalysis.error,
            rewriteSuggestions: !!rewriteSuggestions && !rewriteSuggestions.error,
            jobRecommendations: !!jobRecommendations && !jobRecommendations.error,
            skillGapRoadmap: !!skillGapRoadmap && !skillGapRoadmap.error,
            mockInterview: !!mockInterview && !mockInterview.error,
            semanticMatch: !!semanticMatch && !semanticMatch.error,
            explanations: !!explanations
        });

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
            geminiEnabled: isGroqAvailable()
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({
            error: error.message || 'An unexpected error occurred.',
            suggestion: 'Please check your file format and try again.'
        });
    }
});

// ============================================================
// Quick Analyze — POST /api/analyze/quick
// Lightweight endpoint for Chrome extension (fast JD matching)
// Skips: rewrite, roadmap, interview, job recommendations
// ============================================================

router.post('/quick', upload.single('resume'), async (req, res) => {
    try {
        const startTime = Date.now();

        if (!req.file) {
            return res.status(400).json({ error: 'No resume file uploaded.' });
        }

        const jobDescription = sanitizeInput(req.body.jobDescription);

        // Step 1: Extract text
        const resumeText = await extractText(req.file.buffer, req.file.originalname);
        if (resumeText.trim().length < 50) {
            return res.status(400).json({ error: 'Extracted text too short.' });
        }

        // Step 2: NLP + Skills + Sections (all local, instant)
        const resumeNLP = processText(resumeText);
        const resumeSkills = extractSkills(resumeText, resumeNLP.filtered, resumeNLP.bigrams);
        const sectionAnalysis = analyzeSections(resumeText);

        // Step 3: Only run ONE Groq call (resume + JD analysis)
        let llmAnalysis = null;
        if (isGroqAvailable()) {
            try {
                llmAnalysis = await analyzeResume(resumeText, jobDescription);
            } catch (err) {
                console.error('Quick AI analysis failed:', err.message);
            }
        }

        // Step 4: ATS Score
        const atsResult = calculateATSScore({
            sectionAnalysis,
            resumeText,
            resumeSkills,
            llmAnalysis
        });

        const processingTime = Date.now() - startTime;
        console.log(`⚡ Quick analysis complete in ${processingTime}ms`);

        res.json({
            success: true,
            processingTime: processingTime + 'ms',
            hasJobDescription: !!jobDescription,
            atsScore: atsResult,
            llmAnalysis,
            resumeSkills,
            sectionAnalysis,
            geminiEnabled: isGroqAvailable()
        });

    } catch (error) {
        console.error('Quick analysis error:', error);
        res.status(500).json({ error: error.message || 'Analysis failed.' });
    }
});

export default router;
