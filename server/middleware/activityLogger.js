import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(projectId, userId, action, details = {}) {
  try {
    await ActivityLog.create({ projectId, userId, action, details });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
}
