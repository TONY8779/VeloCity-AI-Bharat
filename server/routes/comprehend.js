import { Router } from 'express';
import {
    BatchDetectSentimentCommand,
    BatchDetectKeyPhrasesCommand,
    BatchDetectDominantLanguageCommand,
    DetectSentimentCommand,
} from '@aws-sdk/client-comprehend';
import { comprehendClient } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Comprehend batch limit is 25 items
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

// --- POST /api/comprehend/analyze-comments ---
router.post('/analyze-comments', authenticate, async (req, res) => {
    try {
        const { comments } = req.body;
        if (!comments || !Array.isArray(comments) || comments.length === 0) {
            return res.status(400).json({ error: 'Comments array is required' });
        }

        const texts = comments.map(c => (c.text || c).substring(0, 5000)); // Comprehend limit
        const chunks = chunkArray(texts, 25);

        // Run all analyses
        let allSentiments = [];
        let allKeyPhrases = [];
        let allLanguages = [];

        for (const chunk of chunks) {
            const [sentimentResult, phrasesResult, langResult] = await Promise.all([
                comprehendClient.send(new BatchDetectSentimentCommand({ TextList: chunk, LanguageCode: 'en' })),
                comprehendClient.send(new BatchDetectKeyPhrasesCommand({ TextList: chunk, LanguageCode: 'en' })),
                comprehendClient.send(new BatchDetectDominantLanguageCommand({ TextList: chunk })),
            ]);

            allSentiments.push(...(sentimentResult.ResultList || []));
            allKeyPhrases.push(...(phrasesResult.ResultList || []));
            allLanguages.push(...(langResult.ResultList || []));
        }

        // Aggregate sentiment
        const sentimentCounts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, MIXED: 0 };
        const sentimentByComment = [];

        allSentiments.forEach((s, i) => {
            const sentiment = s.Sentiment || 'NEUTRAL';
            sentimentCounts[sentiment]++;
            sentimentByComment.push({
                text: texts[i]?.substring(0, 200),
                sentiment: sentiment.toLowerCase(),
                score: Math.round((s.SentimentScore?.[sentiment.charAt(0) + sentiment.slice(1).toLowerCase()] || 0) * 100),
            });
        });

        const total = texts.length || 1;
        const overallSentiment = {
            positive: Math.round((sentimentCounts.POSITIVE / total) * 100),
            negative: Math.round((sentimentCounts.NEGATIVE / total) * 100),
            neutral: Math.round((sentimentCounts.NEUTRAL / total) * 100),
            mixed: Math.round((sentimentCounts.MIXED / total) * 100),
        };

        // Aggregate key phrases
        const phraseMap = {};
        allKeyPhrases.forEach(r => {
            (r.KeyPhrases || []).forEach(p => {
                const phrase = p.Text?.toLowerCase();
                if (phrase && phrase.length > 2) {
                    phraseMap[phrase] = (phraseMap[phrase] || 0) + 1;
                }
            });
        });
        const topKeyPhrases = Object.entries(phraseMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([phrase, count]) => ({ phrase, count }));

        // Language breakdown
        const langCounts = { hi: 0, en: 0, other: 0 };
        allLanguages.forEach(r => {
            const topLang = (r.Languages || [])[0]?.LanguageCode || 'en';
            if (topLang === 'hi') langCounts.hi++;
            else if (topLang === 'en') langCounts.en++;
            else langCounts.other++;
        });
        const languageBreakdown = {
            hindi: Math.round((langCounts.hi / total) * 100),
            english: Math.round((langCounts.en / total) * 100),
            other: Math.round((langCounts.other / total) * 100),
        };

        // Toxic comments (high negative sentiment)
        const toxicComments = sentimentByComment
            .filter(c => c.sentiment === 'negative' && c.score > 70)
            .map(c => ({ text: c.text, reason: 'High negative sentiment' }));

        // Generate insights
        const insights = [];
        if (overallSentiment.positive > 60) insights.push('Your audience is highly positive — keep doing what you\'re doing!');
        if (overallSentiment.negative > 30) insights.push('Significant negative sentiment detected — check recent content quality');
        if (topKeyPhrases.length > 0) insights.push(`Most discussed topic: "${topKeyPhrases[0].phrase}" (${topKeyPhrases[0].count} mentions)`);
        if (languageBreakdown.hindi > 40) insights.push('Strong Hindi-speaking audience — consider more Hindi/Hinglish content');

        res.json({
            overallSentiment,
            sentimentByComment,
            topKeyPhrases,
            languageBreakdown,
            insights: insights.join('. '),
            toxicComments,
            actionableInsights: insights,
            totalAnalyzed: texts.length,
        });
    } catch (err) {
        console.error('Comprehend analyze error:', err.message);
        res.status(500).json({ error: 'Failed to analyze comments' });
    }
});

// --- POST /api/comprehend/analyze-script ---
router.post('/analyze-script', authenticate, async (req, res) => {
    try {
        const { script } = req.body;
        if (!script) return res.status(400).json({ error: 'Script text is required' });

        // Break script into sections for sentiment flow
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
        const sentimentFlow = [];

        // Analyze each sentence (in batches of 25)
        const chunks = chunkArray(sentences.map(s => s.trim()).filter(Boolean), 25);

        for (const chunk of chunks) {
            const result = await comprehendClient.send(
                new BatchDetectSentimentCommand({ TextList: chunk, LanguageCode: 'en' })
            );

            (result.ResultList || []).forEach((s, i) => {
                sentimentFlow.push({
                    text: chunk[i]?.substring(0, 100),
                    sentiment: (s.Sentiment || 'NEUTRAL').toLowerCase(),
                    positiveScore: Math.round((s.SentimentScore?.Positive || 0) * 100),
                    negativeScore: Math.round((s.SentimentScore?.Negative || 0) * 100),
                    position: sentimentFlow.length,
                });
            });
        }

        // Detect dead zones (consecutive neutral/negative sections)
        const deadZones = [];
        let neutralStreak = 0;
        sentimentFlow.forEach((s, i) => {
            if (s.sentiment === 'neutral' || s.sentiment === 'negative') {
                neutralStreak++;
                if (neutralStreak >= 3) {
                    deadZones.push({ start: i - neutralStreak + 1, end: i, message: 'Low engagement zone — add a pattern interrupt here' });
                }
            } else {
                neutralStreak = 0;
            }
        });

        res.json({
            sentimentFlow,
            deadZones,
            overallEngagement: sentimentFlow.filter(s => s.sentiment === 'positive').length / (sentimentFlow.length || 1) * 100,
            totalSections: sentimentFlow.length,
        });
    } catch (err) {
        console.error('Comprehend script error:', err.message);
        res.status(500).json({ error: 'Failed to analyze script' });
    }
});

export default router;
