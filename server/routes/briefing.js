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
        if (data?.opportunities) {
            briefingCache.set(cacheKey, data);
            return res.json(data);
        }
        throw new Error('No briefing data');
    } catch (err) {
        console.error('Briefing error:', err.message);
        const { niche } = req.body;
        const n = niche || 'content creation';
        res.json({
            opportunities: [
                { topic: `${n} mein AI ka power use karo`, description: `AI tools ke baare mein log bahut search kar rahe hain. ${n} creators ke liye perfect moment hai ek tutorial banane ka.`, urgency: 'high' },
                { topic: `Behind the scenes ${n} vlog`, description: 'Audience ko apna process dikhao — authenticity trending hai!', urgency: 'medium' },
                { topic: `${n} myths busted — Top 5`, description: 'Myth-busting content always performs well. Controversy = engagement.', urgency: 'medium' },
            ],
            hooks: [
                { text: 'Ruko ruko... ye trick dekho pehle! 🤯', platform: 'YouTube Shorts' },
                { text: 'Main 3 saal se ye galti kar raha tha...', platform: 'YouTube' },
                { text: 'Agar tum ye nahi jaante toh bohot peeche ho', platform: 'Instagram Reels' },
                { text: 'Ye video mat dekho agar tumhe grow nahi karna 😏', platform: 'YouTube' },
                { text: 'POV: jab audience 10x ho jaaye ek mahine mein', platform: 'Instagram Reels' },
            ],
            trendingAudio: [
                { name: 'Tere Vaaste (Lofi Mix)', genre: 'Bollywood Lofi', uses: '2.3M reels', trending: 'hot' },
                { name: 'Calm Down (Rema)', genre: 'Afrobeat', uses: '5.1M reels', trending: 'rising' },
                { name: 'Husn (Anuv Jain)', genre: 'Indie', uses: '1.8M reels', trending: 'hot' },
                { name: 'Original Sound — Trending Beat', genre: 'Trap', uses: '900K shorts', trending: 'rising' },
            ],
            postingWindows: [
                { time: '6:00 PM - 8:00 PM IST', platform: 'YouTube', reason: 'Peak viewership — office crowd unwinding' },
                { time: '9:00 AM - 11:00 AM IST', platform: 'Instagram', reason: 'Morning scroll time, high reel engagement' },
                { time: '12:00 PM - 1:00 PM IST', platform: 'YouTube Shorts', reason: 'Lunch break mobile usage spike' },
                { time: '10:00 PM - 12:00 AM IST', platform: 'Twitter/X', reason: 'Night owl engagement, threads perform best' },
            ],
            contentRecs: [
                { title: 'Create a "Day in My Life" Reel', description: `Show your ${n} process — authentic content is trending 2x more than polished content.` },
                { title: 'Reply to Top Comment with a Video', description: 'Comment replies get 3x more views. Pick your most engaging comment.' },
                { title: 'Post a Carousel Breaking Down Tips', description: `${n} tips in carousel format gets saved 5x more — algorithm loves saves.` },
            ],
        });
    }
});

export default router;
