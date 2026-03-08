import { Router } from 'express';
import { google } from 'googleapis';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

function getOAuthClient(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `${BASE_URL}/auth/youtube/callback`,
  );
  oauth2Client.setCredentials(user.youtubeTokens);
  return oauth2Client;
}

function requireYouTube(req, res, next) {
  if (!req.user?.youtubeTokens) {
    return res.status(401).json({ error: 'YouTube not connected' });
  }
  next();
}

// GET /api/youtube/channel
router.get('/channel', authenticate, loadUser, requireYouTube, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient(req.user);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      part: 'snippet,statistics,contentDetails,brandingSettings',
      mine: true,
    });
    const channel = response.data.items?.[0];
    if (!channel) return res.status(404).json({ error: 'No channel found' });

    res.json({
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      viewCount: parseInt(channel.statistics.viewCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      customUrl: channel.snippet.customUrl,
      publishedAt: channel.snippet.publishedAt,
    });
  } catch (err) {
    console.error('Channel fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/youtube/videos
router.get('/videos', authenticate, loadUser, requireYouTube, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient(req.user);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const channelRes = await youtube.channels.list({ part: 'contentDetails', mine: true });
    const uploadsPlaylist = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return res.json({ videos: [] });

    const playlistRes = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylist,
      maxResults: 20,
    });

    const videoIds = playlistRes.data.items.map(i => i.contentDetails.videoId).join(',');
    const videoRes = await youtube.videos.list({
      part: 'snippet,statistics,contentDetails',
      id: videoIds,
    });

    const videos = videoRes.data.items.map(v => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description?.substring(0, 200),
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
      publishedAt: v.snippet.publishedAt,
      viewCount: parseInt(v.statistics.viewCount || '0'),
      likeCount: parseInt(v.statistics.likeCount || '0'),
      commentCount: parseInt(v.statistics.commentCount || '0'),
      duration: v.contentDetails.duration,
    }));

    res.json({ videos });
  } catch (err) {
    console.error('Videos fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/youtube/analytics
router.get('/analytics', authenticate, loadUser, requireYouTube, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient(req.user);
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,dislikes,shares',
      dimensions: 'day',
      sort: 'day',
    });

    const rows = response.data.rows || [];
    const columnHeaders = response.data.columnHeaders.map(h => h.name);

    const dailyData = rows.map(row => {
      const obj = {};
      columnHeaders.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    const totals = dailyData.reduce((acc, d) => {
      acc.views += d.views || 0;
      acc.watchTime += d.estimatedMinutesWatched || 0;
      acc.subscribersGained += d.subscribersGained || 0;
      acc.subscribersLost += d.subscribersLost || 0;
      acc.likes += d.likes || 0;
      acc.shares += d.shares || 0;
      return acc;
    }, { views: 0, watchTime: 0, subscribersGained: 0, subscribersLost: 0, likes: 0, shares: 0 });

    const avgViewDuration = dailyData.length > 0
      ? dailyData.reduce((s, d) => s + (d.averageViewDuration || 0), 0) / dailyData.length
      : 0;

    res.json({
      period: { start: startDate, end: endDate },
      totals: {
        ...totals,
        netSubscribers: totals.subscribersGained - totals.subscribersLost,
        avgViewDuration: Math.round(avgViewDuration),
      },
      daily: dailyData,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/youtube/analytics/top-videos
router.get('/analytics/top-videos', authenticate, loadUser, requireYouTube, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient(req.user);
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched,averageViewPercentage,subscribersGained',
      dimensions: 'video',
      sort: '-views',
      maxResults: 10,
    });

    const rows = response.data.rows || [];
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const videoIds = rows.map(r => r[0]).join(',');
    let videoDetails = {};
    if (videoIds) {
      const vRes = await youtube.videos.list({ part: 'snippet', id: videoIds });
      vRes.data.items.forEach(v => { videoDetails[v.id] = v.snippet; });
    }

    const topVideos = rows.map(r => ({
      videoId: r[0],
      title: videoDetails[r[0]]?.title || 'Unknown',
      thumbnail: videoDetails[r[0]]?.thumbnails?.medium?.url,
      views: r[1],
      watchTime: r[2],
      avgViewPercentage: r[3],
      subscribersGained: r[4],
    }));

    res.json({ topVideos });
  } catch (err) {
    console.error('Top videos error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/youtube/analytics/demographics
router.get('/analytics/demographics', authenticate, loadUser, requireYouTube, async (req, res) => {
  try {
    const oauth2Client = getOAuthClient(req.user);
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const ageRes = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup',
    });

    const countryRes = await youtubeAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      sort: '-views',
      maxResults: 10,
    });

    res.json({
      ageGroups: (ageRes.data.rows || []).map(r => ({ group: r[0], percentage: r[1] })),
      countries: (countryRes.data.rows || []).map(r => ({ country: r[0], views: r[1], watchTime: r[2] })),
    });
  } catch (err) {
    console.error('Demographics error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
