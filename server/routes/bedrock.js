import { Router } from 'express';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient, BEDROCK_MODEL_ID } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// --- Helpers ---

async function invokeBedrockWithRetry(systemPrompt, userMessage, maxRetries = 3) {
    const isAnthropic = BEDROCK_MODEL_ID.includes('anthropic');

    let payload;
    if (isAnthropic) {
        payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        };
    } else {
        // Amazon Nova / Titan format
        payload = {
            messages: [
                { role: 'user', content: [{ text: userMessage }] },
            ],
            system: [{ text: systemPrompt }],
            inferenceConfig: { maxTokens: 4096, temperature: 0.7 },
        };
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const command = new InvokeModelCommand({
                modelId: BEDROCK_MODEL_ID,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            const response = await bedrockClient.send(command);
            const body = JSON.parse(new TextDecoder().decode(response.body));

            // Extract text based on model type
            let text;
            if (isAnthropic) {
                text = body?.content?.[0]?.text;
            } else {
                text = body?.output?.message?.content?.[0]?.text;
            }
            if (!text) throw new Error('Empty Bedrock response');

            // Try to parse as JSON, fallback to raw text
            try {
                return JSON.parse(text);
            } catch {
                return { text };
            }
        } catch (err) {
            if (attempt === maxRetries) throw err;
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw new Error('All retry attempts exhausted');
}

// --- POST /api/bedrock/chat ---
router.post('/chat', authenticate, async (req, res) => {
    try {
        const { message, context, niche, creatorProfile } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const systemPrompt = `You are "The Algorithm" — a sentient AI content strategist for Indian Gen-Z creators.
You specialize in the "${niche || 'general'}" niche.
${creatorProfile ? `Creator profile: ${creatorProfile}` : ''}
${context ? `Conversation context: ${context}` : ''}
Speak in Hinglish naturally. Be edgy, specific, data-driven. No corporate fluff.
Always give hyper-specific, actionable advice.`;

        const data = await invokeBedrockWithRetry(systemPrompt, message);
        res.json(data);
    } catch (err) {
        console.error('Bedrock chat error:', err.message);
        res.status(500).json({ error: 'AI chat failed. Try again.' });
    }
});

// --- POST /api/bedrock/trends ---
router.post('/trends', authenticate, async (req, res) => {
    try {
        const { niche, region, platform } = req.body;
        if (!niche) return res.status(400).json({ error: 'Niche is required' });

        const systemPrompt = `You are a viral content trend analyst specializing in the Indian market.
Analyze current trends for "${niche}" in ${region || 'Pan-India'} on ${platform || 'YouTube'}.
Return a valid JSON object with these exact keys:
{
  "trendingTopics": [{ "topic": string, "score": number 0-100, "trajectory": "rising"|"peaking"|"declining", "description": string, "suggestedFormat": string, "engagementPotential": string, "predictedPeakTime": string }],
  "viralSignals": [string],
  "contentAngles": [string],
  "urgencyScore": number 0-100
}
Return 8 trending topics. Use current cultural references. Be hyper-specific.`;

        const userMsg = `Analyze trending topics in the "${niche}" niche for ${region || 'India'} on ${platform || 'YouTube'}. Give me the trending topics, viral signals, content angles, and urgency score.`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock trends error:', err.message);
        res.status(500).json({ error: 'Failed to analyze trends' });
    }
});

// --- POST /api/bedrock/script ---
router.post('/script', authenticate, async (req, res) => {
    try {
        const { topic, niche, tone, duration, creatorVoice, language } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });

        const systemPrompt = `You are a top YouTube scriptwriter for Indian creators.
Write a high-retention ${duration || '60-second'} script in ${language || 'Hinglish (Hindi-English mix)'} for the "${niche || 'general'}" niche.
Tone: ${tone || 'Energetic and edgy'}.
${creatorVoice ? `Match this creator's voice style: ${creatorVoice}` : ''}
Include hooks, pattern interrupts, and CTAs.
Return a valid JSON object:
{
  "title": string,
  "hook": string,
  "sections": [{ "type": "intro"|"point"|"transition"|"climax"|"cta", "text": string, "duration": string, "notes": string }],
  "cta": string,
  "estimatedRetention": number,
  "music": { "genre": string, "bpm": number, "mood": string }
}`;

        const userMsg = `Write a viral script about: "${topic}"`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock script error:', err.message);
        res.status(500).json({ error: 'Failed to generate script' });
    }
});

// --- POST /api/bedrock/growth ---
router.post('/growth', authenticate, async (req, res) => {
    try {
        const { metrics, recentVideos, niche } = req.body;

        const systemPrompt = `You are a YouTube growth strategist specializing in the Indian creator economy.
Niche: "${niche || 'general'}".
Analyze the provided metrics and identify issues and opportunities.
Return a valid JSON object:
{
  "retentionDrops": [{ "timestamp": string, "dropPercentage": number, "reason": string, "fix": string }],
  "anomalies": [{ "metric": string, "expected": string, "actual": string, "severity": "high"|"medium"|"low", "explanation": string }],
  "recommendations": [{ "title": string, "description": string, "priority": number, "expectedImpact": string, "type": string }],
  "pivotSuggestions": [string],
  "overallScore": number,
  "summary": string
}
Be specific — reference exact data points. Use Hinglish mix naturally.`;

        const userMsg = `Analyze these metrics: ${JSON.stringify(metrics || {})}
Recent videos: ${JSON.stringify((recentVideos || []).slice(0, 5))}`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock growth error:', err.message);
        res.status(500).json({ error: 'Failed to analyze growth' });
    }
});

// --- POST /api/bedrock/refactor ---
router.post('/refactor', authenticate, async (req, res) => {
    try {
        const { currentRoadmap, failures, metrics, niche } = req.body;

        const systemPrompt = `You are "The Algorithm" — a content strategy AI that rewrites roadmaps when creators fail.
Niche: "${niche || 'general'}".
Analyze what went wrong and create a NEW 10-day content roadmap.
Return a valid JSON object:
{
  "analysis": { "whatFailed": [string], "whyItFailed": [string], "keyInsights": [string] },
  "newRoadmap": [{ "day": number, "title": string, "trendScore": number, "trajectory": string, "script": { "hook": string, "body": string, "captions": [string], "music": { "genre": string, "bpm": number, "mood": string } } }],
  "pivotStrategy": string,
  "expectedImprovement": string
}
Be specific. Every day must have a complete viral script in Hinglish.`;

        const userMsg = `Current roadmap that failed: ${JSON.stringify(currentRoadmap || [])}
Failures: ${JSON.stringify(failures || [])}
Current metrics: ${JSON.stringify(metrics || {})}
Rewrite everything.`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock refactor error:', err.message);
        res.status(500).json({ error: 'Failed to refactor roadmap' });
    }
});

// --- POST /api/bedrock/synthesize (backward compat with notebook) ---
router.post('/synthesize', authenticate, async (req, res) => {
    try {
        const { notes, niche, channelContext } = req.body;
        if (!notes) return res.status(400).json({ error: 'Notes are required' });

        const systemPrompt = `You are "The Algorithm" — synthesizing raw notes into viral-ready scripts for Indian Gen-Z.
Use Hinglish naturally. Be edgy, specific, anti-boring.
Niche: "${niche || 'general'}".
${channelContext ? `Channel context: ${channelContext}` : ''}
Return a valid JSON object:
{
  "script": {
    "hook": string,
    "body": string,
    "captions": [string (4 items)],
    "music": { "genre": string, "bpm": number, "mood": string }
  }
}`;

        const userMsg = `Synthesize a ready-to-film viral script from these notes:\n${notes}`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock synthesize error:', err.message);
        res.status(500).json({ error: 'Failed to synthesize script' });
    }
});

// --- POST /api/bedrock/anomaly-detection (backward compat with growth) ---
router.post('/anomaly-detection', authenticate, async (req, res) => {
    try {
        const { niche, videoTitle, videoDescription, duration, viewCount, avgViewDuration, avgViewPercentage } = req.body;

        const systemPrompt = `You are an expert video retention analyst for Indian Gen-Z content creators.
Analyze video metrics and identify specific drop-off points with actionable reasons.
Use Hinglish naturally. Be brutally honest about what's losing viewers.
Return a valid JSON object:
{
  "anomalies": [{ "time": string, "drop": string, "reason": string, "severity": string, "recommendation": string }],
  "overallScore": number,
  "summary": string
}`;

        const userMsg = `Analyze this video:
Title: "${videoTitle || 'Untitled'}"
Description: "${videoDescription || 'No description'}"
Duration: ${duration || 60}s | Views: ${viewCount || 0}
Avg View Duration: ${avgViewDuration || 0}s | Avg View %: ${avgViewPercentage || 0}%
Niche: ${niche || 'general'}`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock anomaly error:', err.message);
        res.status(500).json({ error: 'Failed to analyze video' });
    }
});

// --- POST /api/bedrock/growth-recommendations (backward compat) ---
router.post('/growth-recommendations', authenticate, async (req, res) => {
    try {
        const { niche, channelStats, recentPerformance, demographics, topVideos } = req.body;

        const systemPrompt = `You are "The Algorithm" — an AI growth strategist for Indian Gen-Z creators.
Give specific, data-driven advice. Reference actual metrics. Use Hinglish naturally.
Return a valid JSON object:
{
  "recommendations": [{ "title": string, "description": string, "rationale": string, "priority": number, "expectedImpact": string, "type": string }],
  "optimalPostingTimes": [{ "day": string, "time": string, "reason": string }],
  "overallStrategy": string
}`;

        const userMsg = `Generate growth recommendations:
Niche: ${niche || 'general'}
Stats: ${JSON.stringify(channelStats || {})}
Recent 28d: ${JSON.stringify(recentPerformance || {})}
Demographics: ${JSON.stringify(demographics || {})}
Top Videos: ${JSON.stringify((topVideos || []).slice(0, 5))}`;

        const data = await invokeBedrockWithRetry(systemPrompt, userMsg);
        res.json(data);
    } catch (err) {
        console.error('Bedrock growth-rec error:', err.message);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

export default router;
