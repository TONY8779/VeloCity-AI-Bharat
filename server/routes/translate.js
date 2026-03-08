import { Router } from 'express';
import { TranslateTextCommand } from '@aws-sdk/client-translate';
import { translateClient } from '../config/aws.js';

const router = Router();

const SUPPORTED_LANGUAGES = {
    hi: 'Hindi', en: 'English', ta: 'Tamil', te: 'Telugu',
    mr: 'Marathi', bn: 'Bengali', kn: 'Kannada', ml: 'Malayalam',
};

// --- POST /api/translate/text ---
router.post('/text', async (req, res) => {
    try {
        const { text, sourceLanguage, targetLanguage } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        if (!targetLanguage) return res.status(400).json({ error: 'Target language is required' });

        const result = await translateClient.send(new TranslateTextCommand({
            Text: text,
            SourceLanguageCode: sourceLanguage || 'auto',
            TargetLanguageCode: targetLanguage,
        }));

        res.json({
            translatedText: result.TranslatedText,
            sourceLanguage: result.SourceLanguageCode,
            targetLanguage: result.TargetLanguageCode,
        });
    } catch (err) {
        console.error('Translate text error:', err.message);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// --- POST /api/translate/script ---
router.post('/script', async (req, res) => {
    try {
        const { script, targetLanguage } = req.body;
        if (!script || !targetLanguage) {
            return res.status(400).json({ error: 'Script and targetLanguage are required' });
        }

        async function translateField(text) {
            if (!text) return text;
            const result = await translateClient.send(new TranslateTextCommand({
                Text: text,
                SourceLanguageCode: 'auto',
                TargetLanguageCode: targetLanguage,
            }));
            return result.TranslatedText;
        }

        const translatedScript = {
            title: await translateField(script.title),
            hook: await translateField(script.hook),
            cta: await translateField(script.cta),
            body: await translateField(script.body),
            sections: script.sections ? await Promise.all(
                script.sections.map(async (section) => ({
                    ...section,
                    text: await translateField(section.text),
                    notes: await translateField(section.notes),
                }))
            ) : undefined,
            captions: script.captions ? await Promise.all(
                script.captions.map(cap => translateField(cap))
            ) : undefined,
            // Keep music unchanged
            music: script.music,
        };

        res.json({
            originalLanguage: 'auto',
            targetLanguage,
            targetLanguageName: SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage,
            script: translatedScript,
        });
    } catch (err) {
        console.error('Translate script error:', err.message);
        res.status(500).json({ error: 'Script translation failed' });
    }
});

// --- POST /api/translate/batch ---
router.post('/batch', async (req, res) => {
    try {
        const { texts, targetLanguages } = req.body;
        if (!texts || !targetLanguages) {
            return res.status(400).json({ error: 'texts and targetLanguages arrays are required' });
        }

        const translations = {};
        for (const lang of targetLanguages) {
            translations[lang] = await Promise.all(
                texts.map(async (text) => {
                    const result = await translateClient.send(new TranslateTextCommand({
                        Text: text,
                        SourceLanguageCode: 'auto',
                        TargetLanguageCode: lang,
                    }));
                    return result.TranslatedText;
                })
            );
        }

        res.json({ translations });
    } catch (err) {
        console.error('Translate batch error:', err.message);
        res.status(500).json({ error: 'Batch translation failed' });
    }
});

// --- GET /api/translate/languages ---
router.get('/languages', async (req, res) => {
    res.json({ languages: SUPPORTED_LANGUAGES });
});

export default router;
