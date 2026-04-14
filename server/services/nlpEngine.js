// ============================================================
// NLP Engine — Tokenization, Stop-words, Lemmatization
// ============================================================

// Comprehensive English stopwords list
const STOPWORDS = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've",
    "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
    'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's", 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
    'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a',
    'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at',
    'by', 'for', 'with', 'about', 'against', 'between', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
    'can', 'will', 'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm',
    'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't",
    'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn',
    "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan',
    "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won',
    "won't", 'wouldn', "wouldn't", 'also', 'would', 'could', 'may', 'might', 'shall',
    'must', 'need', 'etc', 'e', 'g', 'ie', 'eg', 'vs', 'via', 'able', 'per', 'like',
    'well', 'get', 'got', 'use', 'used', 'using', 'make', 'made', 'work', 'worked',
    'working', 'include', 'including', 'includes', 'included', 'also', 'new', 'many',
    'much', 'even', 'still', 'already', 'yet', 'since', 'rather', 'quite', 'within',
    'without', 'along', 'among', 'around', 'upon', 'across', 'toward', 'towards',
    'though', 'although', 'however', 'therefore', 'thus', 'hence', 'meanwhile',
    'otherwise', 'moreover', 'furthermore', 'nevertheless', 'nonetheless', 'instead',
    'whereby', 'whereas', 'wherein', 'therein', 'thereafter', 'thereby', 'herein',
    'hereto', 'hereunder', 'herewith', 'hereinafter', 'heretofore', 'one', 'two',
    'three', 'four', 'five', 'first', 'second', 'third', 'last', 'next', 'previous'
]);

// Irregular verbs/words for lemmatization
const IRREGULAR_LEMMAS = {
    'ran': 'run', 'running': 'run', 'runs': 'run',
    'went': 'go', 'going': 'go', 'goes': 'go', 'gone': 'go',
    'was': 'be', 'were': 'be', 'been': 'be', 'being': 'be',
    'had': 'have', 'has': 'have', 'having': 'have',
    'did': 'do', 'does': 'do', 'doing': 'do', 'done': 'do',
    'said': 'say', 'says': 'say', 'saying': 'say',
    'made': 'make', 'makes': 'make', 'making': 'make',
    'took': 'take', 'takes': 'take', 'taking': 'take', 'taken': 'take',
    'came': 'come', 'comes': 'come', 'coming': 'come',
    'gave': 'give', 'gives': 'give', 'giving': 'give', 'given': 'give',
    'found': 'find', 'finds': 'find', 'finding': 'find',
    'knew': 'know', 'knows': 'know', 'knowing': 'know', 'known': 'know',
    'thought': 'think', 'thinks': 'think', 'thinking': 'think',
    'told': 'tell', 'tells': 'tell', 'telling': 'tell',
    'became': 'become', 'becomes': 'become', 'becoming': 'become',
    'left': 'leave', 'leaves': 'leave', 'leaving': 'leave',
    'felt': 'feel', 'feels': 'feel', 'feeling': 'feel',
    'put': 'put', 'puts': 'put', 'putting': 'put',
    'brought': 'bring', 'brings': 'bring', 'bringing': 'bring',
    'began': 'begin', 'begins': 'begin', 'beginning': 'begin', 'begun': 'begin',
    'kept': 'keep', 'keeps': 'keep', 'keeping': 'keep',
    'held': 'hold', 'holds': 'hold', 'holding': 'hold',
    'wrote': 'write', 'writes': 'write', 'writing': 'write', 'written': 'write',
    'stood': 'stand', 'stands': 'stand', 'standing': 'stand',
    'lost': 'lose', 'loses': 'lose', 'losing': 'lose',
    'paid': 'pay', 'pays': 'pay', 'paying': 'pay',
    'met': 'meet', 'meets': 'meet', 'meeting': 'meet',
    'set': 'set', 'sets': 'set', 'setting': 'set',
    'led': 'lead', 'leads': 'lead', 'leading': 'lead',
    'built': 'build', 'builds': 'build', 'building': 'build',
    'sent': 'send', 'sends': 'send', 'sending': 'send',
    'spent': 'spend', 'spends': 'spend', 'spending': 'spend',
    'grew': 'grow', 'grows': 'grow', 'growing': 'grow', 'grown': 'grow',
    'won': 'win', 'wins': 'win', 'winning': 'win',
    'taught': 'teach', 'teaches': 'teach', 'teaching': 'teach',
    'drove': 'drive', 'drives': 'drive', 'driving': 'drive', 'driven': 'drive',
    'managed': 'manage', 'manages': 'manage', 'managing': 'manage',
    'developed': 'develop', 'develops': 'develop', 'developing': 'develop',
    'designed': 'design', 'designs': 'design', 'designing': 'design',
    'created': 'create', 'creates': 'create', 'creating': 'create',
    'implemented': 'implement', 'implements': 'implement', 'implementing': 'implement',
    'improved': 'improve', 'improves': 'improve', 'improving': 'improve',
    'analyzed': 'analyze', 'analyzes': 'analyze', 'analyzing': 'analyze',
    'optimized': 'optimize', 'optimizes': 'optimize', 'optimizing': 'optimize',
    'deployed': 'deploy', 'deploys': 'deploy', 'deploying': 'deploy',
    'tested': 'test', 'tests': 'test', 'testing': 'test',
    'maintained': 'maintain', 'maintains': 'maintain', 'maintaining': 'maintain',
    'achieved': 'achieve', 'achieves': 'achieve', 'achieving': 'achieve',
    'delivered': 'deliver', 'delivers': 'deliver', 'delivering': 'deliver',
    'collaborated': 'collaborate', 'collaborates': 'collaborate', 'collaborating': 'collaborate',
    'coordinated': 'coordinate', 'coordinates': 'coordinate', 'coordinating': 'coordinate',
    'established': 'establish', 'establishes': 'establish', 'establishing': 'establish',
    'data': 'data', 'datum': 'data',
    'analyses': 'analysis', 'analytics': 'analytics',
    'technologies': 'technology', 'strategies': 'strategy',
    'companies': 'company', 'activities': 'activity',
    'abilities': 'ability', 'responsibilities': 'responsibility',
    'communities': 'community', 'opportunities': 'opportunity',
    'universities': 'university', 'facilities': 'facility',
    'children': 'child', 'people': 'person', 'men': 'man', 'women': 'woman'
};

/**
 * Process raw text through the full NLP pipeline
 * @param {string} text - Raw text input
 * @returns {Object} - Processed NLP data
 */
export function processText(text) {
    const cleaned = cleanText(text);
    const tokens = tokenize(cleaned);
    const filtered = removeStopwords(tokens);
    const lemmatized = filtered.map(lemmatize);
    const bigrams = generateBigrams(filtered);

    return {
        original: text,
        cleaned,
        tokens,
        filtered,
        lemmatized,
        bigrams,
        tokenCount: tokens.length,
        uniqueTokens: new Set(lemmatized).size
    };
}

/**
 * Clean text — lowercase, remove special chars but preserve meaningful characters
 */
function cleanText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s\.\+\#\-\/]/g, ' ')  // keep dots, +, #, -, / for tech terms
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Tokenize text into words
 */
function tokenize(text) {
    return text
        .split(/\s+/)
        .filter(token => token.length > 1 || token === 'c' || token === 'r'); // keep single-char lang names
}

/**
 * Remove stopwords from token array
 */
function removeStopwords(tokens) {
    return tokens.filter(token => !STOPWORDS.has(token) && token.length > 1);
}

/**
 * Simple rule-based lemmatizer
 */
function lemmatize(word) {
    // Check irregular lemma dictionary first
    if (IRREGULAR_LEMMAS[word]) return IRREGULAR_LEMMAS[word];

    // Rule-based suffix stripping
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (word.endsWith('ves') && word.length > 4) return word.slice(0, -3) + 'f';
    if (word.endsWith('ses') && word.length > 4) return word.slice(0, -2);
    if (word.endsWith('ches') || word.endsWith('shes')) return word.slice(0, -2);
    if (word.endsWith('xes') || word.endsWith('zes')) return word.slice(0, -2);
    if (word.endsWith('ness') && word.length > 5) return word.slice(0, -4);
    if (word.endsWith('ment') && word.length > 5) return word.slice(0, -4);
    if (word.endsWith('tion') && word.length > 5) return word.slice(0, -4) + 'te';
    if (word.endsWith('sion') && word.length > 5) return word.slice(0, -4) + 'd';
    if (word.endsWith('ated') && word.length > 5) return word.slice(0, -1);
    if (word.endsWith('ting') && word.length > 4) return word.slice(0, -3) + 'te';
    if (word.endsWith('ing') && word.length > 4) return word.slice(0, -3);
    if (word.endsWith('ed') && word.length > 3) return word.slice(0, -2);
    if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2);
    if (word.endsWith('er') && word.length > 3) return word.slice(0, -2);
    if (word.endsWith('est') && word.length > 4) return word.slice(0, -3);
    if (word.endsWith('ful') && word.length > 4) return word.slice(0, -3);
    if (word.endsWith('less') && word.length > 5) return word.slice(0, -4);
    if (word.endsWith('able') && word.length > 5) return word.slice(0, -4);
    if (word.endsWith('ible') && word.length > 5) return word.slice(0, -4);
    if (word.endsWith('ous') && word.length > 4) return word.slice(0, -3);
    if (word.endsWith('ive') && word.length > 4) return word.slice(0, -3);
    if (word.endsWith('al') && word.length > 3) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);

    return word;
}

/**
 * Generate bigrams from token array for multi-word skill matching
 */
function generateBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
}

export { STOPWORDS, tokenize, removeStopwords, lemmatize, cleanText };
