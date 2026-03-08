import { Router } from 'express';
import {
    DetectFacesCommand,
    DetectLabelsCommand,
    DetectTextCommand,
    DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';
import { rekognitionClient, S3_BUCKET } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function calculateThumbnailScore(faces, labels, textDetections) {
    let score = 40; // Base score

    // Face bonus (up to +25)
    if (faces.length > 0) {
        score += 15; // Face present
        const mainFace = faces[0];
        if (mainFace.Quality?.Brightness > 50) score += 5;
        if (mainFace.Quality?.Sharpness > 50) score += 5;
        const box = mainFace.BoundingBox;
        if (box && box.Width > 0.15 && box.Width < 0.6) score += 5; // Good face size
    }

    // Labels bonus (up to +15)
    const highConfLabels = labels.filter(l => l.Confidence > 80);
    if (highConfLabels.length >= 3) score += 10;
    if (highConfLabels.length >= 6) score += 5;

    // Text bonus (up to +20)
    if (textDetections.length > 0 && textDetections.length <= 5) score += 15;
    if (textDetections.some(t => t.Confidence > 95)) score += 5;
    if (textDetections.length > 8) score -= 10; // Too cluttered

    return Math.min(100, Math.max(0, score));
}

function generateSuggestions(faces, labels, textDetections, score) {
    const suggestions = [];
    if (faces.length === 0) suggestions.push('Add a human face — thumbnails with faces get 38% more clicks');
    if (faces.length > 0 && faces[0].BoundingBox?.Width < 0.1) suggestions.push('Face is too small — make it larger for better visibility on mobile');
    if (faces.length > 0 && faces[0].Quality?.Brightness < 40) suggestions.push('Image is too dark — increase brightness and contrast');
    if (textDetections.length === 0) suggestions.push('Consider adding text overlay — 2-4 bold words boost CTR');
    if (textDetections.length > 6) suggestions.push('Too much text — simplify to 2-4 impactful words');
    if (labels.filter(l => l.Confidence > 80).length < 3) suggestions.push('Add more visual elements — the image lacks distinct subjects');
    if (score < 60) suggestions.push('Use brighter colors and higher contrast for better visibility in YouTube recommendations');
    if (faces.length > 0) {
        const emotions = faces[0].Emotions || [];
        const topEmotion = emotions.sort((a, b) => b.Confidence - a.Confidence)[0];
        if (topEmotion && topEmotion.Type !== 'SURPRISED' && topEmotion.Type !== 'HAPPY') {
            suggestions.push('Express surprise or happiness — these emotions get more clicks');
        }
    }
    return suggestions;
}

// --- POST /api/rekognition/analyze-thumbnail ---
router.post('/analyze-thumbnail', authenticate, async (req, res) => {
    try {
        const { s3Key } = req.body;
        if (!s3Key) return res.status(400).json({ error: 's3Key is required' });

        const image = { S3Object: { Bucket: S3_BUCKET, Name: s3Key } };

        const [faceResult, labelResult, textResult] = await Promise.all([
            rekognitionClient.send(new DetectFacesCommand({ Image: image, Attributes: ['ALL'] })),
            rekognitionClient.send(new DetectLabelsCommand({ Image: image, MaxLabels: 20, MinConfidence: 60 })),
            rekognitionClient.send(new DetectTextCommand({ Image: image })),
        ]);

        const faces = (faceResult.FaceDetails || []).map(f => ({
            boundingBox: f.BoundingBox,
            emotions: (f.Emotions || []).sort((a, b) => b.Confidence - a.Confidence).slice(0, 3).map(e => ({
                type: e.Type, confidence: Math.round(e.Confidence),
            })),
            quality: { brightness: Math.round(f.Quality?.Brightness || 0), sharpness: Math.round(f.Quality?.Sharpness || 0) },
            smile: f.Smile?.Value || false,
            ageRange: f.AgeRange,
        }));

        const labels = (labelResult.Labels || []).map(l => ({
            name: l.Name, confidence: Math.round(l.Confidence),
        }));

        const text = (textResult.TextDetections || []).filter(t => t.Type === 'LINE').map(t => ({
            detectedText: t.DetectedText, confidence: Math.round(t.Confidence),
        }));

        const thumbnailScore = calculateThumbnailScore(faceResult.FaceDetails || [], labelResult.Labels || [], textResult.TextDetections || []);
        const suggestions = generateSuggestions(faceResult.FaceDetails || [], labelResult.Labels || [], textResult.TextDetections || [], thumbnailScore);

        res.json({ faces, labels, text, thumbnailScore, suggestions });
    } catch (err) {
        console.error('Rekognition analyze error:', err.message);
        res.status(500).json({ error: 'Failed to analyze thumbnail' });
    }
});

// --- POST /api/rekognition/compare-thumbnails ---
router.post('/compare-thumbnails', authenticate, async (req, res) => {
    try {
        const { s3Keys } = req.body;
        if (!s3Keys || !Array.isArray(s3Keys) || s3Keys.length < 2) {
            return res.status(400).json({ error: 'At least 2 s3Keys are required' });
        }

        const analyses = await Promise.all(
            s3Keys.map(async (s3Key) => {
                const image = { S3Object: { Bucket: S3_BUCKET, Name: s3Key } };
                const [faceResult, labelResult, textResult] = await Promise.all([
                    rekognitionClient.send(new DetectFacesCommand({ Image: image, Attributes: ['ALL'] })),
                    rekognitionClient.send(new DetectLabelsCommand({ Image: image, MaxLabels: 20, MinConfidence: 60 })),
                    rekognitionClient.send(new DetectTextCommand({ Image: image })),
                ]);

                const score = calculateThumbnailScore(faceResult.FaceDetails || [], labelResult.Labels || [], textResult.TextDetections || []);

                return {
                    s3Key,
                    thumbnailScore: score,
                    faceCount: (faceResult.FaceDetails || []).length,
                    labelCount: (labelResult.Labels || []).length,
                    textCount: (textResult.TextDetections || []).filter(t => t.Type === 'LINE').length,
                    suggestions: generateSuggestions(faceResult.FaceDetails || [], labelResult.Labels || [], textResult.TextDetections || [], score),
                };
            })
        );

        const ranked = analyses.sort((a, b) => b.thumbnailScore - a.thumbnailScore);
        const winner = ranked[0];

        res.json({
            ranked,
            recommendation: `Thumbnail "${winner.s3Key.split('/').pop()}" scores highest at ${winner.thumbnailScore}/100`,
        });
    } catch (err) {
        console.error('Rekognition compare error:', err.message);
        res.status(500).json({ error: 'Failed to compare thumbnails' });
    }
});

// --- POST /api/rekognition/detect-content ---
router.post('/detect-content', authenticate, async (req, res) => {
    try {
        const { s3Key } = req.body;
        if (!s3Key) return res.status(400).json({ error: 's3Key is required' });

        const result = await rekognitionClient.send(new DetectModerationLabelsCommand({
            Image: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } },
            MinConfidence: 50,
        }));

        const labels = (result.ModerationLabels || []).map(l => ({
            name: l.Name, confidence: Math.round(l.Confidence), parentName: l.ParentName,
        }));

        res.json({
            safe: labels.length === 0,
            labels,
            summary: labels.length === 0 ? 'Content is safe for all audiences' : `Detected ${labels.length} moderation flag(s)`,
        });
    } catch (err) {
        console.error('Rekognition moderation error:', err.message);
        res.status(500).json({ error: 'Failed to detect content safety' });
    }
});

export default router;
