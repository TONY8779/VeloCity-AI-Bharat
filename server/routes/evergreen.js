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

// POST /api/evergreen/analyze
router.post('/analyze', authenticate, async (req, res) => {
    try {
        const { content, niche } = req.body;
        if (!content) return res.status(400).json({ error: 'Content required' });

        const prompt = `Analyze this content for evergreen potential and generate repurposing strategies:

Content: "${content}"
Niche: "${niche}"

Provide:
1. Performance score (1-10) for evergreen potential
2. Performance analysis text
3. 4 repurposing strategies (from format → to format with how-to)
4. 5 platform-specific variations (YouTube Short, Instagram Reel, Twitter thread, LinkedIn post, TikTok) with full ready-to-post content
5. Tips for each platform variation

For Indian Gen-Z creators. Use Hinglish naturally where it fits.`;

        const sys = `You are a content repurposing expert who maximizes ROI from every piece of content.
Generate COMPLETE, ready-to-post variations — not just summaries.
Each platform variation should be optimized for that platform's algorithm and audience.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                performanceScore: { type: 'INTEGER' },
                performanceAnalysis: { type: 'STRING' },
                strategies: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            from: { type: 'STRING' },
                            to: { type: 'STRING' },
                            howTo: { type: 'STRING' },
                        },
                        required: ['from', 'to', 'howTo'],
                    },
                },
                variations: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            platform: { type: 'STRING' },
                            content: { type: 'STRING' },
                            tips: { type: 'STRING' },
                        },
                        required: ['platform', 'content'],
                    },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('Evergreen error:', err.message);
        res.status(500).json({ error: 'Failed to analyze content' });
    }
});

export default router;
