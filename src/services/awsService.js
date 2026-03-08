import { api } from './api';

// --- Response cache ---
const cache = new Map();
const TREND_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) return entry.data;
    cache.delete(key);
    return null;
}

function setCache(key, data, ttl = TREND_CACHE_TTL) {
    cache.set(key, { data, timestamp: Date.now(), ttl });
}

// --- Retry logic ---
async function withRetry(fn, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 500));
        }
    }
}

// --- Bedrock (AI) ---

export async function chatWithAlgorithm(message, context) {
    return withRetry(() => api.post('/api/bedrock/chat', { message, context }));
}

export async function getTrendAnalysis(niche, region) {
    const cacheKey = `trends-${niche}-${region}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    const data = await withRetry(() => api.post('/api/bedrock/trends', { niche, region }));
    setCache(cacheKey, data);
    return data;
}

export async function generateScript(params) {
    return withRetry(() => api.post('/api/bedrock/script', params));
}

export async function getGrowthCoaching(metrics) {
    return withRetry(() => api.post('/api/bedrock/growth', metrics));
}

export async function refactorRoadmap(params) {
    return withRetry(() => api.post('/api/bedrock/refactor', params));
}

// Backward-compatible with existing notebook/roadmap calls
export async function fetchRoadmap(niche, channelContext) {
    try {
        // Use a timeout to avoid long hangs when Bedrock is unavailable
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        const fetchPromise = api.post('/api/bedrock/synthesize', {
            notes: `Generate a 10-day roadmap for ${niche}`,
            niche,
            channelContext,
        });
        const data = await Promise.race([fetchPromise, timeoutPromise]);
        // Validate response has roadmap array, otherwise use fallback
        if (data?.roadmap && Array.isArray(data.roadmap) && data.roadmap.length > 0) {
            return data;
        }
        return generateFallbackRoadmap(niche);
    } catch {
        return generateFallbackRoadmap(niche);
    }
}

export async function synthesizeScript(notes, niche, channelContext) {
    try {
        return await withRetry(() => api.post('/api/bedrock/synthesize', { notes, niche, channelContext }));
    } catch {
        return {
            script: {
                hook: "Bhai ye trick kisi ko mat batana... ",
                body: `Main tere notes padh ke ek killer script banaya hai. ${niche} mein abhi ye trend chal raha hai aur tere notes perfectly fit karte hain.`,
                captions: ["YE MAT BATANA", "TREND ALERT", "RESULT FIRST", "FOLLOW NOW"],
                music: { genre: "Lo-Fi Hip Hop", bpm: 90, mood: "Focused" },
            },
        };
    }
}

export async function getAnomalyDetection(data) {
    return withRetry(() => api.post('/api/bedrock/anomaly-detection', data));
}

export async function getGrowthRecommendations(data) {
    return withRetry(() => api.post('/api/bedrock/growth-recommendations', data));
}

export async function getTrends(niche, channelContext) {
    return withRetry(() => api.post('/api/bedrock/trends', { niche, channelContext }));
}

// --- S3 (Storage) ---

export async function uploadFile(file, type = 'assets') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.upload('/api/s3/upload', formData);
}

export async function getPresignedUrl(filename, type = 'assets') {
    return withRetry(() => api.post('/api/s3/presigned', { filename, type }));
}

export async function getUserFiles(userId) {
    return withRetry(() => api.get(`/api/s3/files/${userId}`));
}

// --- Transcribe (Captions) ---

export async function startTranscription(s3Key, language = 'hi-IN') {
    return withRetry(() => api.post('/api/transcribe/start', { s3Key, languageCode: language }));
}

export async function getTranscriptionStatus(jobId) {
    return api.get(`/api/transcribe/status/${jobId}`);
}

// --- Rekognition (Thumbnails) ---

export async function analyzeThumbnail(s3Key) {
    return withRetry(() => api.post('/api/rekognition/analyze-thumbnail', { s3Key }));
}

export async function compareThumbnails(s3Keys) {
    return withRetry(() => api.post('/api/rekognition/compare-thumbnails', { s3Keys }));
}

export async function detectContent(s3Key) {
    return withRetry(() => api.post('/api/rekognition/detect-content', { s3Key }));
}

// --- Polly (Voice) ---

export async function synthesizeSpeech(text, voiceId = 'Kajal') {
    return withRetry(() => api.post('/api/polly/synthesize', { text, voiceId }));
}

export async function getTeleprompterAudio(sections, voiceId = 'Kajal') {
    return withRetry(() => api.post('/api/polly/teleprompter-audio', { scriptSections: sections, voiceId }));
}

export async function getVoices() {
    return api.get('/api/polly/voices');
}

// --- Comprehend (Comments) ---

export async function analyzeComments(comments) {
    return withRetry(() => api.post('/api/comprehend/analyze-comments', { comments }));
}

export async function analyzeScript(script) {
    return withRetry(() => api.post('/api/comprehend/analyze-script', { script }));
}

// --- Translate ---

export async function translateText(text, sourceLanguage, targetLanguage) {
    return withRetry(() => api.post('/api/translate/text', { text, sourceLanguage, targetLanguage }));
}

export async function translateScript(script, targetLanguage) {
    return withRetry(() => api.post('/api/translate/script', { script, targetLanguage }));
}

export async function batchTranslate(texts, targetLanguages) {
    return withRetry(() => api.post('/api/translate/batch', { texts, targetLanguages }));
}

export async function getLanguages() {
    return api.get('/api/translate/languages');
}

// --- DynamoDB (Persistence) ---

export async function saveCreatorProfile(data) {
    return api.post('/api/db/creator', data);
}

export async function getCreatorProfile(userId) {
    return api.get(`/api/db/creator/${userId}`);
}

export async function saveScript(data) {
    return api.post('/api/db/script', data);
}

export async function getScripts(userId) {
    return api.get(`/api/db/scripts/${userId}`);
}

export async function saveAnalytics(data) {
    return api.post('/api/db/analytics', data);
}

export async function getAnalytics(userId) {
    return api.get(`/api/db/analytics/${userId}`);
}

export async function getCachedTrends(niche) {
    return api.get(`/api/db/trends/${niche}`);
}

export async function cacheTrends(data) {
    return api.post('/api/db/trends', data);
}

// --- Metrics ---

export async function getAWSMetrics() {
    return api.get('/api/metrics');
}

export async function getHealthStatus() {
    return api.get('/api/health');
}

// --- Fallback ---

function generateFallbackRoadmap(niche) {
    return {
        roadmap: Array.from({ length: 10 }, (_, i) => ({
            day: i + 1,
            title: [`${niche} ka sabse bada secret`, `Maine ${niche} mein galti ki`, `${niche} 101: Beginners`, `Controversial ${niche} take`, `${niche} se paise kaise`, `Top 5 ${niche} hacks`, `${niche} Q&A`, `${niche} setup tour`, `${niche} trends 2025`, `${niche} 24hr challenge`][i],
            trendScore: Math.floor(Math.random() * 15) + 85,
            trajectory: ['rising', 'rising', 'peaking', 'rising', 'peaking', 'rising', 'declining', 'rising', 'peaking', 'rising'][i],
            script: {
                hook: ["Ruko ruko... ye dekho!", "Ye galti maine bhi ki thi...", "Agar ye nahi jaante toh missing out!", "Log hate karenge for this but...", "Ye trick se paise aa rahe", "Koi nahi batayega ye!", "Tumne pucha, maine deliver kiya", "Behind the scenes! Let's go!", "2025 mein ye hoga — ready ho jao", "24 hours mein kar ke dikhaya!"][i],
                body: `${niche} mein abhi jo trend chal raha hai, usse bohot log miss kar rahe hain. Main exactly bataunga kaise leverage karo. Step by step — koi fluff nahi.`,
                captions: ["RUKO!", `${niche.toUpperCase()} SECRET`, "WATCH TILL END", "FOLLOW"],
                music: { genre: "Trap Beat", bpm: 140, mood: "Energetic" },
            },
        })),
    };
}

// --- Legacy compatibility (drop-in replacement for geminiService) ---
export const awsService = {
    fetchRoadmap,
    synthesizeScript,
    getAnomalyDetection,
    getGrowthRecommendations,
    getTrends,
};
