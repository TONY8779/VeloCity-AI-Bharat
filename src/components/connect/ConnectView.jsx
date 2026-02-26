import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Handshake, Plus, Search, Building2, DollarSign, Users, FileText,
    ArrowRight, CheckCircle2, Clock, Star, Filter, X, ChevronRight,
    Sparkles, Send, BarChart3
} from 'lucide-react';

const DEAL_STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Active', 'Completed'];
const STAGE_COLORS = {
    Discovery: 'bg-blue-500/20 text-blue-300',
    Proposal: 'bg-purple-500/20 text-purple-300',
    Negotiation: 'bg-amber-500/20 text-amber-300',
    Contract: 'bg-cyan-500/20 text-cyan-300',
    Active: 'bg-green-500/20 text-green-300',
    Completed: 'bg-emerald-500/20 text-emerald-300',
};

export function ConnectView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState('marketplace');
    const [deals, setDeals] = useState([]);
    const [brands, setBrands] = useState([
        { id: 1, name: 'BoAt Lifestyle', category: 'Electronics', budget: '₹50K-2L', match: 92, logo: '🎧' },
        { id: 2, name: 'Mamaearth', category: 'Beauty', budget: '₹30K-1L', match: 87, logo: '🌿' },
        { id: 3, name: 'Cred', category: 'Fintech', budget: '₹1L-5L', match: 85, logo: '💳' },
        { id: 4, name: 'Nykaa', category: 'Beauty', budget: '₹25K-80K', match: 78, logo: '💄' },
        { id: 5, name: 'Zomato', category: 'Food', budget: '₹40K-1.5L', match: 75, logo: '🍕' },
        { id: 6, name: 'Noise', category: 'Wearables', budget: '₹30K-1L', match: 72, logo: '⌚' },
    ]);
    const [showNewDeal, setShowNewDeal] = useState(false);
    const [newDeal, setNewDeal] = useState({ brand: '', value: '', notes: '' });

    const createDeal = () => {
        if (!newDeal.brand.trim()) return;
        const deal = {
            id: Date.now(),
            brand: newDeal.brand,
            value: newDeal.value || 'TBD',
            notes: newDeal.notes,
            stage: 'Discovery',
            createdAt: new Date().toISOString(),
        };
        setDeals(prev => [...prev, deal]);
        setNewDeal({ brand: '', value: '', notes: '' });
        setShowNewDeal(false);
        showSuccess('Deal created!');
    };

    const updateDealStage = (dealId, newStage) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Handshake className="text-rose-400" size={22} /> VeloCity Connect
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Brand-creator matching & deal management</p>
                </div>
                <div className="flex gap-2">
                    {['marketplace', 'deals', 'contracts'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                placeholder="Search brands..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brands.map(brand => (
                            <div key={brand.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
                                            {brand.logo}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">{brand.name}</h4>
                                            <p className="text-[10px] text-zinc-500">{brand.category}</p>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2.5 py-1 rounded-full font-bold ${brand.match >= 85 ? 'bg-green-500/20 text-green-300' :
                                            brand.match >= 70 ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-zinc-500/20 text-zinc-300'
                                        }`}>
                                        {brand.match}% Match
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                                        <DollarSign size={12} /> Budget: {brand.budget}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewDeal(prev => ({ ...prev, brand: brand.name }));
                                            setShowNewDeal(true);
                                            setActiveTab('deals');
                                        }}
                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 text-rose-300 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                        Start Deal <ArrowRight size={10} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Deals Tab */}
            {activeTab === 'deals' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setShowNewDeal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10"
                    >
                        <Plus size={14} /> New Deal
                    </button>

                    {/* New Deal Modal */}
                    {showNewDeal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowNewDeal(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">New Deal</h3>
                                    <button onClick={() => setShowNewDeal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        value={newDeal.brand}
                                        onChange={e => setNewDeal(p => ({ ...p, brand: e.target.value }))}
                                        placeholder="Brand name"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                                    />
                                    <input
                                        value={newDeal.value}
                                        onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))}
                                        placeholder="Deal value (e.g., ₹50,000)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                                    />
                                    <textarea
                                        value={newDeal.notes}
                                        onChange={e => setNewDeal(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="Notes..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none"
                                    />
                                    <button onClick={createDeal} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">
                                        Create Deal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deal Pipeline (Kanban) */}
                    {deals.length > 0 ? (
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-4 min-w-max">
                                {DEAL_STAGES.map(stage => (
                                    <div key={stage} className="w-64">
                                        <h4 className={`text-xs font-bold px-3 py-1.5 rounded-lg mb-2 ${STAGE_COLORS[stage]}`}>
                                            {stage} ({deals.filter(d => d.stage === stage).length})
                                        </h4>
                                        <div className="space-y-2">
                                            {deals.filter(d => d.stage === stage).map(deal => (
                                                <div key={deal.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <h5 className="text-xs font-bold mb-1">{deal.brand}</h5>
                                                    <p className="text-[10px] text-zinc-500 mb-2">{deal.value}</p>
                                                    <select
                                                        value={deal.stage}
                                                        onChange={e => updateDealStage(deal.id, e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white"
                                                    >
                                                        {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <Handshake size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No active deals. Browse the marketplace to start!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
                <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <FileText size={14} className="text-cyan-400" /> Contract Templates
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { title: 'Sponsored Video', desc: 'Standard YouTube sponsorship agreement', icon: '📹' },
                                { title: 'Instagram Collab', desc: 'Reel/Story collaboration contract', icon: '📸' },
                                { title: 'Brand Ambassador', desc: 'Long-term brand deal agreement', icon: '🤝' },
                                { title: 'Affiliate Partnership', desc: 'Commission-based promotion contract', icon: '💰' },
                            ].map((tpl, i) => (
                                <div key={i} className="p-4 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-lg">{tpl.icon}</span>
                                        <h4 className="text-xs font-bold">{tpl.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">{tpl.desc}</p>
                                    <span className="text-[9px] text-rose-400 mt-2 block opacity-0 group-hover:opacity-100 transition-opacity">
                                        Use Template →
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
