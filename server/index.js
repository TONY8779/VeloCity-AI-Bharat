import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Ensure JWT_SECRET is always set (stable fallback for dev)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'velocity-dev-secret-key-2025';
}

import { connectDB, getMongooseState } from './lib/db.js';

import authRoutes from './routes/auth.js';
import youtubeRoutes from './routes/youtube.js';
import geminiRoutes from './routes/gemini.js';
import assetRoutes from './routes/assets.js';
import projectRoutes from './routes/projects.js';
import collaborationRoutes from './routes/collaboration.js';
import commentRoutes from './routes/comments.js';
import activityRoutes from './routes/activity.js';
import { startCleanupJob } from './jobs/cleanup.js';

// Phase 1-5 feature routes
import trendRoutes from './routes/trends.js';
import competitorRoutes from './routes/competitors.js';
import briefingRoutes from './routes/briefing.js';
import thumbnailRoutes from './routes/thumbnails.js';
import titleRoutes from './routes/titles.js';
import evergreenRoutes from './routes/evergreen.js';
import commentGeniusRoutes from './routes/commentgenius.js';
import safeguardRoutes from './routes/safeguard.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', collaborationRoutes);
app.use('/api', collaborationRoutes);  // Also mount at /api for /api/share/:token
app.use('/api', commentRoutes);
app.use('/api/projects', activityRoutes);

// Feature routes (Phases 1-5)
app.use('/api/trends', trendRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/briefing', briefingRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/titles', titleRoutes);
app.use('/api/evergreen', evergreenRoutes);
app.use('/api/commentgenius', commentGeniusRoutes);
app.use('/api/safeguard', safeguardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: getMongooseState(),
    uptime: process.uptime(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Connect to DB (MongoDB or fallback to in-memory) and start server
const PORT = process.env.PORT || 3001;

async function start() {
  const hasDB = await connectDB();

  if (hasDB) {
    startCleanupJob();
  }

  app.listen(PORT, () => {
    console.log(`\nVeloCity backend running on http://localhost:${PORT}`);
    console.log(`Storage: ${getMongooseState()}`);
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      console.warn('Warning: YouTube OAuth credentials not set');
    }
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Warning: GEMINI_API_KEY not set');
    }
    console.log('');
  });
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
