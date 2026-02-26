import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Users, Plus, Search, TrendingUp, Eye, BarChart3, AlertTriangle,
    RefreshCw, Sparkles, Target, X, ExternalLink, Video, ArrowUpRight,
    Bell, Trash2, ChevronRight
} from 'lucide-react';

export function CompetitorView() {
    const { user } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const [competitors, setCompetitors] = useState([]);
    const [channelUrl, setChannelUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [selectedComp, setSelectedComp] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const niche = user?.niche || 'general';

    const addCompetitor = useCallback(async () => {
        if (!channelUrl.trim()) return;
        if (competitors.length >= 10) {
            showError('Maximum 10 competitors allowed');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/competitors/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ channelUrl: channelUrl.trim(), niche }),
            });
            const data = await res.json();
            if (data.competitor) {
                setCompetitors(prev => [...prev, data.competitor]);
                setChannelUrl('');
                setShowAdd(false);
                showSuccess('Competitor added!');
            }
        } catch (err) {
            showError('Failed to add competitor');
        }
        setLoading(false);
    }, [channelUrl, competitors.length, niche, showError, showSuccess]);

    const analyzeCompetitors = useCallback(async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/competitors/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ competitors: competitors.map(c => c.name), niche }),
            });
            const data = await res.json();
            if (data) setAnalysis(data);
        } catch (err) {
            showError('Failed to analyze competitors');
        }
        setAnalyzing(false);
    }, [competitors, niche, showError]);

    const removeCompetitor = (index) => {
        setCompetitors(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-violet-400" size={22} /> Competitor Analysis
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Track up to 10 competitors · <span className="text-violet-400">{competitors.length}/10 tracked</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all"
                    >
                        <Plus size={14} /> Add Competitor
                    </button>
                    {competitors.length > 0 && (
                        <button
                            onClick={analyzeCompetitors}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {analyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {analyzing ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    )}
                </div>
            </div>

            {/* Add Competitor Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
                    <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">Add Competitor</h3>
                            <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <p className="text-xs text-zinc-500 mb-4">Enter a YouTube channel name or URL to track</p>
                        <input
                            value={channelUrl}
                            onChange={e => setChannelUrl(e.target.value)}
                            placeholder="e.g. MrBeast or youtube.com/@MrBeast"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 mb-4"
                        />
                        <button
                            onClick={addCompetitor}
                            disabled={loading || !channelUrl.trim()}
                            className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Track Competitor'}
                        </button>
                    </div>
                </div>
            )}

            {competitors.length === 0 && !analysis ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={28} className="text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Track Your Competitors</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Add up to 10 competitor channels to analyze their strategy, find gaps, and discover opportunities.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Competitor List */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1">Tracked Channels</h3>
                        {competitors.map((comp, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedComp(comp)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedComp?.name === comp.name
                                        ? 'bg-violet-500/10 border-violet-500/30'
                                        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500/30 to-purple-500/30 rounded-lg flex items-center justify-center text-xs font-bold">
                                            {comp.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{comp.name}</p>
                                            <p className="text-[10px] text-zinc-500">{comp.subscribers || 'N/A'} subs</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeCompetitor(i); }} className="text-zinc-600 hover:text-red-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analysis Results */}
                    <div className="lg:col-span-2 space-y-4">
                        {analysis ? (
                            <>
                                {/* What's Working */}
                                {analysis.whatsWorking && (
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <TrendingUp size={14} className="text-green-400" /> What's Working
                                        </h4>
                                        <div className="space-y-3">
                                            {(analysis.whatsWorking || []).map((item, i) => (
                                                <div key={i} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                                                    <p className="text-xs font-semibold text-green-300 mb-1">{item.title}</p>
                                                    <p className="text-xs text-zinc-400">{item.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Gap Analysis */}
                                {analysis.gaps && (
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <Target size={14} className="text-amber-400" /> Gap Analysis — Opportunities!
                                        </h4>
                                        <div className="space-y-3">
                                            {(analysis.gaps || []).map((gap, i) => (
                                                <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                                    <p className="text-xs font-semibold text-amber-300 mb-1">🎯 {gap.opportunity}</p>
                                                    <p className="text-xs text-zinc-400">{gap.reasoning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Alerts */}
                                {analysis.alerts && analysis.alerts.length > 0 && (
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                            <Bell size={14} className="text-red-400" /> Competitor Alerts
                                        </h4>
                                        <div className="space-y-2">
                                            {analysis.alerts.map((alert, i) => (
                                                <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2">
                                                    <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                                    <p className="text-xs text-zinc-300">{alert}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16 text-zinc-500">
                                <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Add competitors and run analysis to see insights</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
