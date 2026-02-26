import fs from 'fs';
import Asset from '../models/Asset.js';
import User from '../models/User.js';

export function startCleanupJob() {
  // Run every 24 hours
  const INTERVAL = 24 * 60 * 60 * 1000;

  async function cleanup() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const expiredAssets = await Asset.find({
        deletedAt: { $ne: null, $lte: thirtyDaysAgo },
      });

      for (const asset of expiredAssets) {
        // Delete physical file
        try {
          if (fs.existsSync(asset.path)) {
            fs.unlinkSync(asset.path);
          }
        } catch (err) {
          console.error(`Failed to delete file ${asset.path}:`, err.message);
        }

        // Decrement user storage
        await User.findByIdAndUpdate(asset.userId, {
          $inc: { storageUsed: -asset.size },
        });

        // Remove document
        await Asset.findByIdAndDelete(asset._id);
      }

      if (expiredAssets.length > 0) {
        console.log(`Cleanup: permanently deleted ${expiredAssets.length} expired assets`);
      }
    } catch (err) {
      console.error('Cleanup job error:', err);
    }
  }

  // Initial run after 1 minute
  setTimeout(cleanup, 60 * 1000);
  // Then every 24 hours
  setInterval(cleanup, INTERVAL);
}
