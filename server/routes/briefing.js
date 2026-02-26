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
                temperature: 0.9,
            },
        }),
    })
        .then(r => r.json())
        .then(data => {
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text ? JSON.parse(text) : null;
        });
}

// Cache briefings per user per day
const briefingCache = new Map();

// POST /api/briefing/generate
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { niche } = req.body;
        if (!niche) return res.status(400).json({ error: 'Niche is required' });

        const userId = req.user.id || req.user._id;
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `${userId}_${today}`;

        if (briefingCache.has(cacheKey)) {
            return res.json(briefingCache.get(cacheKey));
        }

        const now = new Date();
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = now.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

        const prompt = `Generate a comprehensive daily content briefing for a "${niche}" creator in India.
Today is ${dayOfWeek}, ${dateStr}.

Provide:
1. Top 3 content opportunities for TODAY (with urgency: high/medium/low)
2. 5 pre-written hooks they can use immediately (each with best platform)
3. 4 trending audio/sounds right now (name, genre, trending status)
4. 4 best posting time windows for today (specific times in IST, with platform and reasoning)
5. 3 content recommendations based on what performs well right now

Make everything hyper-specific to Indian Gen-Z creators. Use Hinglish naturally.
Hooks should be scroll-stopping and ready to use.`;

        const sys = `You are the ultimate daily content intelligence briefing system.
Every recommendation must be immediately actionable — no filler.
Think like a personal content strategist who knows the creator's niche deeply.
Use Hinglish naturally. Be specific with times, trends, and strategies.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                opportunities: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            topic: { type: 'STRING' },
                            description: { type: 'STRING' },
                            urgency: { type: 'STRING' },
                        },
                        required: ['topic', 'description', 'urgency'],
                    },
                },
                hooks: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            text: { type: 'STRING' },
                            platform: { type: 'STRING' },
                        },
                        required: ['text', 'platform'],
                    },
                },
                trendingAudio: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            name: { type: 'STRING' },
                            genre: { type: 'STRING' },
                            uses: { type: 'STRING' },
                            trending: { type: 'STRING' },
                        },
                        required: ['name', 'genre'],
                    },
                },
                postingWindows: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            time: { type: 'STRING' },
                            platform: { type: 'STRING' },
                            reason: { type: 'STRING' },
                        },
                        required: ['time', 'platform', 'reason'],
                    },
                },
                contentRecs: {
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
            },
        };

        const data = await callGemini(prompt, sys, schema);
        if (data) briefingCache.set(cacheKey, data);
        res.json(data);
    } catch (err) {
        console.error('Briefing error:', err.message);
        res.status(500).json({ error: 'Failed to generate briefing' });
    }
});

export default router;
