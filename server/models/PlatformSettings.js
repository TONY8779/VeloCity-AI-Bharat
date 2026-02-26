import mongoose from 'mongoose';
import { isMemoryMode } from '../lib/db.js';
import { MemoryStore } from '../lib/memoryStore.js';

const platformSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  twoFactorRequired: { type: Boolean, default: false },
  rateLimitMax: { type: Number, default: 500 },
  rateLimitWindow: { type: Number, default: 15 },
  maxFileSize: { type: Number, default: 500 },
  storageLimit: { type: Number, default: 10 },
  sessionTimeout: { type: Number, default: 30 },
  backupEnabled: { type: Boolean, default: false },
  analyticsEnabled: { type: Boolean, default: true },
  debugMode: { type: Boolean, default: false },
  apiDocsPublic: { type: Boolean, default: false },
  autoSuspendEnabled: { type: Boolean, default: false },
}, { timestamps: true });

let mongooseModel;
try { mongooseModel = mongoose.model('PlatformSettings'); } catch { mongooseModel = mongoose.model('PlatformSettings', platformSettingsSchema); }

const defaults = {
  key: 'global', maintenanceMode: false, registrationEnabled: true,
  emailNotifications: true, twoFactorRequired: false, rateLimitMax: 500,
  rateLimitWindow: 15, maxFileSize: 500, storageLimit: 10, sessionTimeout: 30,
  backupEnabled: false, analyticsEnabled: true, debugMode: false,
  apiDocsPublic: false, autoSuspendEnabled: false,
};

const memModel = MemoryStore.createModel('PlatformSettings', defaults);

const PlatformSettings = new Proxy({}, {
  get(_, prop) {
    const t = isMemoryMode() ? memModel : mongooseModel;
    const v = t[prop];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});

export default PlatformSettings;
export { defaults as SETTINGS_DEFAULTS };
