import React, { useState } from 'react';
import {
    Building2, Plus, Edit3, Trash2, Search, X, Globe, Mail, Phone,
    MapPin, Users, Star, TrendingUp, DollarSign, ExternalLink, Eye
} from 'lucide-react';

const INDUSTRIES = ['Technology', 'Fashion', 'Food & Beverage', 'Health & Fitness', 'Finance', 'Education', 'Entertainment', 'Travel', 'Gaming', 'Automotive', 'Beauty', 'Other'];
const SIZES = ['Startup', 'Small', 'Medium', 'Enterprise'];
const STATUS_COLORS = {
    active: 'bg-green-500/20 text-green-300',
    prospect: 'bg-blue-500/20 text-blue-300',
    inactive: 'bg-zinc-500/20 text-zinc-400',
    churned: 'bg-red-500/20 text-red-300',
};

export function AdminCompanies() {
    const [companies, setCompanies] = useState([
        { id: '1', name: 'TechVibe Studios', industry: 'Technology', size: 'Medium', status: 'active', website: 'techvibe.com', contact: 'hello@techvibe.com', revenue: 45000, deals: 3, notes: 'Great partner, looking for long-term collaboration', createdAt: '2025-12-01' },
        { id: '2', name: 'FitNest India', industry: 'Health & Fitness', size: 'Small', status: 'active', website: 'fitnest.in', contact: 'brand@fitnest.in', revenue: 28000, deals: 1, notes: 'Fitness equipment brand', createdAt: '2025-11-15' },
        { id: '3', name: 'GlowUp Cosmetics', industry: 'Beauty', size: 'Startup', status: 'prospect', website: 'glowup.co', contact: 'collab@glowup.co', revenue: 0, deals: 0, notes: 'Upcoming beauty brand, interested in creator partnerships', createdAt: '2026-01-10' },
        { id: '4', name: 'ByteLearn EdTech', industry: 'Education', size: 'Medium', status: 'active', website: 'bytelearn.in', contact: 'partners@bytelearn.in', revenue: 62000, deals: 5, notes: 'EdTech platform for coding courses', createdAt: '2025-10-20' },
    ]);
    const [search, setSearch] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [viewCompany, setViewCompany] = useState(null);
    const [form, setForm] = useState({ name: '', industry: 'Technology', size: 'Small', status: 'prospect', website: '', contact: '', notes: '' });

    const filtered = companies.filter(c => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.contact.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterIndustry && c.industry !== filterIndustry) return false;
        if (filterStatus && c.status !== filterStatus) return false;
        return true;
    });

    const totalRevenue = companies.reduce((s, c) => s + c.revenue, 0);
    const totalDeals = companies.reduce((s, c) => s + c.deals, 0);

    const handleCreate = () => {
        setCompanies(prev => [...prev, { ...form, id: Date.now().toString(), revenue: 0, deals: 0, createdAt: new Date().toISOString().slice(0, 10) }]);
        setForm({ name: '', industry: 'Technology', size: 'Small', status: 'prospect', website: '', contact: '', notes: '' });
        setShowCreate(false);
    };

    const handleEdit = () => {
        setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...editingCompany } : c));
        setEditingCompany(null);
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this company?')) return;
        setCompanies(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black">Company Management</h1>
                    <p className="text-xs text-zinc-500">{companies.length} companies · ₹{totalRevenue.toLocaleString()} total revenue · {totalDeals} deals</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all">
                    <Plus size={14} /> Add Company
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Total Companies', value: companies.length, icon: Building2, color: 'bg-indigo-500/20 text-indigo-400' },
                    { label: 'Active Partners', value: companies.filter(c => c.status === 'active').length, icon: Star, color: 'bg-green-500/20 text-green-400' },
                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-amber-500/20 text-amber-400' },
                    { label: 'Active Deals', value: totalDeals, icon: TrendingUp, color: 'bg-purple-500/20 text-purple-400' },
                ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
                            <s.icon size={14} />
                        </div>
                        <div className="text-lg font-black">{s.value}</div>
                        <div className="text-[10px] text-zinc-500">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/30" />
                </div>
                <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                    <option value="">All Industries</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                    <option value="">All Status</option>
                    <option value="active">Active</option><option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option><option value="churned">Churned</option>
                </select>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(c => (
                    <div key={c.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-sm font-black text-indigo-300">
                                    {c.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{c.name}</h3>
                                    <p className="text-[10px] text-zinc-500">{c.industry} · {c.size}</p>
                                </div>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 bg-white/[0.02] rounded-lg"><span className="text-[9px] text-zinc-600 block">Revenue</span><span className="text-xs font-bold">₹{c.revenue.toLocaleString()}</span></div>
                            <div className="p-2 bg-white/[0.02] rounded-lg"><span className="text-[9px] text-zinc-600 block">Deals</span><span className="text-xs font-bold">{c.deals}</span></div>
                        </div>
                        {c.website && (
                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1"><Globe size={10} /> {c.website}</div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-3"><Mail size={10} /> {c.contact}</div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setViewCompany(c)} className="p-1.5 hover:bg-white/10 rounded-lg"><Eye size={12} className="text-zinc-500" /></button>
                            <button onClick={() => setEditingCompany({ ...c })} className="p-1.5 hover:bg-white/10 rounded-lg"><Edit3 size={12} className="text-zinc-500" /></button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-white/10 rounded-lg"><Trash2 size={12} className="text-red-500" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Company Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-bold mb-4">Add New Company</h3>
                        <div className="space-y-2.5">
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Company name *" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <div className="grid grid-cols-2 gap-2">
                                <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                                <select value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="Website" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Contact email" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none" />
                            <button onClick={handleCreate} className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-xs">Add Company</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Company Modal */}
            {editingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingCompany(null)}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-bold mb-4">Edit Company</h3>
                        <div className="space-y-2.5">
                            <input value={editingCompany.name} onChange={e => setEditingCompany(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
                            <div className="grid grid-cols-3 gap-2">
                                <select value={editingCompany.industry} onChange={e => setEditingCompany(p => ({ ...p, industry: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none">
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                                <select value={editingCompany.size} onChange={e => setEditingCompany(p => ({ ...p, size: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none">
                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select value={editingCompany.status} onChange={e => setEditingCompany(p => ({ ...p, status: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none">
                                    <option value="active">Active</option><option value="prospect">Prospect</option>
                                    <option value="inactive">Inactive</option><option value="churned">Churned</option>
                                </select>
                            </div>
                            <input value={editingCompany.contact} onChange={e => setEditingCompany(p => ({ ...p, contact: e.target.value }))} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
                            <textarea value={editingCompany.notes} onChange={e => setEditingCompany(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white resize-none focus:outline-none" />
                            <button onClick={handleEdit} className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-xs">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Company Modal */}
            {viewCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewCompany(null)}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-lg mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">{viewCompany.name}</h3>
                            <button onClick={() => setViewCompany(null)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {[
                                { l: 'Industry', v: viewCompany.industry }, { l: 'Size', v: viewCompany.size },
                                { l: 'Status', v: viewCompany.status }, { l: 'Revenue', v: `₹${viewCompany.revenue.toLocaleString()}` },
                                { l: 'Deals', v: viewCompany.deals }, { l: 'Contact', v: viewCompany.contact },
                                { l: 'Website', v: viewCompany.website || '—' }, { l: 'Added', v: viewCompany.createdAt },
                            ].map(({ l, v }) => (
                                <div key={l} className="p-2.5 bg-white/[0.02] rounded-lg">
                                    <div className="text-[9px] text-zinc-600 uppercase">{l}</div>
                                    <div className="text-xs font-semibold mt-0.5">{v}</div>
                                </div>
                            ))}
                        </div>
                        {viewCompany.notes && (
                            <div className="p-3 bg-white/[0.02] rounded-lg">
                                <div className="text-[9px] text-zinc-600 uppercase mb-1">Notes</div>
                                <div className="text-xs text-zinc-400">{viewCompany.notes}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
