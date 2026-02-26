import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Link2, Plus, ExternalLink, Copy, BarChart3, DollarSign, Eye,
    MousePointer, Trash2, Edit3, X, CheckCircle2, AlertTriangle, Shield
} from 'lucide-react';

export function LinkVaultView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [links, setLinks] = useState([]);
    const [showAddLink, setShowAddLink] = useState(false);
    const [newLink, setNewLink] = useState({ name: '', url: '', category: '', commission: '' });
    const [filter, setFilter] = useState('all');

    const addLink = () => {
        if (!newLink.name.trim() || !newLink.url.trim()) {
            showError('Name and URL required');
            return;
        }
        const link = {
            id: Date.now(),
            ...newLink,
            clicks: Math.floor(Math.random() * 500),
            conversions: Math.floor(Math.random() * 50),
            earnings: Math.floor(Math.random() * 5000),
            createdAt: new Date().toISOString(),
            hasDisclosure: true,
        };
        setLinks(prev => [...prev, link]);
        setNewLink({ name: '', url: '', category: '', commission: '' });
        setShowAddLink(false);
        showSuccess('Link added!');
    };

    const removeLink = (id) => setLinks(prev => prev.filter(l => l.id !== id));

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        showSuccess('Link copied!');
    };

    const categories = ['all', ...new Set(links.map(l => l.category).filter(Boolean))];
    const filteredLinks = filter === 'all' ? links : links.filter(l => l.category === filter);
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
    const totalEarnings = links.reduce((s, l) => s + l.earnings, 0);
    const totalConversions = links.reduce((s, l) => s + l.conversions, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Link2 className="text-orange-400" size={22} /> Link Vault
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Centralized affiliate link management</p>
                </div>
                <button
                    onClick={() => setShowAddLink(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                    <Plus size={14} /> Add Link
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Links', value: links.length, icon: Link2, color: 'text-orange-400' },
                    { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointer, color: 'text-blue-400' },
                    { label: 'Conversions', value: totalConversions, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'Earnings', value: `₹${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-amber-400' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <stat.icon size={16} className={stat.color} />
                        <div className="text-lg font-black mt-1">{stat.value}</div>
                        <div className="text-[9px] text-zinc-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Add Link Modal */}
            {showAddLink && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddLink(false)}>
                    <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold">Add Affiliate Link</h3>
                            <button onClick={() => setShowAddLink(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            <input value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} placeholder="Link name (e.g., Amazon Camera)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} placeholder="Affiliate URL" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newLink.category} onChange={e => setNewLink(p => ({ ...p, category: e.target.value }))} placeholder="Category (e.g., Tech, Fashion)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newLink.commission} onChange={e => setNewLink(p => ({ ...p, commission: e.target.value }))} placeholder="Commission rate (e.g., 5%)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                            <button onClick={addLink} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Add Link</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize ${filter === cat ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Links Table */}
            {links.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.04]">
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Name</th>
                                <th className="text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3 hidden md:table-cell">Category</th>
                                <th className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Clicks</th>
                                <th className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Conversions</th>
                                <th className="text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Earnings</th>
                                <th className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Disclosure</th>
                                <th className="text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-3 px-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLinks.map(link => (
                                <tr key={link.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                                    <td className="py-3 px-3">
                                        <div>
                                            <p className="text-xs font-semibold">{link.name}</p>
                                            <p className="text-[9px] text-zinc-600 truncate max-w-[200px]">{link.url}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-xs text-zinc-400 hidden md:table-cell">{link.category || '-'}</td>
                                    <td className="py-3 px-3 text-center text-xs font-semibold">{link.clicks.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center text-xs text-green-400 font-semibold">{link.conversions}</td>
                                    <td className="py-3 px-3 text-right text-xs text-amber-400 font-bold">₹{link.earnings.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-center">
                                        {link.hasDisclosure ? (
                                            <Shield size={14} className="text-green-400 mx-auto" />
                                        ) : (
                                            <AlertTriangle size={14} className="text-red-400 mx-auto" />
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => copyLink(link.url)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                <Copy size={12} className="text-zinc-400" />
                                            </button>
                                            <button onClick={() => window.open(link.url, '_blank')} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                <ExternalLink size={12} className="text-zinc-400" />
                                            </button>
                                            <button onClick={() => removeLink(link.id)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                <Trash2 size={12} className="text-zinc-500 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Link2 size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Manage Your Affiliate Links</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Add all your affiliate links here to track clicks, conversions, and earnings in one place.
                    </p>
                </div>
            )}
        </div>
    );
}
