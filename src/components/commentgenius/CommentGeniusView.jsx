import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    MessageCircle, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, AlertTriangle,
    Pin, Reply, Send, Shield, Smile, Frown, Meh, BarChart3, Bot, Zap, Filter, Globe2, Brain
} from 'lucide-react';
import { analyzeComments as awsAnalyzeComments, chatWithAlgorithm } from '../../services/awsService';

const SENTIMENT_CONFIG = {
    positive: { icon: Smile, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Positive' },
    negative: { icon: Frown, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Negative' },
    neutral: { icon: Meh, color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Neutral' },
    spam: { icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Spam' },
};

export function CommentGeniusView() {
    const { user } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sampleText, setSampleText] = useState('');
    const [engagementTips, setEngagementTips] = useState([]);
    const [comprehendData, setComprehendData] = useState(null);
    const niche = user?.niche || 'general';

    const analyzeComments = useCallback(async () => {
        if (!sampleText.trim()) {
            showError('Paste some comments to analyze');
            return;
        }
        setLoading(true);
        try {
            // Parse comments from text
            const commentList = sampleText.split('\n').filter(c => c.trim()).map(text => ({ text: text.trim() }));

            // Use existing endpoint AND Comprehend in parallel
            const [existingRes, comprehendRes] = await Promise.all([
                fetch('/api/commentgenius/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('velocity_token')}` },
                    body: JSON.stringify({ comments: sampleText, niche }),
                }).then(r => r.json()).catch(() => null),
                awsAnalyzeComments(commentList).catch(() => null),
            ]);

            if (existingRes?.analyzed) setComments(existingRes.analyzed);
            if (existingRes?.engagementTips) setEngagementTips(existingRes.engagementTips);
            if (comprehendRes) setComprehendData(comprehendRes);
        } catch (err) { showError('Failed to analyze comments'); }
        setLoading(false);
    }, [sampleText, niche, showError]);

    const filteredComments = filter === 'all'
        ? comments
        : comments.filter(c => c.sentiment === filter);

    const sentimentCounts = {
        positive: comments.filter(c => c.sentiment === 'positive').length,
        negative: comments.filter(c => c.sentiment === 'negative').length,
        neutral: comments.filter(c => c.sentiment === 'neutral').length,
        spam: comments.filter(c => c.sentiment === 'spam').length,
    };

    const copyReply = (text) => {
        navigator.clipboard.writeText(text);
        showSuccess('Reply copied!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="text-sky-400" size={22} /> CommentGenius
                </h2>
                <p className="text-xs text-zinc-500 mt-1">AI-powered comment management & engagement · Powered by AWS Comprehend</p>
            </div>

            {/* Input Area */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <label className="text-xs font-semibold text-zinc-400 block">Paste Comments (one per line)</label>
                <textarea
                    value={sampleText}
                    onChange={e => setSampleText(e.target.value)}
                    placeholder={"Great video bro!\nThis is trash content\nCan you make a video on Python?\nFirst!!!\nCheck out my channel..."}
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 resize-none"
                />
                <button
                    onClick={analyzeComments}
                    disabled={loading || !sampleText.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                    {loading ? 'Analyzing...' : 'Analyze Comments'}
                </button>
            </div>

            {comments.length > 0 && (
                <>
                    {/* Sentiment Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(SENTIMENT_CONFIG).map(([key, { icon: Icon, color, bg, label }]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(filter === key ? 'all' : key)}
                                className={`p-4 rounded-xl border transition-all ${filter === key ? `${bg} border-current ${color}` : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                    }`}
                            >
                                <Icon size={18} className={filter === key ? color : 'text-zinc-500'} />
                                <div className="text-lg font-black mt-1">{sentimentCounts[key]}</div>
                                <div className="text-[9px] text-zinc-500 font-semibold">{label}</div>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Comment List */}
                        <div className="lg:col-span-2 space-y-2 max-h-[60vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    {filter === 'all' ? 'All' : SENTIMENT_CONFIG[filter]?.label} Comments ({filteredComments.length})
                                </h3>
                            </div>
                            {filteredComments.map((comment, i) => {
                                const config = SENTIMENT_CONFIG[comment.sentiment] || SENTIMENT_CONFIG.neutral;
                                const SentIcon = config.icon;
                                return (
                                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                                                <SentIcon size={14} className={config.color} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white">{comment.text}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${config.bg} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    {comment.isSpam && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center gap-1">
                                                            <AlertTriangle size={8} /> Potential Troll
                                                        </span>
                                                    )}
                                                    {comment.shouldPin && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                                                            <Pin size={8} /> Pin Worthy
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Auto-Reply */}
                                                {comment.suggestedReply && (
                                                    <div className="mt-2 p-2 bg-sky-500/5 border border-sky-500/10 rounded-lg">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-bold text-sky-400 flex items-center gap-1">
                                                                <Reply size={8} /> Suggested Reply
                                                            </span>
                                                            <button
                                                                onClick={() => copyReply(comment.suggestedReply)}
                                                                className="text-[9px] text-zinc-500 hover:text-white px-1.5 py-0.5 bg-white/5 rounded"
                                                            >
                                                                Copy
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-300">{comment.suggestedReply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Engagement Tips */}
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-400" /> Engagement Boost Tips
                                </h3>
                                <div className="space-y-2">
                                    {engagementTips.map((tip, i) => (
                                        <div key={i} className="p-3 bg-white/[0.03] rounded-xl">
                                            <p className="text-xs text-zinc-300">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <BarChart3 size={14} className="text-purple-400" /> Sentiment Breakdown
                                </h3>
                                {Object.entries(sentimentCounts).map(([key, count]) => {
                                    const config = SENTIMENT_CONFIG[key];
                                    const pct = comments.length > 0 ? (count / comments.length) * 100 : 0;
                                    return (
                                        <div key={key} className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] w-16 ${config.color}`}>{config.label}</span>
                                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                                <div className={`h-full rounded-full ${config.bg}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] text-zinc-500 w-8 text-right">{Math.round(pct)}%</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* AWS Comprehend Analysis */}
                            {comprehendData && (
                                <>
                                    {/* Language Breakdown */}
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <Globe2 size={14} className="text-green-400" /> Language Breakdown
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(comprehendData.languageBreakdown || {}).map(([lang, pct]) => (
                                                <div key={lang} className="bg-white/[0.03] rounded-xl p-3 text-center">
                                                    <p className="text-lg font-bold">{pct}%</p>
                                                    <p className="text-[9px] text-zinc-500 capitalize">{lang}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Key Phrases */}
                                    {comprehendData.topKeyPhrases?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                                <Brain size={14} className="text-blue-400" /> Key Phrases
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {comprehendData.topKeyPhrases.slice(0, 15).map((p, i) => (
                                                    <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                                        {p.phrase} ({p.count})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actionable Insights */}
                                    {comprehendData.actionableInsights?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/[0.03] to-blue-500/[0.03] border border-purple-500/10">
                                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                                <Sparkles size={14} className="text-purple-400" /> The Algorithm's Insights
                                            </h3>
                                            <div className="space-y-2">
                                                {comprehendData.actionableInsights.map((insight, i) => (
                                                    <div key={i} className="p-3 bg-white/[0.03] rounded-xl flex items-start gap-2">
                                                        <Zap size={12} className="text-amber-400 mt-0.5 shrink-0" />
                                                        <p className="text-xs text-zinc-300">{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Toxic Comments */}
                                    {comprehendData.toxicComments?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/10">
                                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-red-400">
                                                <Shield size={14} /> Toxic Comments ({comprehendData.toxicComments.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {comprehendData.toxicComments.map((tc, i) => (
                                                    <div key={i} className="p-2 bg-red-500/[0.05] rounded-lg text-[11px] text-zinc-300">
                                                        "{tc.text}" — <span className="text-red-400">{tc.reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
