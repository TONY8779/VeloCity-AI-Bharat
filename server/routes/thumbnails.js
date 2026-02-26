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
            generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.9 },
        }),
    }).then(r => r.json()).then(d => {
        const t = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        return t ? JSON.parse(t) : null;
    });
}

// POST /api/thumbnails/generate
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { title, niche } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });

        const prompt = `Generate 5 thumbnail design variations for a video titled "${title}" in the "${niche}" niche.
For each thumbnail provide:
1. A variant number (1-5)
2. Overlay text (short, punchy, max 5 words)
3. Subtext overlay (optional badge text like "SHOCKING", "MUST WATCH")
4. Suggested text color (hex)
5. Background gradient CSS
6. Face expression suggestion (for face cam)
7. CTR prediction score (1-10)
8. 3 specific design suggestions

Make thumbnails optimized for Indian Gen-Z creators. High contrast, bold text, emotion-driven.`;

        const sys = `You are an expert thumbnail designer and CTR optimization specialist.
Design thumbnails that maximize clicks. Use psychology-driven design.
Provide specific, production-ready suggestions.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                thumbnails: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            variant: { type: 'INTEGER' },
                            overlayText: { type: 'STRING' },
                            subtextOverlay: { type: 'STRING' },
                            textColor: { type: 'STRING' },
                            bgGradient: { type: 'STRING' },
                            faceExpression: { type: 'STRING' },
                            ctrScore: { type: 'INTEGER' },
                            suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
                        },
                        required: ['variant', 'overlayText', 'ctrScore'],
                    },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('Thumbnail error:', err.message);
        res.status(500).json({ error: 'Failed to generate thumbnails' });
    }
});

export default router;
