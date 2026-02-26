import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const activityLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

activityLogSchema.index({ projectId: 1, createdAt: -1 });

let mongooseModel;
try { mongooseModel = mongoose.model('ActivityLog'); } catch { mongooseModel = mongoose.model('ActivityLog', activityLogSchema); }

const memModel = MemoryStore.createModel('ActivityLog', { details: {} });

const ActivityLog = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default ActivityLog;
