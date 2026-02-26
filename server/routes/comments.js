import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Comment from '../models/Comment.js';
import Asset from '../models/Asset.js';
import { logActivity } from '../middleware/activityLogger.js';

const router = Router();

// POST /api/assets/:assetId/comments
router.post('/:assetId/comments', authenticate, async (req, res) => {
  try {
    const { text, videoTimestamp = 0 } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' });

    const asset = await Asset.findById(req.params.assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const comment = await Comment.create({
      assetId: req.params.assetId,
      projectId: asset.projectId,
      userId: req.userId,
      text: text.trim(),
      videoTimestamp,
    });

    if (asset.projectId) {
      await logActivity(asset.projectId, req.userId, 'comment_added', {
        assetId: asset._id,
        videoTimestamp,
      });
    }

    const populated = await Comment.findById(comment._id).populate('userId', 'displayName avatar');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/assets/:assetId/comments
router.get('/:assetId/comments', authenticate, async (req, res) => {
  try {
    const comments = await Comment.find({ assetId: req.params.assetId })
      .populate('userId', 'displayName avatar')
      .sort({ videoTimestamp: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list comments' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, userId: req.userId });
    if (!comment) return res.status(404).json({ error: 'Comment not found or not owner' });

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
