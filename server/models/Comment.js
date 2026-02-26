import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const commentSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  videoTimestamp: { type: Number, default: 0 },
}, { timestamps: true });

commentSchema.index({ assetId: 1, videoTimestamp: 1 });

let mongooseModel;
try { mongooseModel = mongoose.model('Comment'); } catch { mongooseModel = mongoose.model('Comment', commentSchema); }

const memModel = MemoryStore.createModel('Comment', { projectId: null, videoTimestamp: 0 });

const Comment = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default Comment;
