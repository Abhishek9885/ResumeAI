// ============================================================
// Semantic Matcher — Embedding-based Semantic Similarity
// Uses Gemini text-embedding-004 for meaning-based matching
// "Built REST APIs" ≈ "Developed backend services"
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

let embeddingModel = null;

/**
 * Initialize the embedding model (called from geminiService.initGemini)
 */
export function initEmbeddingModel(genAI) {
    if (!genAI) return;
    try {
        embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        console.log('✅ Semantic Matcher initialized (text-embedding-004)');
    } catch (err) {
        console.error('❌ Semantic Matcher init failed:', err.message);
    }
}

export function isSemanticAvailable() {
    return embeddingModel !== null;
}

// ── Get Embedding Vector ────────────────────────────────────

/**
 * Get embedding vector for a text string
 * @param {string} text - Input text
 * @returns {Promise<number[]>} - 768-dim embedding vector
 */
async function getEmbedding(text) {
    if (!embeddingModel) throw new Error('Embedding model not initialized');
    const truncated = text.substring(0, 3000); // token limit safety
    const result = await embeddingModel.embedContent(truncated);
    return result.embedding.values;
}

/**
 * Get embeddings for multiple texts in batch
 * @param {string[]} texts - Array of text strings
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function getBatchEmbeddings(texts) {
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 5;
    const results = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const embeddings = await Promise.all(
            batch.map(t => getEmbedding(t).catch(() => null))
        );
        results.push(...embeddings);
    }
    return results;
}

// ── Cosine Similarity ───────────────────────────────────────

function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

// ── Section Extraction ──────────────────────────────────────

function extractSections(text) {
    const lower = text.toLowerCase();
    const sections = {
        summary: '',
        experience: '',
        skills: '',
        education: '',
        full: text.substring(0, 3000)
    };

    // Try to extract sections by common headings
    const sectionPatterns = [
        { key: 'summary', patterns: /(?:summary|objective|profile|about)\s*[:\-—]?\s*\n([\s\S]*?)(?=\n\s*(?:experience|education|skills|projects|certifications|$))/i },
        { key: 'experience', patterns: /(?:experience|employment|work\s*history|career)\s*[:\-—]?\s*\n([\s\S]*?)(?=\n\s*(?:education|skills|projects|certifications|$))/i },
        { key: 'skills', patterns: /(?:skills|technical\s*skills|competencies|technologies)\s*[:\-—]?\s*\n([\s\S]*?)(?=\n\s*(?:experience|education|projects|certifications|$))/i },
        { key: 'education', patterns: /(?:education|academic|degree)\s*[:\-—]?\s*\n([\s\S]*?)(?=\n\s*(?:experience|skills|projects|certifications|$))/i }
    ];

    sectionPatterns.forEach(({ key, patterns }) => {
        const match = text.match(patterns);
        if (match) sections[key] = match[1].trim().substring(0, 1500);
    });

    return sections;
}

// ── Main Semantic Matching ──────────────────────────────────

/**
 * Compute semantic similarity between resume and job description
 * @param {string} resumeText - Full resume text
 * @param {string} jdText - Job description text
 * @returns {Object} - Semantic match results
 */
export async function computeSemanticMatch(resumeText, jdText) {
    if (!embeddingModel || !jdText) return null;

    try {
        console.log('🧠 Computing semantic similarity...');

        // 1. Full-text semantic similarity
        const [resumeEmbed, jdEmbed] = await Promise.all([
            getEmbedding(resumeText),
            getEmbedding(jdText)
        ]);
        const overallSimilarity = cosineSimilarity(resumeEmbed, jdEmbed);

        // 2. Section-level similarity
        const resumeSections = extractSections(resumeText);
        const jdSections = extractSections(jdText);

        const sectionSimilarities = {};
        const sectionKeys = ['summary', 'experience', 'skills'];

        for (const key of sectionKeys) {
            if (resumeSections[key] && jdSections.full) {
                try {
                    const [rEmbed, jEmbed] = await Promise.all([
                        getEmbedding(resumeSections[key]),
                        getEmbedding(jdSections.full)
                    ]);
                    sectionSimilarities[key] = Math.round(cosineSimilarity(rEmbed, jEmbed) * 100);
                } catch {
                    sectionSimilarities[key] = null;
                }
            }
        }

        // 3. Determine match level
        const score = Math.round(overallSimilarity * 100);
        let matchLevel, matchColor;
        if (score >= 80) { matchLevel = 'Excellent Semantic Match'; matchColor = '#00e676'; }
        else if (score >= 65) { matchLevel = 'Strong Semantic Match'; matchColor = '#69f0ae'; }
        else if (score >= 50) { matchLevel = 'Good Semantic Match'; matchColor = '#ffd740'; }
        else if (score >= 35) { matchLevel = 'Moderate Semantic Match'; matchColor = '#ffab40'; }
        else { matchLevel = 'Weak Semantic Match'; matchColor = '#ff5252'; }

        return {
            overallScore: score,
            matchLevel,
            matchColor,
            sectionSimilarities,
            method: 'Gemini text-embedding-004',
            note: 'Semantic matching captures meaning, not just keywords. "Built REST APIs" ≈ "Developed backend services"'
        };

    } catch (error) {
        console.error('Semantic matching failed:', error.message);
        return { error: true, message: 'Semantic matching unavailable.' };
    }
}

// ── Semantic Skill Matching ─────────────────────────────────

/**
 * Find semantic matches between resume skills and JD requirements
 * @param {string[]} resumeSkills - Skills found in resume
 * @param {string} jdText - Full JD text
 * @returns {Object} - Semantic skill matches
 */
export async function findSemanticSkillMatches(resumeSkills, jdText) {
    if (!embeddingModel || !jdText || !resumeSkills?.length) return null;

    try {
        // Extract skill-like phrases from JD
        const jdPhrases = extractKeyPhrases(jdText);
        if (!jdPhrases.length) return null;

        // Get embeddings for resume skills and JD phrases
        const resumeEmbeddings = await getBatchEmbeddings(resumeSkills.slice(0, 20));
        const jdEmbeddings = await getBatchEmbeddings(jdPhrases.slice(0, 20));

        const semanticMatches = [];
        const THRESHOLD = 0.72;

        for (let i = 0; i < resumeSkills.length; i++) {
            if (!resumeEmbeddings[i]) continue;
            for (let j = 0; j < jdPhrases.length; j++) {
                if (!jdEmbeddings[j]) continue;
                const sim = cosineSimilarity(resumeEmbeddings[i], jdEmbeddings[j]);
                if (sim >= THRESHOLD) {
                    semanticMatches.push({
                        resumeSkill: resumeSkills[i],
                        jdPhrase: jdPhrases[j],
                        similarity: Math.round(sim * 100),
                        isExactMatch: resumeSkills[i].toLowerCase() === jdPhrases[j].toLowerCase()
                    });
                }
            }
        }

        // Sort by similarity descending
        semanticMatches.sort((a, b) => b.similarity - a.similarity);

        // De-duplicate (keep best match per resume skill)
        const seen = new Set();
        const uniqueMatches = semanticMatches.filter(m => {
            if (seen.has(m.resumeSkill)) return false;
            seen.add(m.resumeSkill);
            return true;
        });

        return {
            matches: uniqueMatches.slice(0, 15),
            totalResumeSkills: resumeSkills.length,
            totalJDPhrases: jdPhrases.length,
            semanticCoverage: Math.round((uniqueMatches.length / Math.max(jdPhrases.length, 1)) * 100)
        };

    } catch (error) {
        console.error('Semantic skill matching failed:', error.message);
        return null;
    }
}

/**
 * Extract key skill/requirement phrases from JD text
 */
function extractKeyPhrases(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const phrases = new Set();

    // Extract bullet points and requirements
    lines.forEach(line => {
        const cleaned = line.trim()
            .replace(/^[\-\*\•\►\●\○\■\□\→\»\d+\.\)]+\s*/, '') // remove bullet markers
            .trim();

        if (cleaned.length > 5 && cleaned.length < 100) {
            phrases.add(cleaned);
        }

        // Also extract individual tech terms
        const techMatches = cleaned.match(/\b[A-Z][a-z]+(?:\.[a-z]+)*\b|\b[A-Z]{2,}\b/g);
        if (techMatches) {
            techMatches.forEach(m => {
                if (m.length > 1) phrases.add(m);
            });
        }
    });

    return Array.from(phrases).slice(0, 25);
}
