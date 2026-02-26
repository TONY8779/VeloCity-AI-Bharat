import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { google } from 'googleapis';
import User from '../models/User.js';
import { authenticate, loadUser } from '../middleware/auth.js';

const router = Router();

// ─── Per-user login lockout tracking ───
const loginAttempts = new Map(); // email → { count, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkLockout(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return null;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const remaining = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
    return `Account locked. Try again in ${remaining} minute${remaining > 1 ? 's' : ''}.`;
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(email);
  }
  return null;
}

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
    entry.count = 0;
  }
  loginAttempts.set(email, entry);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

// ─── Token generation ───
function generateToken(userId, tokenVersion = 0, rememberMe = false) {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );
}

// ─── Input sanitization helper ───
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// POST /auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('displayName').trim().isLength({ min: 1, max: 100 }).withMessage('Display name is required (max 100 characters)'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { email, password, displayName, niche } = req.body;
    const cleanDisplayName = sanitize(displayName);
    const cleanNiche = sanitize(niche || '');

    // Check email uniqueness
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Check displayName uniqueness (case-insensitive)
    const allUsers = await User.find({});
    const nameTaken = allUsers.find(u =>
      u.displayName && u.displayName.toLowerCase() === cleanDisplayName.toLowerCase()
    );
    if (nameTaken) {
      return res.status(409).json({ error: 'This display name is already taken. Please choose another.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      passwordHash,
      displayName: cleanDisplayName,
      niche: cleanNiche,
      tokenVersion: 0,
    });

    const token = generateToken(user._id, 0, false);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        niche: user.niche,
        accountType: user.accountType,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  try {
    const { email, password, rememberMe } = req.body;

    // Check lockout
    const lockMsg = checkLockout(email);
    if (lockMsg) {
      return res.status(429).json({ error: lockMsg });
    }

    const user = await User.findOne({ email });

    if (!user) {
      recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is suspended/banned
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact an administrator.' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear lockout on success
    clearAttempts(email);

    const token = generateToken(user._id, user.tokenVersion || 0, !!rememberMe);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        niche: user.niche,
        accountType: user.accountType,
        avatar: user.avatar,
        youtubeConnected: !!user.youtubeTokens,
        youtubeChannel: user.youtubeChannel,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authenticate, loadUser, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    email: u.email,
    displayName: u.displayName,
    avatar: u.avatar,
    niche: u.niche,
    accountType: u.accountType,
    preferences: u.preferences,
    storageUsed: u.storageUsed,
    storageLimit: u.storageLimit,
    youtubeConnected: !!u.youtubeTokens,
    youtubeChannel: u.youtubeChannel,
  });
});

// PUT /auth/profile
router.put('/profile', authenticate, loadUser, [
  body('displayName').optional().trim().isLength({ max: 100 }),
  body('niche').optional().trim(),
  body('avatar').optional().trim(),
], async (req, res) => {
  try {
    const { displayName, niche, avatar, preferences } = req.body;
    const updates = {};

    if (displayName !== undefined) {
      const cleanName = sanitize(displayName);
      // Check uniqueness if name is changing
      if (cleanName.toLowerCase() !== (req.user.displayName || '').toLowerCase()) {
        const allUsers = await User.find({});
        const nameTaken = allUsers.find(u =>
          u._id !== req.userId &&
          u.displayName && u.displayName.toLowerCase() === cleanName.toLowerCase()
        );
        if (nameTaken) {
          return res.status(409).json({ error: 'This display name is already taken.' });
        }
      }
      updates.displayName = cleanName;
    }
    if (niche !== undefined) updates.niche = sanitize(niche);
    if (avatar !== undefined) updates.avatar = sanitize(avatar);
    if (preferences !== undefined) updates.preferences = { ...req.user.preferences?.toObject?.() || req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-passwordHash');
    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      niche: user.niche,
      accountType: user.accountType,
      preferences: user.preferences,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ─── Password Reset Flow ───

// POST /auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ ok: true, message: 'If this email exists, a reset link has been generated.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry: resetExpiry,
    });

    // In dev mode (no email service), return the token directly
    // In production, you'd send this via email
    res.json({
      ok: true,
      message: 'If this email exists, a reset link has been generated.',
      // DEV ONLY — remove in production:
      resetToken,
      resetUrl: `http://localhost:5173/reset-password?token=${resetToken}`,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const allUsers = await User.find({});
    const user = allUsers.find(u =>
      u.resetToken === token &&
      u.resetTokenExpiry &&
      new Date(u.resetTokenExpiry) > new Date()
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      tokenVersion: (user.tokenVersion || 0) + 1, // invalidate existing sessions
    });

    res.json({ ok: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── YouTube OAuth ───

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'http://localhost:3001/auth/youtube/callback',
  );
}

// GET /auth/youtube — initiate OAuth
router.get('/youtube', authenticate, (req, res) => {
  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ],
    prompt: 'consent',
    state: req.userId, // pass userId in state
  });
  res.json({ url });
});

// GET /auth/youtube/callback
router.get('/youtube/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).send('Missing code or state');

  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch channel info to cache
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: 'snippet,statistics',
      mine: true,
    });
    const channel = channelRes.data.items?.[0];

    const channelData = channel ? {
      id: channel.id,
      title: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      viewCount: parseInt(channel.statistics.viewCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      customUrl: channel.snippet.customUrl,
    } : null;

    await User.findByIdAndUpdate(userId, {
      youtubeTokens: tokens,
      youtubeChannel: channelData,
    });

    res.redirect('http://localhost:5173?youtube_connected=true');
  } catch (err) {
    console.error('YouTube OAuth error:', err.message);
    res.redirect('http://localhost:5173?youtube_error=true');
  }
});

// GET /auth/youtube/status
router.get('/youtube/status', authenticate, loadUser, (req, res) => {
  res.json({
    connected: !!req.user.youtubeTokens,
    channel: req.user.youtubeChannel,
  });
});

// POST /auth/youtube/disconnect
router.post('/youtube/disconnect', authenticate, loadUser, async (req, res) => {
  try {
    if (req.user.youtubeTokens) {
      const oauth2Client = createOAuthClient();
      oauth2Client.setCredentials(req.user.youtubeTokens);
      oauth2Client.revokeCredentials().catch(() => { });
    }
    await User.findByIdAndUpdate(req.userId, {
      youtubeTokens: null,
      youtubeChannel: null,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('YouTube disconnect error:', err);
    res.status(500).json({ error: 'Disconnect failed' });
  }
});

export default router;
