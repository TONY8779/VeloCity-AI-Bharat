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

// POST /api/trends/analyze
router.post('/analyze', authenticate, async (req, res) => {
    try {
        const { niche, platform } = req.body;
        if (!niche) return res.status(400).json({ error: 'Niche is required' });

        const prompt = `Analyze current trending topics across social media for the "${niche}" niche.
${platform && platform !== 'all' ? `Focus specifically on ${platform} trends.` : 'Cover Twitter/X, YouTube, and Reddit.'}

For each trend provide:
1. The trending topic/hashtag
2. Which platform it's trending on
3. A velocity score (0-100) measuring how fast it's growing
4. Trajectory (rising/peaking/declining)
5. Peak prediction (when it will peak, e.g., "in 12 hours", "in 48 hours")
6. Lifespan in days (estimated)
7. Why it's going viral (detailed analysis)
8. 3 content hook ideas a creator can use

Provide 8-10 trends. Be specific to Indian Gen-Z creators.`;

        const sys = `You are a real-time trend intelligence engine for content creators.
Your job is to identify viral trends and explain WHY they're viral.
Be specific, actionable, and use Hinglish naturally for Indian creators.
Predict trend lifecycle accurately based on pattern matching.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                trends: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            topic: { type: 'STRING' },
                            platform: { type: 'STRING' },
                            velocityScore: { type: 'INTEGER' },
                            trajectory: { type: 'STRING' },
                            peakPrediction: { type: 'STRING' },
                            lifespanDays: { type: 'INTEGER' },
                            whyViral: { type: 'STRING' },
                            hookIdeas: { type: 'ARRAY', items: { type: 'STRING' } },
                        },
                        required: ['topic', 'platform', 'velocityScore', 'trajectory', 'whyViral'],
                    },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('Trends error:', err.message);
        res.status(500).json({ error: 'Failed to analyze trends' });
    }
});

export default router;
