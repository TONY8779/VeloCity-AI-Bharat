import React, { useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
    Flame, TrendingUp, TrendingDown, Minus, Clock, Zap, Twitter, Youtube,
    MessageSquare, Eye, ArrowRight, RefreshCw, Sparkles, BarChart3, Target,
    ExternalLink, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const PLATFORMS = [
    { id: 'all', label: 'All Platforms', icon: Flame },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'reddit', label: 'Reddit', icon: MessageSquare },
];

const VELOCITY_COLORS = {
    hot: { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300' },
    rising: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
    stable: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    declining: { bg: 'from-zinc-500/20 to-zinc-700/20', border: 'border-zinc-500/30', text: 'text-zinc-400', badge: 'bg-zinc-500/20 text-zinc-300' },
};

export function TrendHunterView() {
    const { user } = useAuth();
    const { error: showError } = useNotification();
    const navigate = useNavigate();
    const [activePlatform, setActivePlatform] = useState('all');
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTrend, setSelectedTrend] = useState(null);
    const niche = user?.niche || 'general';

    const fetchTrends = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/trends/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ niche, platform: activePlatform }),
            });
            const data = await res.json();
            if (data.trends) {
                setTrends(data.trends);
                if (data.trends.length > 0) setSelectedTrend(data.trends[0]);
            }
        } catch (err) {
            showError('Failed to fetch trends');
        }
        setLoading(false);
    }, [niche, activePlatform, showError]);

    const getVelocityStyle = (score) => {
        if (score >= 80) return VELOCITY_COLORS.hot;
        if (score >= 60) return VELOCITY_COLORS.rising;
        if (score >= 40) return VELOCITY_COLORS.stable;
        return VELOCITY_COLORS.declining;
    };

    const getTrajectoryIcon = (trajectory) => {
        if (trajectory === 'rising') return <TrendingUp size={14} className="text-green-400" />;
        if (trajectory === 'declining') return <TrendingDown size={14} className="text-red-400" />;
        return <Minus size={14} className="text-zinc-400" />;
    };

    const handleCreateContent = (trend) => {
        navigate('/notebook', { state: { prefill: `Topic: ${trend.topic}\n\nHook Ideas:\n${trend.hookIdeas?.join('\n') || trend.whyViral || ''}` } });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Flame className="text-orange-400" size={22} /> Trend Hunter Pro
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Real-time trend intelligence for <span className="text-blue-400">{niche}</span></p>
                </div>
                <button
                    onClick={fetchTrends}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? 'Scanning...' : 'Scan Trends'}
                </button>
            </div>

            {/* Platform Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {PLATFORMS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActivePlatform(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activePlatform === id
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                    >
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {trends.length === 0 && !loading ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Flame size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Discover What's Trending</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                        Click "Scan Trends" to analyze real-time trends across Twitter, YouTube, and Reddit for your niche.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trend List */}
                    <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                        {trends.map((trend, i) => {
                            const style = getVelocityStyle(trend.velocityScore || 50);
                            const isSelected = selectedTrend?.topic === trend.topic;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTrend(trend)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                            ? `bg-gradient-to-r ${style.bg} ${style.border} shadow-lg`
                                            : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h4 className="text-sm font-bold leading-tight">{trend.topic}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${style.badge}`}>
                                            {trend.velocityScore || 50}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            {getTrajectoryIcon(trend.trajectory)}
                                            {trend.trajectory || 'stable'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {trend.peakPrediction || 'N/A'}
                                        </span>
                                        <span className="capitalize">{trend.platform || 'multi'}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Trend Detail */}
                    {selectedTrend && (
                        <div className="lg:col-span-2 space-y-4">
                            {/* Overview Card */}
                            <div className={`p-6 rounded-2xl border bg-gradient-to-br ${getVelocityStyle(selectedTrend.velocityScore || 50).bg} ${getVelocityStyle(selectedTrend.velocityScore || 50).border}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold">{selectedTrend.topic}</h3>
                                        <p className="text-xs text-zinc-400 mt-1">{selectedTrend.platform || 'Multi-platform'} trend</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black">{selectedTrend.velocityScore || 50}</div>
                                        <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Velocity</div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                        <BarChart3 size={16} className="mx-auto mb-1 text-zinc-400" />
                                        <div className="text-sm font-bold">{selectedTrend.trajectory || 'stable'}</div>
                                        <div className="text-[9px] text-zinc-500">Trajectory</div>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                        <Clock size={16} className="mx-auto mb-1 text-zinc-400" />
                                        <div className="text-sm font-bold">{selectedTrend.peakPrediction || '24-48h'}</div>
                                        <div className="text-[9px] text-zinc-500">Peak In</div>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 text-center">
                                        <Target size={16} className="mx-auto mb-1 text-zinc-400" />
                                        <div className="text-sm font-bold">{selectedTrend.lifespanDays || '3-5'}d</div>
                                        <div className="text-[9px] text-zinc-500">Lifespan</div>
                                    </div>
                                </div>

                                {/* Peak Alert */}
                                {selectedTrend.peakPrediction && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
                                        <Zap size={14} className="text-amber-400 shrink-0" />
                                        <p className="text-xs text-amber-200">
                                            <strong>Peak Alert:</strong> This trend will peak in {selectedTrend.peakPrediction}. Create content now for maximum reach!
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Why Viral */}
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Sparkles size={14} className="text-purple-400" /> Why It's Viral
                                </h4>
                                <p className="text-sm text-zinc-300 leading-relaxed">{selectedTrend.whyViral || 'AI analysis loading...'}</p>
                            </div>

                            {/* Hook Ideas */}
                            {selectedTrend.hookIdeas && selectedTrend.hookIdeas.length > 0 && (
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <Zap size={14} className="text-yellow-400" /> Content Hook Ideas
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedTrend.hookIdeas.map((hook, i) => (
                                            <div key={i} className="flex items-start gap-2 p-3 bg-white/[0.03] rounded-xl">
                                                <span className="text-[10px] font-bold text-zinc-500 mt-0.5">{i + 1}</span>
                                                <p className="text-xs text-zinc-300">{hook}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={() => handleCreateContent(selectedTrend)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all active:scale-[0.98]"
                            >
                                <BookOpen size={16} />
                                Create Content From This Trend
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
