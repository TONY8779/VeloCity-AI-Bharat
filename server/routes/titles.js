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
            generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.8 },
        }),
    }).then(r => r.json()).then(d => {
        const t = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        return t ? JSON.parse(t) : null;
    });
}

// POST /api/titles/generate
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { topic, niche } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic required' });

        const prompt = `Generate SEO-optimized content for a video about "${topic}" in the "${niche}" niche.

Provide:
1. 8 title suggestions with SEO score (1-10) and reasoning for each
2. A complete SEO-optimized description (500+ characters) with keywords naturally embedded
3. 20 relevant tags
4. 3 A/B test pairs (variant A vs variant B) with hypothesis for each

Titles should be click-worthy, emotional, and SEO-friendly.
For Indian Gen-Z creators. Mix Hinglish when it feels natural.`;

        const sys = `You are a YouTube SEO specialist and title optimization expert.
Every title should maximize both CTR and search discoverability.
Use power words, numbers, and emotional triggers in titles.
Be specific and actionable.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                titles: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            title: { type: 'STRING' },
                            seoScore: { type: 'INTEGER' },
                            reasoning: { type: 'STRING' },
                        },
                        required: ['title', 'seoScore'],
                    },
                },
                description: { type: 'STRING' },
                tags: { type: 'ARRAY', items: { type: 'STRING' } },
                abTests: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            variantA: { type: 'STRING' },
                            variantB: { type: 'STRING' },
                            hypothesis: { type: 'STRING' },
                        },
                        required: ['variantA', 'variantB', 'hypothesis'],
                    },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('Titles error:', err.message);
        res.status(500).json({ error: 'Failed to generate titles' });
    }
});

export default router;
