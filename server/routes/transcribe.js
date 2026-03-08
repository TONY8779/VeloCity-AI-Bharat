import { Router } from 'express';
import {
    StartTranscriptionJobCommand,
    GetTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { transcribeClient, s3Client, S3_BUCKET } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// --- POST /api/transcribe/start ---
router.post('/start', authenticate, async (req, res) => {
    try {
        const { s3Key, languageCode } = req.body;
        if (!s3Key) return res.status(400).json({ error: 's3Key is required' });

        const jobName = `velocity-${req.userId}-${Date.now()}`;
        const mediaUri = `s3://${S3_BUCKET}/${s3Key}`;

        const langCode = languageCode || 'hi-IN';
        const params = {
            TranscriptionJobName: jobName,
            Media: { MediaFileUri: mediaUri },
            OutputBucketName: S3_BUCKET,
            OutputKey: `transcriptions/${jobName}.json`,
            LanguageCode: langCode === 'auto' ? undefined : langCode,
            IdentifyLanguage: langCode === 'auto' ? true : undefined,
            Settings: {
                ShowSpeakerLabels: true,
                MaxSpeakerLabels: 5,
                ShowAlternatives: true,
                MaxAlternatives: 3,
            },
        };

        await transcribeClient.send(new StartTranscriptionJobCommand(params));

        res.json({ jobId: jobName, status: 'IN_PROGRESS' });
    } catch (err) {
        console.error('Transcribe start error:', err.message);
        res.status(500).json({ error: 'Failed to start transcription' });
    }
});

// --- GET /api/transcribe/status/:jobId ---
router.get('/status/:jobId', authenticate, async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await transcribeClient.send(
            new GetTranscriptionJobCommand({ TranscriptionJobName: jobId })
        );

        const job = result.TranscriptionJob;
        const status = job.TranscriptionJobStatus;

        if (status === 'COMPLETED') {
            // Fetch transcript from S3
            const outputKey = `transcriptions/${jobId}.json`;
            try {
                const s3Result = await s3Client.send(new GetObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: outputKey,
                }));
                const transcriptBody = await s3Result.Body.transformToString();
                const transcriptData = JSON.parse(transcriptBody);

                // Parse into segments
                const items = transcriptData.results?.items || [];
                const segments = [];
                let currentSegment = { startTime: null, endTime: null, text: '', speaker: '' };

                for (const item of items) {
                    if (item.type === 'pronunciation') {
                        if (!currentSegment.startTime) {
                            currentSegment.startTime = parseFloat(item.start_time || 0);
                            currentSegment.speaker = item.speaker_label || 'spk_0';
                        }
                        currentSegment.endTime = parseFloat(item.end_time || 0);
                        currentSegment.text += (currentSegment.text ? ' ' : '') + item.alternatives[0].content;
                    } else if (item.type === 'punctuation') {
                        currentSegment.text += item.alternatives[0].content;
                    }

                    // Split segments roughly every 5 seconds
                    if (currentSegment.endTime && currentSegment.startTime &&
                        (currentSegment.endTime - currentSegment.startTime) >= 5) {
                        segments.push({ ...currentSegment });
                        currentSegment = { startTime: null, endTime: null, text: '', speaker: '' };
                    }
                }
                if (currentSegment.text) segments.push(currentSegment);

                const fullText = transcriptData.results?.transcripts?.[0]?.transcript || '';

                res.json({
                    status: 'COMPLETED',
                    transcript: { text: fullText, segments },
                    languageCode: job.LanguageCode || 'unknown',
                });
            } catch (fetchErr) {
                console.error('Transcript fetch error:', fetchErr.message);
                res.json({ status: 'COMPLETED', transcript: { text: '', segments: [] }, error: 'Could not fetch transcript file' });
            }
        } else if (status === 'FAILED') {
            res.json({ status: 'FAILED', reason: job.FailureReason || 'Unknown error' });
        } else {
            res.json({ status });
        }
    } catch (err) {
        console.error('Transcribe status error:', err.message);
        res.status(500).json({ error: 'Failed to check transcription status' });
    }
});

export default router;
