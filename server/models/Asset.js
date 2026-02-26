import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const assetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  format: String,
  duration: Number,
  tags: { type: [String], default: [] },
  path: { type: String, required: true },
  thumbnail: String,
  versions: [{ versionId: String, path: String, createdAt: { type: Date, default: Date.now }, operation: String }],
  deletedAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

assetSchema.index({ userId: 1, deletedAt: 1 });
assetSchema.index({ tags: 1 });
assetSchema.index({ mimeType: 1 });

let mongooseModel;
try { mongooseModel = mongoose.model('Asset'); } catch { mongooseModel = mongoose.model('Asset', assetSchema); }

const memModel = MemoryStore.createModel('Asset', {
  projectId: null, format: '', duration: null, tags: [], thumbnail: null,
  versions: [], deletedAt: null, metadata: {},
});

const Asset = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default Asset;
