// ============================================================
// TF-IDF Engine — Term Frequency-Inverse Document Frequency
//                 + Cosine Similarity Calculation
// ============================================================

/**
 * Compute TF-IDF vectors for a set of documents
 * @param {string[][]} documents - Array of token arrays (each doc is an array of words)
 * @returns {Object} - TF-IDF vectors and vocabulary
 */
export function computeTFIDF(documents) {
    const N = documents.length;
    const vocabulary = new Set();
    
    // Build vocabulary from all documents
    documents.forEach(doc => doc.forEach(token => vocabulary.add(token)));
    const vocabArray = Array.from(vocabulary).sort();
    const vocabIndex = {};
    vocabArray.forEach((word, idx) => vocabIndex[word] = idx);

    // Compute document frequency (DF) for each term
    const df = {};
    vocabArray.forEach(word => {
        df[word] = documents.filter(doc => doc.includes(word)).length;
    });

    // Compute TF-IDF vectors
    const vectors = documents.map(doc => {
        const tf = {};
        const totalTerms = doc.length;
        
        // Count term frequency
        doc.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });

        // Build TF-IDF vector
        const vector = new Array(vocabArray.length).fill(0);
        vocabArray.forEach((word, idx) => {
            if (tf[word]) {
                const termFreq = tf[word] / totalTerms;
                const inverseDocFreq = Math.log((N + 1) / (df[word] + 1)) + 1; // smoothed IDF
                vector[idx] = termFreq * inverseDocFreq;
            }
        });

        return vector;
    });

    return {
        vectors,
        vocabulary: vocabArray,
        vocabIndex,
        documentFrequency: df
    };
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score (0 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Get top N important terms from a TF-IDF vector
 * @param {number[]} vector - TF-IDF vector
 * @param {string[]} vocabulary - Vocabulary array
 * @param {number} n - Number of top terms
 * @returns {Array} - Top terms with their scores
 */
export function getTopTerms(vector, vocabulary, n = 20) {
    const terms = vector
        .map((score, idx) => ({ term: vocabulary[idx], score }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, n);

    return terms;
}

/**
 * Analyze keyword overlap between resume and job description
 * @param {Object} resumeNLP - Processed NLP data from resume
 * @param {Object} jdNLP - Processed NLP data from job description
 * @returns {Object} - Keyword analysis results
 */
export function analyzeKeywords(resumeNLP, jdNLP) {
    const resumeTokens = new Set(resumeNLP.lemmatized);
    const jdTokens = new Set(jdNLP.lemmatized);

    // Keywords in JD that appear in resume
    const matchedKeywords = [...jdTokens].filter(t => resumeTokens.has(t));
    
    // Keywords in JD that are missing from resume
    const missingKeywords = [...jdTokens].filter(t => !resumeTokens.has(t));

    // Keywords in resume not in JD (potential extras)
    const extraKeywords = [...resumeTokens].filter(t => !jdTokens.has(t));

    // Calculate keyword match percentage
    const matchPercentage = jdTokens.size > 0 
        ? (matchedKeywords.length / jdTokens.size) * 100 
        : 0;

    return {
        matched: matchedKeywords.slice(0, 30),
        missing: missingKeywords.slice(0, 30),
        extra: extraKeywords.slice(0, 20),
        matchPercentage: Math.round(matchPercentage * 10) / 10,
        totalJDKeywords: jdTokens.size,
        totalResumeKeywords: resumeTokens.size,
        overlapCount: matchedKeywords.length
    };
}
