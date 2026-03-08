import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Type, Sparkles, RefreshCw, Copy, Search, Tag, FileText, BarChart3,
    CheckCircle2, Star, Lightbulb, ArrowRightLeft, Trophy
} from 'lucide-react';

export function TitleCraftView() {
    const { user } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const [topic, setTopic] = useState('');
    const [titles, setTitles] = useState([]);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('titles');
    const [abTests, setAbTests] = useState([]);
    const niche = user?.niche || 'general';

    const generateTitles = useCallback(async () => {
        if (!topic.trim()) { showError('Enter a topic'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/titles/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('velocity_token')}` },
                body: JSON.stringify({ topic, niche }),
            });
            const data = await res.json();
            if (data.titles) setTitles(data.titles);
            if (data.description) setDescription(data.description);
            if (data.tags) setTags(data.tags);
            if (data.abTests) setAbTests(data.abTests);
        } catch (err) { showError('Failed to generate'); }
        setLoading(false);
    }, [topic, niche, showError]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showSuccess('Copied!');
    };

    const tabs = [
        { id: 'titles', label: 'Titles', icon: Type, count: titles.length },
        { id: 'description', label: 'Description', icon: FileText },
        { id: 'tags', label: 'Tags', icon: Tag, count: tags.length },
        { id: 'abtest', label: 'A/B Tests', icon: ArrowRightLeft, count: abTests.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Type className="text-emerald-400" size={22} /> TitleCraft AI
                </h2>
                <p className="text-xs text-zinc-500 mt-1">SEO-optimized titles, descriptions & tags</p>
            </div>

            {/* Input */}
            <div className="flex gap-3">
                <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateTitles()}
                    placeholder="Enter your video topic or idea..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                    onClick={generateTitles}
                    disabled={loading || !topic.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? 'Crafting...' : 'Generate'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/[0.04] pb-3">
                {tabs.map(({ id, label, icon: Icon, count }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Icon size={14} /> {label} {count > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{count}</span>}
                    </button>
                ))}
            </div>

            {/* Content */}
            {titles.length === 0 && !loading ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Type size={28} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Craft Perfect Titles</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Enter your video topic to get SEO-optimized titles, descriptions, and tags.
                    </p>
                </div>
            ) : (
                <>
                    {/* Titles Tab */}
                    {activeTab === 'titles' && (
                        <div className="space-y-2">
                            {titles.map((item, i) => (
                                <div key={i} className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {i === 0 && <Trophy size={12} className="text-amber-400" />}
                                                <span className="text-[9px] font-bold text-zinc-600">#{i + 1}</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${item.seoScore >= 8 ? 'bg-green-500/20 text-green-300' :
                                                        item.seoScore >= 5 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                                                    }`}>
                                                    SEO: {item.seoScore}/10
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold">{item.title}</p>
                                            {item.reasoning && (
                                                <p className="text-[10px] text-zinc-500 mt-1 flex items-start gap-1">
                                                    <Lightbulb size={10} className="mt-0.5 shrink-0 text-amber-400" />
                                                    {item.reasoning}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(item.title)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-lg"
                                        >
                                            <Copy size={14} className="text-zinc-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description Tab */}
                    {activeTab === 'description' && description && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold">SEO Description Template</h3>
                                <button onClick={() => copyToClipboard(description)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                                    <Copy size={12} /> Copy
                                </button>
                            </div>
                            <pre className="text-xs text-zinc-300 whitespace-pre-wrap bg-white/[0.03] rounded-xl p-4 leading-relaxed font-sans">
                                {description}
                            </pre>
                        </div>
                    )}

                    {/* Tags Tab */}
                    {activeTab === 'tags' && tags.length > 0 && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold">Recommended Tags</h3>
                                <button onClick={() => copyToClipboard(tags.join(', '))} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
                                    <Copy size={12} /> Copy All
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        onClick={() => copyToClipboard(tag)}
                                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 cursor-pointer hover:bg-emerald-500/20 transition-all"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* A/B Test Tab */}
                    {activeTab === 'abtest' && abTests.length > 0 && (
                        <div className="space-y-3">
                            {abTests.map((test, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                    <h4 className="text-xs font-bold mb-3 text-zinc-400 uppercase tracking-wider">Test {i + 1}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                            <span className="text-[9px] font-bold text-blue-400">Variant A</span>
                                            <p className="text-sm font-semibold mt-1">{test.variantA}</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                                            <span className="text-[9px] font-bold text-purple-400">Variant B</span>
                                            <p className="text-sm font-semibold mt-1">{test.variantB}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-2">
                                        <Lightbulb size={10} className="inline mr-1 text-amber-400" />
                                        {test.hypothesis}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
