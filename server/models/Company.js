import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, default: 'Technology' },
  size: { type: String, enum: ['Startup', 'Small', 'Medium', 'Enterprise'], default: 'Small' },
  status: { type: String, enum: ['active', 'prospect', 'inactive', 'churned'], default: 'prospect' },
  website: { type: String, default: '' },
  contact: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  revenue: { type: Number, default: 0 },
  deals: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  members: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, default: 'member' }, addedAt: { type: Date, default: Date.now } }],
  tags: { type: [String], default: [] },
}, { timestamps: true });

companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ status: 1 });

let mongooseModel;
try { mongooseModel = mongoose.model('Company'); } catch { mongooseModel = mongoose.model('Company', companySchema); }

const memModel = MemoryStore.createModel('Company', {
  industry: 'Technology', size: 'Small', status: 'prospect', website: '', contact: '',
  phone: '', address: '', revenue: 0, deals: 0, notes: '', members: [], tags: [],
});

const Company = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default Company;
