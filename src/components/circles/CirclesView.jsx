import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Crown, Plus, Users, DollarSign, Lock, MessageSquare, Video,
    Star, Edit3, X, Settings, BarChart3, Send, Heart, Zap
} from 'lucide-react';

const TIER_COLORS = ['from-zinc-500 to-zinc-600', 'from-amber-500 to-orange-500', 'from-purple-500 to-pink-500'];

export function CirclesView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState('tiers');
    const [tiers, setTiers] = useState([]);
    const [showCreateTier, setShowCreateTier] = useState(false);
    const [newTier, setNewTier] = useState({ name: '', price: '', perks: [''] });
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ content: '', tier: 'all' });

    const createTier = () => {
        if (!newTier.name.trim()) return;
        const tier = {
            id: Date.now(),
            ...newTier,
            perks: newTier.perks.filter(p => p.trim()),
            members: 0,
            revenue: 0,
        };
        setTiers(prev => [...prev, tier]);
        setNewTier({ name: '', price: '', perks: [''] });
        setShowCreateTier(false);
        showSuccess('Tier created!');
    };

    const addPerk = () => setNewTier(prev => ({ ...prev, perks: [...prev.perks, ''] }));

    const createPost = () => {
        if (!newPost.content.trim()) return;
        const post = {
            id: Date.now(),
            content: newPost.content,
            tier: newPost.tier,
            likes: 0,
            comments: 0,
            createdAt: new Date().toISOString(),
        };
        setPosts(prev => [post, ...prev]);
        setNewPost({ content: '', tier: 'all' });
        showSuccess('Post published!');
    };

    const totalMembers = tiers.reduce((s, t) => s + t.members, 0);
    const totalMRR = tiers.reduce((s, t) => s + (t.members * parseInt(t.price || '0')), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Crown className="text-amber-400" size={22} /> Creator Circles
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Paid memberships & exclusive content</p>
                </div>
                <div className="flex gap-2">
                    {['tiers', 'content', 'community', 'members'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                        >{tab}</button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Users size={16} className="text-blue-400" />
                    <div className="text-lg font-black mt-1">{totalMembers}</div>
                    <div className="text-[9px] text-zinc-500">Members</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <DollarSign size={16} className="text-green-400" />
                    <div className="text-lg font-black mt-1">₹{totalMRR.toLocaleString()}</div>
                    <div className="text-[9px] text-zinc-500">Monthly Revenue</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Crown size={16} className="text-amber-400" />
                    <div className="text-lg font-black mt-1">{tiers.length}</div>
                    <div className="text-[9px] text-zinc-500">Active Tiers</div>
                </div>
            </div>

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
                <div className="space-y-4">
                    <button onClick={() => setShowCreateTier(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                    >
                        <Plus size={14} /> Create Tier
                    </button>

                    {showCreateTier && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateTier(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Create Membership Tier</h3>
                                    <button onClick={() => setShowCreateTier(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newTier.name} onChange={e => setNewTier(p => ({ ...p, name: e.target.value }))} placeholder="Tier name (e.g., Silver, Gold, Platinum)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <input value={newTier.price} onChange={e => setNewTier(p => ({ ...p, price: e.target.value }))} placeholder="Monthly price (e.g., ₹99)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Perks</label>
                                        {newTier.perks.map((perk, i) => (
                                            <input key={i} value={perk}
                                                onChange={e => { const perks = [...newTier.perks]; perks[i] = e.target.value; setNewTier(p => ({ ...p, perks })); }}
                                                placeholder={`Perk ${i + 1}`}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none mb-1"
                                            />
                                        ))}
                                        <button onClick={addPerk} className="text-[10px] text-amber-400 hover:text-amber-300">+ Add Perk</button>
                                    </div>
                                    <button onClick={createTier} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Create Tier</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tiers.map((tier, i) => (
                            <div key={tier.id} className={`p-5 rounded-2xl border border-white/[0.08] bg-gradient-to-br ${TIER_COLORS[i % TIER_COLORS.length]} bg-opacity-10 relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/60" />
                                <div className="relative z-10">
                                    <Crown size={20} className="text-amber-400 mb-2" />
                                    <h4 className="text-lg font-black">{tier.name}</h4>
                                    <div className="text-2xl font-black text-white mt-1">
                                        {tier.price || 'Free'}<span className="text-xs text-zinc-400 font-normal">/mo</span>
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        {tier.perks.map((perk, pi) => (
                                            <div key={pi} className="flex items-center gap-2 text-xs text-zinc-300">
                                                <Star size={10} className="text-amber-400 shrink-0" /> {perk}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                                        <span>{tier.members} members</span>
                                        <span>₹{(tier.members * parseInt(tier.price || '0')).toLocaleString()}/mo</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tiers.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-zinc-500">
                                <Crown size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Create membership tiers for your fans!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                        <textarea
                            value={newPost.content}
                            onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                            placeholder="Write an exclusive post for your members..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <select value={newPost.tier} onChange={e => setNewPost(p => ({ ...p, tier: e.target.value }))}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                            >
                                <option value="all">All Members</option>
                                {tiers.map(t => <option key={t.id} value={t.id}>{t.name} only</option>)}
                            </select>
                            <button onClick={createPost} className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all">
                                <Send size={12} /> Post
                            </button>
                        </div>
                    </div>
                    {posts.map(post => (
                        <div key={post.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            {post.tier !== 'all' && (
                                <div className="flex items-center gap-1 mb-2">
                                    <Lock size={10} className="text-amber-400" />
                                    <span className="text-[9px] text-amber-400 font-bold">Exclusive</span>
                                </div>
                            )}
                            <p className="text-sm text-zinc-300">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
                                <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                                    <Heart size={12} /> {post.likes}
                                </button>
                                <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                    <MessageSquare size={12} /> {post.comments}
                                </button>
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Community & Members Tabs */}
            {activeTab === 'community' && (
                <div className="text-center py-16 text-zinc-500">
                    <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Discussion forums will appear when you have members</p>
                </div>
            )}
            {activeTab === 'members' && (
                <div className="text-center py-16 text-zinc-500">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Member management will populate as people join</p>
                </div>
            )}
        </div>
    );
}
