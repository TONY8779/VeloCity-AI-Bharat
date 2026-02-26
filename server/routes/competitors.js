import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function callGemini(prompt, systemInstruction, schema) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.8,
            },
        }),
    })
        .then(r => r.json())
        .then(data => {
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text ? JSON.parse(text) : null;
        });
}

// In-memory competitor storage per user
const competitorStore = new Map();

// POST /api/competitors/add
router.post('/add', authenticate, async (req, res) => {
    try {
        const { channelUrl, niche } = req.body;
        if (!channelUrl) return res.status(400).json({ error: 'Channel URL required' });

        const userId = req.user.id || req.user._id;
        if (!competitorStore.has(userId)) competitorStore.set(userId, []);

        const list = competitorStore.get(userId);
        if (list.length >= 10) return res.status(400).json({ error: 'Maximum 10 competitors' });

        const name = channelUrl.replace(/^https?:\/\/(www\.)?youtube\.com\/@?/, '').replace(/\/$/, '') || channelUrl;

        const competitor = {
            name,
            url: channelUrl,
            addedAt: new Date().toISOString(),
            subscribers: 'Analyzing...',
        };

        list.push(competitor);
        res.json({ competitor });
    } catch (err) {
        console.error('Add competitor error:', err.message);
        res.status(500).json({ error: 'Failed to add competitor' });
    }
});

// GET /api/competitors
router.get('/', authenticate, (req, res) => {
    const userId = req.user.id || req.user._id;
    res.json({ competitors: competitorStore.get(userId) || [] });
});

// POST /api/competitors/analyze
router.post('/analyze', authenticate, async (req, res) => {
    try {
        const { competitors, niche } = req.body;
        if (!competitors || competitors.length === 0) return res.status(400).json({ error: 'Competitors required' });

        const prompt = `Analyze these competitor content creators in the "${niche}" niche: ${competitors.join(', ')}

Provide:
1. "What's Working" - 4 strategies these competitors use successfully (with specific examples like hooks, formats, posting times)
2. "Gap Analysis" - 4 opportunities they're NOT covering that a creator could exploit
3. "Alerts" - 3 recent important moves by these competitors

Be specific and actionable. Use Hinglish naturally for Indian creators.`;

        const sys = `You are an elite competitive intelligence analyst for content creators.
Provide brutally honest, specific, data-driven competitor analysis.
Every insight should be immediately actionable. Use Hinglish naturally.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                whatsWorking: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            title: { type: 'STRING' },
                            description: { type: 'STRING' },
                        },
                        required: ['title', 'description'],
                    },
                },
                gaps: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            opportunity: { type: 'STRING' },
                            reasoning: { type: 'STRING' },
                        },
                        required: ['opportunity', 'reasoning'],
                    },
                },
                alerts: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('Competitor analysis error:', err.message);
        res.status(500).json({ error: 'Failed to analyze competitors' });
    }
});

export default router;
