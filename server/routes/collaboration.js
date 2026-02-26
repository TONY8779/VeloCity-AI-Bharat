import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import Project from '../models/Project.js';
import { logActivity } from '../middleware/activityLogger.js';

const router = Router();

// POST /api/projects/:id/share — generate share link
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found or not owner' });

    const { permissions = 'view' } = req.body;
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    project.shareLink = { token, expiresAt, permissions };
    await project.save();

    await logActivity(project._id, req.userId, 'share_link_created', { permissions });

    res.json({
      shareUrl: `http://localhost:5173/shared/${token}`,
      token,
      expiresAt,
      permissions,
    });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// GET /api/share/:token — access shared project
router.get('/share/:token', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ 'shareLink.token': req.params.token });
    if (!project) return res.status(404).json({ error: 'Share link not found' });

    if (new Date() > project.shareLink.expiresAt) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    // Add as collaborator if not already
    const isOwner = project.userId.toString() === req.userId;
    const existingCollab = project.collaborators.find(c => c.userId.toString() === req.userId);

    if (!isOwner && !existingCollab) {
      project.collaborators.push({
        userId: req.userId,
        permissions: project.shareLink.permissions,
      });
      await project.save();
      await logActivity(project._id, req.userId, 'collaborator_joined', {
        permissions: project.shareLink.permissions,
      });
    }

    res.json({
      ...project.toObject(),
      permissions: isOwner ? 'owner' : project.shareLink.permissions,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to access shared project' });
  }
});

// DELETE /api/projects/:id/share — revoke share link
router.delete('/:id/share', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found or not owner' });

    project.shareLink = undefined;
    await project.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

// GET /api/projects/:id/collaborators
router.get('/:id/collaborators', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('collaborators.userId', 'displayName email avatar');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.userId.toString() === req.userId;
    const isCollab = project.collaborators.some(c => c.userId?._id?.toString() === req.userId);
    if (!isOwner && !isCollab) return res.status(403).json({ error: 'Access denied' });

    res.json(project.collaborators);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list collaborators' });
  }
});

// DELETE /api/projects/:id/collaborators/:userId
router.delete('/:id/collaborators/:collabUserId', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found or not owner' });

    project.collaborators = project.collaborators.filter(
      c => c.userId.toString() !== req.params.collabUserId,
    );
    await project.save();

    await logActivity(project._id, req.userId, 'collaborator_removed', {
      removedUserId: req.params.collabUserId,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

export default router;
