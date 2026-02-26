import { Router } from 'express';
import { authenticate, loadUser } from '../middleware/auth.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Asset from '../models/Asset.js';
import ActivityLog from '../models/ActivityLog.js';
import bcrypt from 'bcryptjs';

const router = Router();

// ─── Input sanitization helper ───
function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

// ─── Audit trail helper ───
async function logAdminAction(adminUser, action, targetType, targetId, details = {}) {
    try {
        await ActivityLog.create({
            userId: adminUser._id || adminUser,
            type: 'admin_action',
            action,
            targetType,
            targetId: String(targetId),
            details: JSON.stringify(details),
            description: `Admin ${action}: ${targetType} ${targetId}`,
        });
    } catch (err) {
        console.error('Audit log error:', err.message);
    }
}

// Admin middleware — must be admin or superadmin
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !['admin', 'superadmin'].includes(user.role)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.adminUser = user;
        next();
    } catch { res.status(500).json({ error: 'Auth check failed' }); }
};

// GET /api/admin/stats — Overview statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({});
        const activeUsers = await User.countDocuments({ status: 'active' });
        const suspendedUsers = await User.countDocuments({ status: 'suspended' });
        const premiumUsers = await User.countDocuments({ accountType: 'premium' });
        const adminUsers = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
        const totalProjects = await Project.countDocuments({});
        const totalAssets = await Asset.countDocuments({});

        // Recent signups
        const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(10).select('-passwordHash -youtubeTokens');

        // User growth by day (last 30 days)
        const allUsers = await User.find({}).select('createdAt');
        const growthByDay = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            growthByDay[key] = 0;
        }
        allUsers.forEach(u => {
            const key = new Date(u.createdAt).toISOString().slice(0, 10);
            if (growthByDay[key] !== undefined) growthByDay[key]++;
        });

        res.json({
            totalUsers, activeUsers, suspendedUsers, premiumUsers, adminUsers,
            totalProjects, totalAssets,
            recentUsers,
            growthByDay: Object.entries(growthByDay).map(([date, count]) => ({ date, count })),
        });
    } catch (err) {
        console.error('Admin stats error:', err.message);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/admin/users — List users with search, filter, sort, pagination
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { search, role, accountType, status, sort = '-createdAt', page = 1, limit = 25 } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (accountType) filter.accountType = accountType;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch all matching users first, then apply search filter in JS for memory store compatibility
        let allMatching = await User.find(filter).select('-passwordHash -youtubeTokens').sort(sort);

        // Apply search filter (case-insensitive) — this works in both MongoDB and memory mode
        if (search) {
            const searchLower = search.toLowerCase();
            allMatching = allMatching.filter(u =>
                (u.email && u.email.toLowerCase().includes(searchLower)) ||
                (u.displayName && u.displayName.toLowerCase().includes(searchLower))
            );
        }

        const total = allMatching.length;
        const users = allMatching.slice(skip, skip + parseInt(limit));

        res.json({ users, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        console.error('Admin users error:', err.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /api/admin/users/:id — User detail
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash -youtubeTokens');
        if (!user) return res.status(404).json({ error: 'User not found' });
        const projects = await Project.countDocuments({ userId: user._id });
        const assets = await Asset.countDocuments({ userId: user._id });
        res.json({ user, projects, assets });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// PUT /api/admin/users/:id — Update user (with session invalidation + audit)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { displayName, email, niche, role, accountType, status } = req.body;
        const updates = {};

        // Check displayName uniqueness if changing
        if (displayName !== undefined) {
            const cleanName = sanitize(displayName);
            const allUsers = await User.find({});
            const nameTaken = allUsers.find(u =>
                String(u._id) !== String(req.params.id) &&
                u.displayName && u.displayName.toLowerCase() === cleanName.toLowerCase()
            );
            if (nameTaken) {
                return res.status(409).json({ error: 'This display name is already taken.' });
            }
            updates.displayName = cleanName;
        }
        if (email !== undefined) updates.email = email;
        if (niche !== undefined) updates.niche = sanitize(niche);

        // If role or status changes, increment tokenVersion to invalidate sessions
        const targetUser = await User.findById(req.params.id);
        let roleOrStatusChanged = false;
        if (role !== undefined && role !== targetUser?.role) {
            updates.role = role;
            roleOrStatusChanged = true;
        }
        if (accountType !== undefined) updates.accountType = accountType;
        if (status !== undefined && status !== targetUser?.status) {
            updates.status = status;
            roleOrStatusChanged = true;
        }

        if (roleOrStatusChanged) {
            updates.tokenVersion = (targetUser?.tokenVersion || 0) + 1;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash -youtubeTokens');
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Audit trail
        await logAdminAction(req.adminUser, 'update_user', 'User', req.params.id, {
            changes: updates,
            admin: req.adminUser.email,
        });

        res.json(user);
    } catch (err) {
        console.error('Admin update user error:', err);
        res.status(500).json({ error: 'Update failed' });
    }
});

// POST /api/admin/users — Create new user (with audit)
router.post('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { email, password, displayName, niche, role, accountType } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'Email already exists' });

        // Check displayName uniqueness
        if (displayName) {
            const cleanName = sanitize(displayName);
            const allUsers = await User.find({});
            const nameTaken = allUsers.find(u =>
                u.displayName && u.displayName.toLowerCase() === cleanName.toLowerCase()
            );
            if (nameTaken) {
                return res.status(409).json({ error: 'This display name is already taken.' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            email: email.toLowerCase(),
            passwordHash,
            displayName: sanitize(displayName) || email.split('@')[0],
            niche: sanitize(niche) || '',
            role: role || 'user',
            accountType: accountType || 'free',
            tokenVersion: 0,
        });
        const { passwordHash: _, youtubeTokens: __, ...safe } = user.toObject ? user.toObject() : user;

        // Audit trail
        await logAdminAction(req.adminUser, 'create_user', 'User', user._id, {
            email: user.email,
            role: user.role,
            admin: req.adminUser.email,
        });

        res.status(201).json(safe);
    } catch (err) {
        console.error('Admin create user error:', err);
        res.status(500).json({ error: 'Create failed' });
    }
});

// DELETE /api/admin/users/:id — Delete user (with audit)
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Audit trail
        await logAdminAction(req.adminUser, 'delete_user', 'User', req.params.id, {
            email: user.email,
            admin: req.adminUser.email,
        });

        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// POST /api/admin/users/bulk — Bulk actions (with audit)
router.post('/users/bulk', authenticate, requireAdmin, async (req, res) => {
    try {
        const { ids, action, value } = req.body;
        if (!ids?.length || !action) return res.status(400).json({ error: 'IDs and action required' });
        let result;
        switch (action) {
            case 'delete':
                result = await User.deleteMany({ _id: { $in: ids } });
                break;
            case 'changeRole':
                // Increment tokenVersion for all affected users
                result = await User.updateMany(
                    { _id: { $in: ids } },
                    { role: value || 'user', $inc: { tokenVersion: 1 } }
                );
                break;
            case 'changeStatus':
                result = await User.updateMany(
                    { _id: { $in: ids } },
                    { status: value || 'active', $inc: { tokenVersion: 1 } }
                );
                break;
            case 'changeType':
                result = await User.updateMany({ _id: { $in: ids } }, { accountType: value || 'free' });
                break;
            default:
                return res.status(400).json({ error: 'Unknown action' });
        }

        // Audit trail
        await logAdminAction(req.adminUser, `bulk_${action}`, 'User', ids.join(','), {
            ids,
            action,
            value,
            admin: req.adminUser.email,
        });

        res.json({ ok: true, modified: result?.modifiedCount || result?.deletedCount || 0 });
    } catch (err) { res.status(500).json({ error: 'Bulk action failed' }); }
});

// GET /api/admin/collections — List available DB collections
router.get('/collections', authenticate, requireAdmin, async (req, res) => {
    try {
        const collections = ['User', 'Project', 'Asset', 'Comment', 'ActivityLog'];
        const counts = {};
        counts.User = await User.countDocuments({});
        counts.Project = await Project.countDocuments({});
        counts.Asset = await Asset.countDocuments({});
        try { counts.ActivityLog = await ActivityLog.countDocuments({}); } catch { counts.ActivityLog = 0; }
        res.json(collections.map(name => ({ name, count: counts[name] || 0 })));
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/collections/:name — Browse collection documents
router.get('/collections/:name', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name } = req.params;
        const { page = 1, limit = 20, search } = req.query;
        const models = { User, Project, Asset, ActivityLog };
        const Model = models[name];
        if (!Model) return res.status(404).json({ error: 'Collection not found' });

        const filter = {};
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const selectExclude = name === 'User' ? '-passwordHash -youtubeTokens' : '';

        let docs = await Model.find(filter).select(selectExclude).sort('-createdAt');

        // Apply search in JS for memory store compatibility
        if (search) {
            const searchLower = search.toLowerCase();
            docs = docs.filter(d => {
                if (name === 'User') {
                    return (d.email && d.email.toLowerCase().includes(searchLower)) ||
                        (d.displayName && d.displayName.toLowerCase().includes(searchLower));
                }
                if (name === 'Project') {
                    return d.title && d.title.toLowerCase().includes(searchLower);
                }
                return true;
            });
        }

        const total = docs.length;
        const paged = docs.slice(skip, skip + parseInt(limit));
        res.json({ docs: paged, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) { res.status(500).json({ error: 'Browse failed' }); }
});

// GET /api/admin/activity — Activity logs
router.get('/activity', authenticate, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await ActivityLog.find({}).sort('-createdAt').skip(skip).limit(parseInt(limit));
        const total = await ActivityLog.countDocuments({});
        res.json({ logs, total });
    } catch (err) {
        // If ActivityLog doesn't have data, return empty
        res.json({ logs: [], total: 0 });
    }
});

// GET /api/admin/export/:collection — Export data as JSON
router.get('/export/:collection', authenticate, requireAdmin, async (req, res) => {
    try {
        const { collection } = req.params;
        const { format = 'json' } = req.query;
        const models = { User, Project, Asset, ActivityLog };
        const Model = models[collection];
        if (!Model) return res.status(404).json({ error: 'Collection not found' });

        const selectExclude = collection === 'User' ? '-passwordHash -youtubeTokens' : '';
        const docs = await Model.find({}).select(selectExclude).sort('-createdAt');

        if (format === 'csv') {
            if (docs.length === 0) return res.status(200).send('');
            const firstDoc = docs[0].toObject ? docs[0].toObject() : docs[0];
            const headers = Object.keys(firstDoc).filter(k => typeof firstDoc[k] !== 'object');
            const rows = docs.map(d => {
                const obj = d.toObject ? d.toObject() : d;
                return headers.map(h => JSON.stringify(obj[h] ?? '')).join(',');
            });
            const csv = [headers.join(','), ...rows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${collection}_export.csv`);
            return res.send(csv);
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${collection}_export.json`);
        res.json(docs);
    } catch (err) { res.status(500).json({ error: 'Export failed' }); }
});

// PUT /api/admin/bootstrap — Upgrade current user to superadmin (first-time setup)
router.put('/bootstrap', authenticate, async (req, res) => {
    try {
        // Only allow if no admins exist yet
        const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
        if (adminCount > 0) return res.status(403).json({ error: 'Admin already exists. Use an admin account to manage roles.' });
        const user = await User.findByIdAndUpdate(req.userId, { role: 'superadmin' }, { new: true }).select('-passwordHash -youtubeTokens');

        // Audit trail
        await logAdminAction(req.userId, 'bootstrap_superadmin', 'User', req.userId, {});

        res.json({ ok: true, user });
    } catch (err) { res.status(500).json({ error: 'Bootstrap failed' }); }
});

export default router;
