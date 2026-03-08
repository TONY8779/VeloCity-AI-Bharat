import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
    Sun, Sparkles, RefreshCw, Zap, Clock, Music, Target, ArrowRight,
    TrendingUp, Star, BookOpen, Volume2, Calendar, CheckCircle2
} from 'lucide-react';

export function BriefingView() {
    const { user } = useAuth();
    const { error: showError } = useNotification();
    const navigate = useNavigate();
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(false);
    const niche = user?.niche || 'general';

    const fetchBriefing = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/briefing/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('velocity_token')}` },
                body: JSON.stringify({ niche }),
            });
            const data = await res.json();
            if (data) setBriefing(data);
        } catch (err) {
            showError('Failed to generate briefing');
        }
        setLoading(false);
    }, [niche, showError]);

    useEffect(() => {
        if (!briefing) fetchBriefing();
    }, []);

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <Sun className="text-amber-400" size={26} /> {greeting}, {user?.name?.split(' ')[0] || 'Creator'}!
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">{dateStr} · Your daily content intelligence</p>
                </div>
                <button
                    onClick={fetchBriefing}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                </button>
            </div>

            {loading && !briefing ? (
                <div className="text-center py-20">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Sparkles size={24} className="text-amber-400" />
                    </div>
                    <p className="text-sm text-zinc-500">Preparing your daily briefing...</p>
                </div>
            ) : briefing ? (
                <div className="space-y-5">
                    {/* Top 3 Opportunities */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <Star size={16} className="text-amber-400" /> Today's 3 Best Opportunities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(briefing.opportunities || []).slice(0, 3).map((opp, i) => (
                                <div key={i} className="bg-black/20 rounded-xl p-4 hover:bg-black/30 transition-all cursor-pointer group"
                                    onClick={() => navigate('/notebook', { state: { prefill: `Topic: ${opp.topic}\n\n${opp.description}` } })}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center text-[10px] font-black text-amber-300">
                                            {i + 1}
                                        </span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${opp.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                                                opp.urgency === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                                                    'bg-green-500/20 text-green-300'
                                            }`}>
                                            {opp.urgency || 'medium'}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold mb-1">{opp.topic}</h4>
                                    <p className="text-xs text-zinc-400 line-clamp-2">{opp.description}</p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Create Content <ArrowRight size={10} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pre-Written Hooks */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-400" /> Pre-Written Hooks for Today
                        </h3>
                        <div className="space-y-2">
                            {(briefing.hooks || []).map((hook, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl group hover:bg-white/[0.05] transition-all">
                                    <span className="text-[10px] font-bold text-zinc-600 mt-0.5 shrink-0">#{i + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">"{hook.text}"</p>
                                        <p className="text-[10px] text-zinc-500 mt-1">Best for: {hook.platform || 'All platforms'}</p>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(hook.text)}
                                        className="text-[10px] text-zinc-600 hover:text-white px-2 py-1 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Trending Sounds */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Music size={16} className="text-pink-400" /> Trending Audio Today
                            </h3>
                            <div className="space-y-2">
                                {(briefing.trendingAudio || []).map((audio, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                                        <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                                            <Volume2 size={14} className="text-pink-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{audio.name}</p>
                                            <p className="text-[10px] text-zinc-500">{audio.genre} · {audio.uses || 'Trending'}</p>
                                        </div>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${audio.trending === 'hot' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                                            }`}>
                                            {audio.trending || 'rising'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Best Posting Window */}
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Clock size={16} className="text-blue-400" /> Best Posting Times Today
                            </h3>
                            <div className="space-y-2">
                                {(briefing.postingWindows || []).map((window, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                                            }`}>
                                            {i === 0 ? '🔥' : '✅'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold">{window.time}</p>
                                            <p className="text-[10px] text-zinc-500">{window.platform} · {window.reason}</p>
                                        </div>
                                        {i === 0 && (
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-bold">
                                                Best
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Daily Content Recommendations */}
                    {briefing.contentRecs && briefing.contentRecs.length > 0 && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Target size={16} className="text-green-400" /> Content Recommendations
                            </h3>
                            <div className="space-y-2">
                                {briefing.contentRecs.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl">
                                        <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold">{rec.title}</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5">{rec.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
