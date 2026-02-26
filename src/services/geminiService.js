import { api } from './api';

export const geminiService = {
  async fetchRoadmap(niche, channelContext) {
    try {
      return await api.post('/api/gemini/roadmap', { niche, channelContext });
    } catch {
      return generateFallbackRoadmap(niche);
    }
  },

  async synthesizeScript(notes, niche, channelContext) {
    try {
      return await api.post('/api/gemini/synthesize', { notes, niche, channelContext });
    } catch {
      return {
        script: {
          hook: "Bhai ye trick kisi ko mat batana... ",
          body: `Main tere notes padh ke ek killer script banaya hai. ${niche} mein abhi ye trend chal raha hai aur tere notes perfectly fit karte hain.`,
          captions: ["YE MAT BATANA", "TREND ALERT", "RESULT FIRST", "FOLLOW NOW"],
          music: { genre: "Lo-Fi Hip Hop", bpm: 90, mood: "Focused" },
        },
      };
    }
  },

  async getAnomalyDetection(data) {
    return api.post('/api/gemini/anomaly-detection', data);
  },

  async getGrowthRecommendations(data) {
    return api.post('/api/gemini/growth-recommendations', data);
  },

  async getTrends(niche, channelContext) {
    return api.post('/api/gemini/trends', { niche, channelContext });
  },
};

function generateFallbackRoadmap(niche) {
  return {
    roadmap: Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      title: [`${niche} ka sabse bada secret`, `Maine ${niche} mein galti ki`, `${niche} 101: Beginners`, `Controversial ${niche} take`, `${niche} se paise kaise`, `Top 5 ${niche} hacks`, `${niche} Q&A`, `${niche} setup tour`, `${niche} trends 2025`, `${niche} 24hr challenge`][i],
      trendScore: Math.floor(Math.random() * 15) + 85,
      trajectory: ['rising', 'rising', 'peaking', 'rising', 'peaking', 'rising', 'declining', 'rising', 'peaking', 'rising'][i],
      script: {
        hook: ["Ruko ruko... ye dekho!", "Ye galti maine bhi ki thi...", "Agar ye nahi jaante toh missing out!", "Log hate karenge for this but...", "Ye trick se paise aa rahe", "Koi nahi batayega ye!", "Tumne pucha, maine deliver kiya", "Behind the scenes! Let's go!", "2025 mein ye hoga — ready ho jao", "24 hours mein kar ke dikhaya!"][i],
        body: `${niche} mein abhi jo trend chal raha hai, usse bohot log miss kar rahe hain. Main exactly bataunga kaise leverage karo. Step by step — koi fluff nahi.`,
        captions: ["RUKO!", `${niche.toUpperCase()} SECRET`, "WATCH TILL END", "FOLLOW"],
        music: { genre: "Trap Beat", bpm: 140, mood: "Energetic" },
      },
    })),
  };
}
