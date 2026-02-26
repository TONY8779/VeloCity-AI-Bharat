import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.tokenVersion = decoded.tokenVersion ?? 0;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.tokenVersion = decoded.tokenVersion ?? 0;
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
}

export async function loadUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Check tokenVersion — if token is outdated (role changed, password reset), reject
    const userVersion = user.tokenVersion ?? 0;
    const tokenVersion = req.tokenVersion ?? 0;
    if (userVersion > tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(500).json({ error: 'Failed to load user' });
  }
}
