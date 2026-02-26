import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, default: '' },
  avatar: String,
  niche: { type: String, default: '' },
  accountType: { type: String, enum: ['free', 'premium'], default: 'free' },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  tokenVersion: { type: Number, default: 0 },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  youtubeTokens: { type: mongoose.Schema.Types.Mixed, default: null },
  youtubeChannel: { type: mongoose.Schema.Types.Mixed, default: null },
  preferences: {
    defaultExportFormat: { type: String, default: 'mp4' },
    defaultResolution: { type: String, default: '1080p' },
    notificationSettings: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  storageUsed: { type: Number, default: 0 },
  storageLimit: { type: Number, default: 10 * 1024 * 1024 * 1024 },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ displayName: 1 }, { unique: true, sparse: true });

let mongooseModel;
try { mongooseModel = mongoose.model('User'); } catch { mongooseModel = mongoose.model('User', userSchema); }

const memModel = MemoryStore.createModel('User', {
  displayName: '', avatar: null, niche: '', accountType: 'free', role: 'user', status: 'active',
  tokenVersion: 0, resetToken: null, resetTokenExpiry: null,
  youtubeTokens: null, youtubeChannel: null,
  preferences: { defaultExportFormat: 'mp4', defaultResolution: '1080p', notificationSettings: { email: true, inApp: true } },
  storageUsed: 0, storageLimit: 10 * 1024 * 1024 * 1024,
});

const User = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default User;
