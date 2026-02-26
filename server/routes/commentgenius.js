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
            generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.7 },
        }),
    }).then(r => r.json()).then(d => {
        const t = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        return t ? JSON.parse(t) : null;
    });
}

// POST /api/commentgenius/analyze
router.post('/analyze', authenticate, async (req, res) => {
    try {
        const { comments, niche } = req.body;
        if (!comments) return res.status(400).json({ error: 'Comments required' });

        const prompt = `Analyze these comments from a "${niche}" content creator's post:

${comments}

For each comment, provide:
1. The original comment text
2. Sentiment (positive/negative/neutral/spam)
3. Whether it's spam/troll (boolean)
4. Whether it should be pinned (boolean) - pin if it's a great question, supportive, or drives engagement
5. A suggested auto-reply that sounds human, warm, and engages the commenter

Also provide 5 general engagement boost tips for this creator based on the comment patterns.

Use Hinglish naturally for Indian audience.`;

        const sys = `You are an expert community manager and engagement strategist.
Analyze comments with precision — detect spam, identify genuine fans, suggest pin-worthy comments.
Auto-replies should sound human, warm, and encourage further engagement.
Never be generic. Match the creator's voice.`;

        const schema = {
            type: 'OBJECT',
            properties: {
                analyzed: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            text: { type: 'STRING' },
                            sentiment: { type: 'STRING' },
                            isSpam: { type: 'BOOLEAN' },
                            shouldPin: { type: 'BOOLEAN' },
                            suggestedReply: { type: 'STRING' },
                        },
                        required: ['text', 'sentiment', 'suggestedReply'],
                    },
                },
                engagementTips: {
                    type: 'ARRAY',
                    items: { type: 'STRING' },
                },
            },
        };

        const data = await callGemini(prompt, sys, schema);
        res.json(data);
    } catch (err) {
        console.error('CommentGenius error:', err.message);
        res.status(500).json({ error: 'Failed to analyze comments' });
    }
});

export default router;
