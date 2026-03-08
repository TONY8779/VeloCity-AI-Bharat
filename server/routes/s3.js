import { Router } from 'express';
import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import { s3Client, S3_BUCKET, CLOUDFRONT_DOMAIN } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Multer memory storage for S3 upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

function getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
        pdf: 'application/pdf', json: 'application/json', txt: 'text/plain',
    };
    return types[ext] || 'application/octet-stream';
}

function getS3Url(key) {
    return `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;
}

function getCloudfrontUrl(key) {
    return CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${key}` : null;
}

// --- POST /api/s3/upload ---
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const type = req.body.type || 'assets';
        const validTypes = ['videos', 'thumbnails', 'assets', 'scripts'];
        const folder = validTypes.includes(type) ? type : 'assets';

        const key = `${req.userId}/${folder}/${Date.now()}-${req.file.originalname}`;

        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: getContentType(req.file.originalname),
        }));

        res.json({
            key,
            s3Url: getS3Url(key),
            cloudfrontUrl: getCloudfrontUrl(key),
            size: req.file.size,
            contentType: req.file.mimetype,
        });
    } catch (err) {
        console.error('S3 upload error:', err.message);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// --- GET /api/s3/files/:userId ---
router.get('/files/:userId', authenticate, async (req, res) => {
    try {
        const prefix = `${req.params.userId}/`;
        const result = await s3Client.send(new ListObjectsV2Command({
            Bucket: S3_BUCKET,
            Prefix: prefix,
            MaxKeys: 1000,
        }));

        const files = { videos: [], thumbnails: [], assets: [], scripts: [] };
        for (const obj of result.Contents || []) {
            const parts = obj.Key.split('/');
            const type = parts[1] || 'assets';
            const item = {
                key: obj.Key,
                name: parts.slice(2).join('/'),
                size: obj.Size,
                lastModified: obj.LastModified,
                s3Url: getS3Url(obj.Key),
                cloudfrontUrl: getCloudfrontUrl(obj.Key),
            };
            if (files[type]) files[type].push(item);
            else files.assets.push(item);
        }

        res.json(files);
    } catch (err) {
        console.error('S3 list error:', err.message);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// --- DELETE /api/s3/files/:key ---
router.delete('/files/*', authenticate, async (req, res) => {
    try {
        const key = req.params[0];
        if (!key) return res.status(400).json({ error: 'File key is required' });

        await s3Client.send(new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
        }));

        res.json({ message: 'File deleted', key });
    } catch (err) {
        console.error('S3 delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// --- POST /api/s3/presigned ---
router.post('/presigned', authenticate, async (req, res) => {
    try {
        const { filename, type } = req.body;
        if (!filename) return res.status(400).json({ error: 'Filename is required' });

        const folder = ['videos', 'thumbnails', 'assets', 'scripts'].includes(type) ? type : 'assets';
        const key = `${req.userId}/${folder}/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: getContentType(filename),
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min

        res.json({ uploadUrl, fileKey: key, expiresIn: 900 });
    } catch (err) {
        console.error('Presigned URL error:', err.message);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

export default router;
