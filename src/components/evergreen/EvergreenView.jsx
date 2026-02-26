import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Repeat, Sparkles, RefreshCw, ArrowRight, TrendingUp, Video, FileText,
    MessageSquare, Linkedin, Instagram, Youtube, Twitter, Copy, Layers, Zap
} from 'lucide-react';

const PLATFORM_ICONS = {
    youtube: Youtube,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    tiktok: Video,
};

const PLATFORM_COLORS = {
    youtube: 'text-red-400 bg-red-500/20 border-red-500/20',
    instagram: 'text-pink-400 bg-pink-500/20 border-pink-500/20',
    twitter: 'text-blue-400 bg-blue-500/20 border-blue-500/20',
    linkedin: 'text-blue-400 bg-blue-600/20 border-blue-600/20',
    tiktok: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/20',
};

export function EvergreenView() {
    const { user } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const [contentUrl, setContentUrl] = useState('');
    const [contentText, setContentText] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const niche = user?.niche || 'general';

    const analyzeContent = useCallback(async () => {
        if (!contentText.trim() && !contentUrl.trim()) {
            showError('Enter content text or URL');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/evergreen/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ content: contentText || contentUrl, niche }),
            });
            const data = await res.json();
            if (data) setResults(data);
        } catch (err) { showError('Failed to analyze content'); }
        setLoading(false);
    }, [contentText, contentUrl, niche, showError]);

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        showSuccess('Copied!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Repeat className="text-teal-400" size={22} /> Evergreen Content Manager
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Maximize content ROI with smart repurposing strategies</p>
            </div>

            {/* Input */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <div>
                    <label className="text-xs font-semibold text-zinc-400 mb-2 block">Your Content</label>
                    <textarea
                        value={contentText}
                        onChange={e => setContentText(e.target.value)}
                        placeholder="Paste your best-performing content (video script, tweet thread, blog post) or describe it..."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 resize-none"
                    />
                </div>
                <button
                    onClick={analyzeContent}
                    disabled={loading || (!contentText.trim() && !contentUrl.trim())}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? 'Analyzing...' : 'Analyze & Generate Variations'}
                </button>
            </div>

            {/* Results */}
            {results ? (
                <div className="space-y-5">
                    {/* Performance Score */}
                    {results.performanceScore && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp size={14} className="text-teal-400" /> Evergreen Potential
                                </h3>
                                <span className={`text-lg font-black ${results.performanceScore >= 8 ? 'text-green-400' :
                                        results.performanceScore >= 5 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                    {results.performanceScore}/10
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400">{results.performanceAnalysis}</p>
                        </div>
                    )}

                    {/* Repurposing Strategies */}
                    {results.strategies && results.strategies.length > 0 && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                                <Layers size={14} className="text-purple-400" /> Repurposing Strategies
                            </h3>
                            <div className="space-y-3">
                                {results.strategies.map((strat, i) => (
                                    <div key={i} className="p-4 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap size={12} className="text-amber-400" />
                                            <span className="text-xs font-bold">{strat.from}</span>
                                            <ArrowRight size={12} className="text-zinc-600" />
                                            <span className="text-xs font-bold text-teal-400">{strat.to}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400">{strat.howTo}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platform Variations */}
                    {results.variations && results.variations.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Repeat size={14} className="text-teal-400" /> Platform Variations
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.variations.map((variation, i) => {
                                    const PlatformIcon = PLATFORM_ICONS[variation.platform?.toLowerCase()] || FileText;
                                    const colorClass = PLATFORM_COLORS[variation.platform?.toLowerCase()] || 'text-zinc-400 bg-zinc-500/20 border-zinc-500/20';
                                    return (
                                        <div key={i} className={`p-4 rounded-xl border ${colorClass.split(' ').slice(2).join(' ')} bg-white/[0.02]`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <PlatformIcon size={14} className={colorClass.split(' ')[0]} />
                                                    <span className="text-xs font-bold capitalize">{variation.platform}</span>
                                                </div>
                                                <button
                                                    onClick={() => copyText(variation.content)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                                >
                                                    <Copy size={12} className="text-zinc-400" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{variation.content}</p>
                                            {variation.tips && (
                                                <p className="text-[10px] text-zinc-500 mt-2 pt-2 border-t border-white/5">
                                                    💡 {variation.tips}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : !loading ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Repeat size={28} className="text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Repurpose Your Best Content</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Paste any content — turn Reels into YouTube Shorts, tweet threads into LinkedIn posts, and more.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
