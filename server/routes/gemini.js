import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

async function fetchWithBackoff(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 500));
          continue;
        }
      }
      throw new Error(`Gemini API error: ${response.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000 + Math.random() * 500));
    }
  }
  throw new Error('All retry attempts exhausted');
}

async function callGemini(prompt, systemInstruction, schema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };

  const response = await fetchWithBackoff(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty Gemini response');

  return JSON.parse(rawText);
}

// POST /api/gemini/roadmap
router.post('/roadmap', authenticate, async (req, res) => {
  try {
    const { niche, channelContext } = req.body;
    if (!niche) return res.status(400).json({ error: 'Niche is required' });

    const prompt = `Generate a hyper-specific, high-engagement 10-day content roadmap for a creator in the niche: "${niche}".
${channelContext ? `Creator context: ${channelContext}` : ''}
Each day must have a viral Hinglish script. Make hooks punchy, edgy, and anti-boring. No corporate fluff.`;

    const sys = `You are "The Algorithm" — a sentient content strategist for Indian Gen-Z creators.
ONLY hyper-specific, edgy, high-retention advice. Use Hinglish naturally — like Mumbai/Delhi creators talk.
Every hook must stop the scroll in 0.5 seconds.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        roadmap: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              day: { type: 'NUMBER' },
              title: { type: 'STRING' },
              trendScore: { type: 'NUMBER' },
              trajectory: { type: 'STRING' },
              script: {
                type: 'OBJECT',
                properties: {
                  hook: { type: 'STRING' },
                  body: { type: 'STRING' },
                  captions: { type: 'ARRAY', items: { type: 'STRING' } },
                  music: {
                    type: 'OBJECT',
                    properties: {
                      genre: { type: 'STRING' },
                      bpm: { type: 'NUMBER' },
                      mood: { type: 'STRING' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const data = await callGemini(prompt, sys, schema);
    res.json(data);
  } catch (err) {
    console.error('Roadmap generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate roadmap', fallback: true });
  }
});

// POST /api/gemini/synthesize
router.post('/synthesize', authenticate, async (req, res) => {
  try {
    const { notes, niche, channelContext } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes are required' });

    const prompt = `Synthesize a ready-to-film viral script from:
NOTES: ${notes}
NICHE: ${niche || 'general'}
${channelContext ? `CHANNEL: ${channelContext}` : ''}
Output: punchy Hinglish hook (1 line), body (5-8 sentences Hinglish), 4 viral captions.`;

    const sys = `You are "The Algorithm" — synthesizing raw notes into viral-ready scripts for Indian Gen-Z.
Use Hinglish naturally. Be edgy, specific, anti-boring.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        script: {
          type: 'OBJECT',
          properties: {
            hook: { type: 'STRING' },
            body: { type: 'STRING' },
            captions: { type: 'ARRAY', items: { type: 'STRING' } },
            music: {
              type: 'OBJECT',
              properties: {
                genre: { type: 'STRING' },
                bpm: { type: 'NUMBER' },
                mood: { type: 'STRING' },
              },
            },
          },
        },
      },
    };

    const data = await callGemini(prompt, sys, schema);
    res.json(data);
  } catch (err) {
    console.error('Synthesis error:', err.message);
    res.status(500).json({ error: 'Failed to synthesize script' });
  }
});

// POST /api/gemini/anomaly-detection
router.post('/anomaly-detection', authenticate, async (req, res) => {
  try {
    const { niche, videoTitle, videoDescription, duration, viewCount, avgViewDuration, avgViewPercentage } = req.body;

    const prompt = `Analyze this video's performance and identify audience drop-off points:
Title: "${videoTitle || 'Untitled'}"
Description: "${videoDescription || 'No description'}"
Duration: ${duration || 60}s
Views: ${viewCount || 0}
Avg View Duration: ${avgViewDuration || 0}s
Avg View Percentage: ${avgViewPercentage || 0}%
Niche: ${niche || 'general'}

Identify 4-5 specific timestamps where viewers likely drop off, with reasons and severity. Be specific to this content type and niche.`;

    const sys = `You are an expert video retention analyst for Indian Gen-Z content creators.
Analyze video metrics and identify specific drop-off points with actionable reasons.
Use Hinglish naturally. Be brutally honest about what's losing viewers.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        anomalies: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              time: { type: 'STRING' },
              drop: { type: 'STRING' },
              reason: { type: 'STRING' },
              severity: { type: 'STRING' },
              recommendation: { type: 'STRING' },
            },
          },
        },
        overallScore: { type: 'NUMBER' },
        summary: { type: 'STRING' },
      },
    };

    const data = await callGemini(prompt, sys, schema);
    res.json(data);
  } catch (err) {
    console.error('Anomaly detection error:', err.message);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// POST /api/gemini/growth-recommendations
router.post('/growth-recommendations', authenticate, async (req, res) => {
  try {
    const { niche, channelStats, recentPerformance, demographics, topVideos } = req.body;

    const prompt = `Generate personalized growth recommendations for this creator:
Niche: ${niche || 'general'}
Channel Stats: ${JSON.stringify(channelStats || {})}
Recent Performance (28d): ${JSON.stringify(recentPerformance || {})}
Demographics: ${JSON.stringify(demographics || {})}
Top Videos: ${JSON.stringify((topVideos || []).slice(0, 5))}

Provide 5 specific, actionable recommendations. Include optimal posting times based on the data. If performance is declining, focus on recovery strategies.`;

    const sys = `You are "The Algorithm" — an AI growth strategist for Indian Gen-Z creators.
Give specific, data-driven advice. Reference actual metrics. Use Hinglish naturally.
Each recommendation should be immediately actionable, not vague.
Include predicted impact for each recommendation.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        recommendations: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              description: { type: 'STRING' },
              rationale: { type: 'STRING' },
              priority: { type: 'NUMBER' },
              expectedImpact: { type: 'STRING' },
              type: { type: 'STRING' },
            },
          },
        },
        optimalPostingTimes: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              day: { type: 'STRING' },
              time: { type: 'STRING' },
              reason: { type: 'STRING' },
            },
          },
        },
        overallStrategy: { type: 'STRING' },
      },
    };

    const data = await callGemini(prompt, sys, schema);
    res.json(data);
  } catch (err) {
    console.error('Growth recommendations error:', err.message);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// POST /api/gemini/trends
router.post('/trends', authenticate, async (req, res) => {
  try {
    const { niche, channelContext } = req.body;
    if (!niche) return res.status(400).json({ error: 'Niche is required' });

    const prompt = `Identify 8 current trending topics/formats in the "${niche}" niche for Indian Gen-Z creators.
${channelContext ? `Creator context: ${channelContext}` : ''}
For each trend, provide a virality score (0-100), trajectory (rising/peaking/declining), and predicted peak time.`;

    const sys = `You are "The Algorithm" — an AI trend prediction engine for Indian Gen-Z content creators.
Identify real, specific trends (not generic advice). Each trend should be actionable.
Use current cultural references and Hinglish naturally.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        trends: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              topic: { type: 'STRING' },
              score: { type: 'NUMBER' },
              trajectory: { type: 'STRING' },
              predictedPeakTime: { type: 'STRING' },
              description: { type: 'STRING' },
              suggestedFormat: { type: 'STRING' },
              engagementPotential: { type: 'STRING' },
            },
          },
        },
      },
    };

    const data = await callGemini(prompt, sys, schema);
    res.json(data);
  } catch (err) {
    console.error('Trends error:', err.message);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
