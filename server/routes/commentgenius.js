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
        if (data?.analyzed) return res.json(data);
        throw new Error('No analysis data');
    } catch (err) {
        console.error('CommentGenius error:', err.message);
        // Parse comments and return basic analysis
        const { comments: rawComments } = req.body;
        const lines = (rawComments || '').split('\n').filter(c => c.trim());
        const analyzed = lines.map((text, i) => {
            const lower = text.toLowerCase();
            const isNeg = /trash|hate|worst|bad|boring|fake|scam|unsubscribe/i.test(lower);
            const isSpammy = /check out my|subscribe to my|follow me|free|click here|link in/i.test(lower);
            const isPos = /great|love|amazing|best|awesome|fire|🔥|❤️|perfect|thanks|thank/i.test(lower);
            const sentiment = isSpammy ? 'spam' : isNeg ? 'negative' : isPos ? 'positive' : 'neutral';
            return {
                text: text.trim(),
                sentiment,
                isSpam: isSpammy,
                shouldPin: isPos && !isSpammy && text.length > 15,
                suggestedReply: isPos ? `Thank you so much! 🙏 Aise support karte raho — next video aur bhi fire hoga!`
                    : isNeg ? `Feedback ke liye shukriya! Apna best de rahe hain, agle video mein improve karenge 💪`
                        : isSpammy ? ''
                            : `Thanks for watching! Agar video pasand aaya toh like karo aur share karo! 🔔`,
            };
        });
        res.json({
            analyzed,
            engagementTips: [
                'Pin the most engaging question comment — it drives more replies',
                'Reply to negative comments positively — it shows maturity and gains respect',
                'Ask a question in your video to encourage more comments',
                'Reply within first 30 mins for maximum algorithm boost',
                'Heart the supportive comments — your fans will keep coming back',
            ],
        });
    }
});

export default router;
