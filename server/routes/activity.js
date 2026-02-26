import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import ActivityLog from '../models/ActivityLog.js';
import Project from '../models/Project.js';

const router = Router();

// GET /api/projects/:id/activity
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.userId.toString() === req.userId;
    const isCollab = project.collaborators.some(c => c.userId.toString() === req.userId);
    if (!isOwner && !isCollab) return res.status(403).json({ error: 'Access denied' });

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      ActivityLog.find({ projectId: req.params.id })
        .populate('userId', 'displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments({ projectId: req.params.id }),
    ]);

    res.json({ activities, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

export default router;
