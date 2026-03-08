import { Router } from 'express';
import { SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { pollyClient, s3Client, S3_BUCKET } from '../config/aws.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const INDIAN_VOICES = [
    { id: 'Aditi', name: 'Aditi', language: 'Hindi (Female)', languageCode: 'hi-IN', engine: 'standard' },
    { id: 'Kajal', name: 'Kajal', language: 'Hindi (Female, Neural)', languageCode: 'hi-IN', engine: 'neural' },
];

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// --- POST /api/polly/synthesize ---
router.post('/synthesize', authenticate, async (req, res) => {
    try {
        const { text, voiceId, languageCode, speed } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const voice = voiceId || 'Kajal';
        const selectedVoice = INDIAN_VOICES.find(v => v.id === voice) || INDIAN_VOICES[1];

        // Use SSML for speed control if specified
        let inputText = text;
        let textType = 'text';
        if (speed && speed !== '100%') {
            inputText = `<speak><prosody rate="${speed}">${text}</prosody></speak>`;
            textType = 'ssml';
        }

        const command = new SynthesizeSpeechCommand({
            Text: inputText,
            TextType: textType,
            VoiceId: selectedVoice.id,
            LanguageCode: languageCode || selectedVoice.languageCode,
            Engine: selectedVoice.engine,
            OutputFormat: 'mp3',
        });

        const result = await pollyClient.send(command);
        const audioBuffer = await streamToBuffer(result.AudioStream);

        // Save to S3
        const s3Key = `${req.userId}/audio/${Date.now()}-polly.mp3`;
        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        }));

        const audioUrl = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${s3Key}`;

        // Estimate duration (MP3 at ~128kbps)
        const estimatedDuration = Math.round((audioBuffer.length / 16000) * 10) / 10;

        res.json({ audioUrl, duration: estimatedDuration, s3Key, voiceId: selectedVoice.id });
    } catch (err) {
        console.error('Polly synthesize error:', err.message);
        res.status(500).json({ error: 'Failed to synthesize speech' });
    }
});

// --- POST /api/polly/teleprompter-audio ---
router.post('/teleprompter-audio', authenticate, async (req, res) => {
    try {
        const { scriptSections, voiceId } = req.body;
        if (!scriptSections || !Array.isArray(scriptSections) || scriptSections.length === 0) {
            return res.status(400).json({ error: 'scriptSections are required' });
        }

        const voice = voiceId || 'Kajal';
        const selectedVoice = INDIAN_VOICES.find(v => v.id === voice) || INDIAN_VOICES[1];
        const sectionTimestamps = [];
        const audioBuffers = [];
        let currentTime = 0;

        for (let i = 0; i < scriptSections.length; i++) {
            const section = scriptSections[i];

            const command = new SynthesizeSpeechCommand({
                Text: section.text,
                VoiceId: selectedVoice.id,
                LanguageCode: selectedVoice.languageCode,
                Engine: selectedVoice.engine,
                OutputFormat: 'mp3',
            });

            const result = await pollyClient.send(command);
            const buffer = await streamToBuffer(result.AudioStream);
            audioBuffers.push(buffer);

            const sectionDuration = Math.round((buffer.length / 16000) * 10) / 10;
            sectionTimestamps.push({
                sectionIndex: i,
                startTime: currentTime,
                endTime: currentTime + sectionDuration,
                text: section.text.substring(0, 100),
            });
            currentTime += sectionDuration + (section.pauseAfter || 1);

            // Add silence for pause (generate empty buffer)
            if (section.pauseAfter && section.pauseAfter > 0) {
                const silenceBytes = Math.round(section.pauseAfter * 16000);
                audioBuffers.push(Buffer.alloc(silenceBytes));
            }
        }

        // Combine all audio buffers
        const combinedBuffer = Buffer.concat(audioBuffers);

        // Save to S3
        const s3Key = `${req.userId}/audio/${Date.now()}-teleprompter.mp3`;
        await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: combinedBuffer,
            ContentType: 'audio/mpeg',
        }));

        const audioUrl = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${s3Key}`;

        res.json({ audioUrl, sectionTimestamps, totalDuration: currentTime, s3Key });
    } catch (err) {
        console.error('Polly teleprompter error:', err.message);
        res.status(500).json({ error: 'Failed to generate teleprompter audio' });
    }
});

// --- GET /api/polly/voices ---
router.get('/voices', authenticate, async (req, res) => {
    res.json({ voices: INDIAN_VOICES });
});

export default router;
