import { Router } from 'express';
import {
    CreateTableCommand,
    DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDb, ddbClient, DYNAMODB_PREFIX } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Table names
const TABLES = {
    creators: `${DYNAMODB_PREFIX}creators`,
    scripts: `${DYNAMODB_PREFIX}scripts`,
    trends: `${DYNAMODB_PREFIX}trends`,
    analytics: `${DYNAMODB_PREFIX}analytics`,
    sessions: `${DYNAMODB_PREFIX}sessions`,
};

// --- Creator Profile ---

// POST /api/db/creator
router.post('/creator', authenticate, async (req, res) => {
    try {
        const { email, niche, youtubeUrl, creatorVoice, preferences } = req.body;

        await dynamoDb.send(new PutCommand({
            TableName: TABLES.creators,
            Item: {
                userId: req.userId,
                email,
                niche,
                youtubeUrl,
                creatorVoice,
                preferences,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            },
        }));

        res.json({ message: 'Creator profile saved', userId: req.userId });
    } catch (err) {
        console.error('DynamoDB creator save error:', err.message);
        res.status(500).json({ error: 'Failed to save creator profile' });
    }
});

// GET /api/db/creator/:userId
router.get('/creator/:userId', authenticate, async (req, res) => {
    try {
        const result = await dynamoDb.send(new GetCommand({
            TableName: TABLES.creators,
            Key: { userId: req.params.userId },
        }));

        if (!result.Item) return res.status(404).json({ error: 'Creator not found' });
        res.json(result.Item);
    } catch (err) {
        console.error('DynamoDB creator get error:', err.message);
        res.status(500).json({ error: 'Failed to get creator profile' });
    }
});

// --- Scripts ---

// POST /api/db/script
router.post('/script', authenticate, async (req, res) => {
    try {
        const { title, content, niche, language, status } = req.body;
        const scriptId = `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await dynamoDb.send(new PutCommand({
            TableName: TABLES.scripts,
            Item: {
                userId: req.userId,
                scriptId,
                title: title || 'Untitled Script',
                content,
                niche,
                language: language || 'hinglish',
                status: status || 'draft',
                createdAt: new Date().toISOString(),
            },
        }));

        res.json({ message: 'Script saved', scriptId });
    } catch (err) {
        console.error('DynamoDB script save error:', err.message);
        res.status(500).json({ error: 'Failed to save script' });
    }
});

// GET /api/db/scripts/:userId
router.get('/scripts/:userId', authenticate, async (req, res) => {
    try {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: TABLES.scripts,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': req.params.userId },
            ScanIndexForward: false, // newest first
        }));

        res.json(result.Items || []);
    } catch (err) {
        console.error('DynamoDB scripts list error:', err.message);
        res.status(500).json({ error: 'Failed to list scripts' });
    }
});

// --- Analytics ---

// POST /api/db/analytics
router.post('/analytics', authenticate, async (req, res) => {
    try {
        const { videoId, metrics, retentionData, anomalies, growthScore } = req.body;
        if (!videoId) return res.status(400).json({ error: 'videoId is required' });

        await dynamoDb.send(new PutCommand({
            TableName: TABLES.analytics,
            Item: {
                userId: req.userId,
                videoId,
                metrics,
                retentionData,
                anomalies,
                growthScore,
                analyzedAt: new Date().toISOString(),
            },
        }));

        res.json({ message: 'Analytics saved', videoId });
    } catch (err) {
        console.error('DynamoDB analytics save error:', err.message);
        res.status(500).json({ error: 'Failed to save analytics' });
    }
});

// GET /api/db/analytics/:userId
router.get('/analytics/:userId', authenticate, async (req, res) => {
    try {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: TABLES.analytics,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': req.params.userId },
            ScanIndexForward: false,
        }));

        res.json(result.Items || []);
    } catch (err) {
        console.error('DynamoDB analytics list error:', err.message);
        res.status(500).json({ error: 'Failed to list analytics' });
    }
});

// --- Trends Cache ---

// GET /api/db/trends/:niche
router.get('/trends/:niche', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await dynamoDb.send(new GetCommand({
            TableName: TABLES.trends,
            Key: { niche: req.params.niche, date: today },
        }));

        if (result.Item) {
            const fetchedAt = new Date(result.Item.fetchedAt);
            const hoursSinceCache = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);

            if (hoursSinceCache < 24) {
                return res.json({ cached: true, ...result.Item });
            }
        }

        res.json({ cached: false, message: 'No cached trends, fetch new data' });
    } catch (err) {
        console.error('DynamoDB trends get error:', err.message);
        res.status(500).json({ error: 'Failed to get cached trends' });
    }
});

// POST /api/db/trends (save cache)
router.post('/trends', authenticate, async (req, res) => {
    try {
        const { niche, trends, viralSignals, region } = req.body;
        if (!niche) return res.status(400).json({ error: 'Niche is required' });

        const today = new Date().toISOString().split('T')[0];
        const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24hr TTL

        await dynamoDb.send(new PutCommand({
            TableName: TABLES.trends,
            Item: {
                niche,
                date: today,
                trends,
                viralSignals,
                region: region || 'Pan-India',
                fetchedAt: new Date().toISOString(),
                ttl,
            },
        }));

        res.json({ message: 'Trends cached', niche, date: today });
    } catch (err) {
        console.error('DynamoDB trends save error:', err.message);
        res.status(500).json({ error: 'Failed to cache trends' });
    }
});

export default router;
