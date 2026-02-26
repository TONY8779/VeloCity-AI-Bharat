import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, loadUser } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';

const router = Router();

// POST /api/assets/upload
router.post('/upload', authenticate, loadUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Check storage quota
    const newStorageUsed = req.user.storageUsed + req.file.size;
    if (newStorageUsed > req.user.storageLimit) {
      // Remove uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(413).json({
        error: 'Storage quota exceeded',
        storageUsed: req.user.storageUsed,
        storageLimit: req.user.storageLimit,
      });
    }

    const asset = await Asset.create({
      userId: req.userId,
      projectId: req.body.projectId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      format: path.extname(req.file.originalname).slice(1),
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      path: req.file.path,
      metadata: {
        uploadedFrom: req.body.source || 'web',
      },
    });

    await User.findByIdAndUpdate(req.userId, { storageUsed: newStorageUsed });

    if (req.body.projectId) {
      await logActivity(req.body.projectId, req.userId, 'asset_uploaded', {
        assetId: asset._id,
        filename: asset.originalName,
      });
    }

    res.status(201).json(asset);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/assets
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, tags, dateFrom, dateTo, search, showDeleted, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.userId };

    if (showDeleted === 'true') {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
    }

    if (type) {
      filter.mimeType = new RegExp(`^${type}/`);
    }

    if (tags) {
      filter.tags = { $all: tags.split(',') };
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.originalName = new RegExp(search, 'i');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assets, total] = await Promise.all([
      Asset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Asset.countDocuments(filter),
    ]);

    res.json({
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('List assets error:', err);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

// GET /api/assets/storage
router.get('/storage', authenticate, loadUser, (req, res) => {
  res.json({
    used: req.user.storageUsed,
    limit: req.user.storageLimit,
    percentUsed: ((req.user.storageUsed / req.user.storageLimit) * 100).toFixed(1),
    accountType: req.user.accountType,
  });
});

// GET /api/assets/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.userId });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

// PUT /api/assets/:id/tags
router.put('/:id/tags', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { tags: req.body.tags || [] },
      { new: true },
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// DELETE /api/assets/:id (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (asset.projectId) {
      await logActivity(asset.projectId, req.userId, 'asset_deleted', {
        assetId: asset._id,
        filename: asset.originalName,
      });
    }

    res.json({ ok: true, asset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// POST /api/assets/:id/restore
router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true },
    );
    if (!asset) return res.status(404).json({ error: 'Asset not found in trash' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore asset' });
  }
});

// GET /api/assets/:id/download
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.userId, deletedAt: null });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    if (!fs.existsSync(asset.path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(asset.path, asset.originalName);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
