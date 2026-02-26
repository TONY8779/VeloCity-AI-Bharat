import { api } from './api';

export const youtubeService = {
  async getAuthUrl() {
    const res = await api.get('/auth/youtube');
    return res.url;
  },

  async getStatus() {
    try {
      return await api.get('/auth/youtube/status');
    } catch {
      return { connected: false, channel: null };
    }
  },

  async disconnect() {
    return api.post('/auth/youtube/disconnect');
  },

  async getChannel() {
    return api.get('/api/youtube/channel');
  },

  async getVideos() {
    return api.get('/api/youtube/videos');
  },

  async getAnalytics() {
    return api.get('/api/youtube/analytics');
  },

  async getTopVideos() {
    return api.get('/api/youtube/analytics/top-videos');
  },

  async getDemographics() {
    return api.get('/api/youtube/analytics/demographics');
  },
};
