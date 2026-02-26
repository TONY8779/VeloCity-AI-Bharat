import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Project from '../models/Project.js';
import { logActivity } from '../middleware/activityLogger.js';

const router = Router();

// POST /api/projects
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, niche } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await Project.create({
      userId: req.userId,
      name,
      description: description || '',
      niche: niche || '',
    });

    await logActivity(project._id, req.userId, 'project_created', { name });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const owned = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    const collaborated = await Project.find({
      'collaborators.userId': req.userId,
    }).sort({ updatedAt: -1 });

    res.json({ owned, collaborated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.userId.toString() === req.userId;
    const collaborator = project.collaborators.find(c => c.userId.toString() === req.userId);

    if (!isOwner && !collaborator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...project.toObject(),
      permissions: isOwner ? 'owner' : collaborator.permissions,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.userId.toString() === req.userId;
    const collaborator = project.collaborators.find(c => c.userId.toString() === req.userId);

    if (!isOwner && (!collaborator || collaborator.permissions !== 'edit')) {
      return res.status(403).json({ error: 'Edit access required' });
    }

    const allowedFields = ['name', 'description', 'niche', 'roadmap', 'scripts', 'notebookText', 'synthesizedScript', 'editorState', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    await logActivity(project._id, req.userId, 'project_updated', { fields: Object.keys(updates) });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// POST /api/projects/:id/save-state (auto-save)
router.post('/:id/save-state', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.userId.toString() === req.userId;
    const collaborator = project.collaborators.find(c => c.userId.toString() === req.userId);
    if (!isOwner && (!collaborator || collaborator.permissions !== 'edit')) {
      return res.status(403).json({ error: 'Edit access required' });
    }

    const { roadmap, scripts, notebookText, synthesizedScript, editorState } = req.body;
    const updates = {};
    if (roadmap !== undefined) updates.roadmap = roadmap;
    if (scripts !== undefined) updates.scripts = scripts;
    if (notebookText !== undefined) updates.notebookText = notebookText;
    if (synthesizedScript !== undefined) updates.synthesizedScript = synthesizedScript;
    if (editorState !== undefined) updates.editorState = editorState;

    await Project.findByIdAndUpdate(req.params.id, updates);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Auto-save failed' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found or not owner' });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
