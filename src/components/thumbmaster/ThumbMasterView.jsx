import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Image, Upload, Sparkles, RefreshCw, Eye, BarChart3, Type,
    Smile, Download, Star, Target, CheckCircle2, Palette, Layers, Shield
} from 'lucide-react';
import { uploadFile, analyzeThumbnail, compareThumbnails } from '../../services/awsService';

export function ThumbMasterView() {
    const { user } = useAuth();
    const { error: showError } = useNotification();
    const [videoTitle, setVideoTitle] = useState('');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [thumbnails, setThumbnails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedThumb, setSelectedThumb] = useState(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const niche = user?.niche || 'general';
    const [s3Key, setS3Key] = useState(null);
    const [rekAnalysis, setRekAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setUploadedImage(ev.target.result);
        reader.readAsDataURL(file);

        // Upload to S3 for Rekognition
        try {
            const result = await uploadFile(file, 'thumbnails');
            setS3Key(result.key);

            // Auto-analyze with Rekognition
            setAnalyzing(true);
            const analysis = await analyzeThumbnail(result.key);
            setRekAnalysis(analysis);
            setAnalyzing(false);
        } catch (err) {
            showError('Upload or analysis failed');
            setAnalyzing(false);
        }
    };

    const generateThumbnails = useCallback(async () => {
        if (!videoTitle.trim()) {
            showError('Enter a video title first');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/thumbnails/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ title: videoTitle, niche, hasImage: !!uploadedImage }),
            });
            const data = await res.json();
            if (data.thumbnails) {
                setThumbnails(data.thumbnails);
                if (data.thumbnails.length > 0) setSelectedThumb(data.thumbnails[0]);
            }
        } catch (err) {
            showError('Failed to generate thumbnails');
        }
        setLoading(false);
    }, [videoTitle, niche, uploadedImage, showError]);

    const getCTRColor = (score) => {
        if (score >= 8) return 'text-green-400 bg-green-500/20';
        if (score >= 5) return 'text-amber-400 bg-amber-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Image className="text-cyan-400" size={22} /> ThumbMaster AI
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Generate click-worthy thumbnails with AI</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-2 block">Video Title</label>
                        <input
                            value={videoTitle}
                            onChange={e => setVideoTitle(e.target.value)}
                            placeholder="Enter your video title..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-2 block">Reference Frame (Optional)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-cyan-500/30 transition-all"
                        >
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Uploaded" className="max-h-32 mx-auto rounded-lg" />
                            ) : (
                                <>
                                    <Upload size={24} className="mx-auto mb-2 text-zinc-600" />
                                    <p className="text-xs text-zinc-500">Upload a video frame</p>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    {/* Rekognition Analysis */}
                    {analyzing && (
                        <div className="flex items-center gap-2 p-3 bg-orange-500/[0.05] rounded-xl text-[11px] text-orange-400">
                            <RefreshCw size={12} className="animate-spin" /> Analyzing with AWS Rekognition...
                        </div>
                    )}
                    {rekAnalysis && (
                        <div className="space-y-3">
                            {/* Thumbnail Score */}
                            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Thumbnail Score</span>
                                    <span className={`text-2xl font-black ${rekAnalysis.thumbnailScore >= 70 ? 'text-green-400' : rekAnalysis.thumbnailScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {rekAnalysis.thumbnailScore}/100
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${rekAnalysis.thumbnailScore >= 70 ? 'bg-green-500' : rekAnalysis.thumbnailScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${rekAnalysis.thumbnailScore}%` }} />
                                </div>
                            </div>

                            {/* Faces */}
                            {rekAnalysis.faces?.length > 0 && (
                                <div className="p-3 bg-blue-500/[0.03] rounded-xl border border-blue-500/10">
                                    <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider mb-1">Faces Detected: {rekAnalysis.faces.length}</p>
                                    {rekAnalysis.faces.map((f, i) => (
                                        <div key={i} className="text-[10px] text-zinc-400">
                                            {f.emotions?.[0] && <span className="text-blue-300">Emotion: {f.emotions[0].type}</span>}
                                            {f.smile && <span className="ml-2 text-green-400">😊 Smiling</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Labels */}
                            {rekAnalysis.labels?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {rekAnalysis.labels.slice(0, 10).map((l, i) => (
                                        <span key={i} className="text-[9px] bg-white/[0.04] rounded-lg px-2 py-0.5 text-zinc-400">{l.name} ({l.confidence}%)</span>
                                    ))}
                                </div>
                            )}

                            {/* Suggestions */}
                            {rekAnalysis.suggestions?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">AI Suggestions</p>
                                    {rekAnalysis.suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-400">
                                            <CheckCircle2 size={10} className="text-cyan-400 mt-0.5 shrink-0" />
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={generateThumbnails}
                        disabled={loading || !videoTitle.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {loading ? 'Generating Variations...' : 'Generate 5 Thumbnail Ideas'}
                    </button>
                </div>

                {/* Selected Thumbnail Preview */}
                {selectedThumb && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold">Preview: Variation {selectedThumb.variant}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${getCTRColor(selectedThumb.ctrScore)}`}>
                                CTR Score: {selectedThumb.ctrScore}/10
                            </span>
                        </div>

                        {/* Thumbnail Canvas Mockup */}
                        <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl overflow-hidden mb-4 border border-white/10">
                            {uploadedImage && (
                                <img src={uploadedImage} alt="Base" className="w-full h-full object-cover opacity-60" />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                <div
                                    className="text-center font-black text-xl leading-tight drop-shadow-lg"
                                    style={{
                                        color: selectedThumb.textColor || '#FFFFFF',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                        WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {selectedThumb.overlayText || videoTitle}
                                </div>
                                {selectedThumb.subtextOverlay && (
                                    <div className="mt-2 px-3 py-1 bg-red-600 rounded-md text-xs font-bold">
                                        {selectedThumb.subtextOverlay}
                                    </div>
                                )}
                            </div>
                            {/* Expression badge */}
                            {selectedThumb.faceExpression && (
                                <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 text-[9px] text-zinc-300">
                                    <Smile size={10} className="inline mr-1" /> {selectedThumb.faceExpression}
                                </div>
                            )}
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-400">AI Suggestions</h4>
                            {(selectedThumb.suggestions || []).map((sug, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-white/[0.03] rounded-lg">
                                    <CheckCircle2 size={12} className="text-cyan-400 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-zinc-300">{sug}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Variations Grid */}
            {thumbnails.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Layers size={14} className="text-cyan-400" /> Generated Variations
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {thumbnails.map((thumb, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedThumb(thumb)}
                                className={`rounded-xl overflow-hidden border-2 transition-all ${selectedThumb?.variant === thumb.variant
                                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                                    : 'border-transparent hover:border-white/20'
                                    }`}
                            >
                                <div
                                    className="aspect-video flex items-center justify-center p-3 relative"
                                    style={{
                                        background: thumb.bgGradient || 'linear-gradient(135deg, #1a1a2e, #16213e)',
                                    }}
                                >
                                    <div
                                        className="text-center font-black text-[10px] leading-tight"
                                        style={{ color: thumb.textColor || '#FFFFFF', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                                    >
                                        {thumb.overlayText || videoTitle}
                                    </div>
                                    {thumb.subtextOverlay && (
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-red-600 rounded px-1.5 py-0.5 text-[7px] font-bold">
                                            {thumb.subtextOverlay}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-white/[0.02] flex items-center justify-between">
                                    <span className="text-[9px] font-semibold text-zinc-500">V{thumb.variant}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${getCTRColor(thumb.ctrScore)}`}>
                                        {thumb.ctrScore}/10
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* A/B Test Predictions */}
            {thumbnails.length > 0 && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <BarChart3 size={14} className="text-purple-400" /> A/B Test Prediction
                    </h3>
                    <div className="space-y-2">
                        {[...thumbnails].sort((a, b) => b.ctrScore - a.ctrScore).map((thumb, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-zinc-500 w-4">{i + 1}</span>
                                <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                        style={{ width: `${(thumb.ctrScore / 10) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-zinc-400">V{thumb.variant}: {thumb.ctrScore}/10</span>
                                {i === 0 && <Star size={12} className="text-amber-400" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
