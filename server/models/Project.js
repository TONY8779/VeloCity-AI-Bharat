import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  niche: { type: String, default: '' },
  roadmap: { type: [mongoose.Schema.Types.Mixed], default: [] },
  scripts: { type: [mongoose.Schema.Types.Mixed], default: [] },
  notebookText: { type: String, default: '' },
  synthesizedScript: { type: mongoose.Schema.Types.Mixed, default: null },
  editorState: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['draft', 'in_progress', 'completed'], default: 'draft' },
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: { type: String, enum: ['view', 'edit'], default: 'view' },
    addedAt: { type: Date, default: Date.now },
  }],
  shareLink: {
    token: String,
    expiresAt: Date,
    permissions: { type: String, enum: ['view', 'edit'], default: 'view' },
  },
}, { timestamps: true });

projectSchema.index({ userId: 1 });
projectSchema.index({ 'shareLink.token': 1 });
projectSchema.index({ 'collaborators.userId': 1 });

let mongooseModel;
try { mongooseModel = mongoose.model('Project'); } catch { mongooseModel = mongoose.model('Project', projectSchema); }

const memModel = MemoryStore.createModel('Project', {
  description: '', niche: '', roadmap: [], scripts: [], notebookText: '',
  synthesizedScript: null, editorState: {}, status: 'draft', collaborators: [], shareLink: null,
});

const Project = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default Project;
