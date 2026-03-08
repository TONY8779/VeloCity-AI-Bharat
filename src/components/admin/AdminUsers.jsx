import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, Filter, Plus, Edit3, Trash2, Shield, Crown, ChevronLeft,
    ChevronRight, Check, X, MoreHorizontal, Download, UserPlus, Eye,
    RefreshCw, AlertTriangle, CheckCircle2, Ban, Mail, ArrowUpDown
} from 'lucide-react';

const ROLES = ['user', 'admin', 'superadmin'];
const STATUSES = ['active', 'suspended', 'banned'];
const TYPES = ['free', 'premium'];

const ROLE_BADGE = {
    user: 'bg-zinc-500/20 text-zinc-400',
    admin: 'bg-amber-500/20 text-amber-300',
    superadmin: 'bg-red-500/20 text-red-300',
};
const STATUS_BADGE = {
    active: 'bg-green-500/20 text-green-300',
    suspended: 'bg-amber-500/20 text-amber-300',
    banned: 'bg-red-500/20 text-red-300',
};

export function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [limit, setLimit] = useState(25);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortField, setSortField] = useState('-createdAt');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', niche: '', role: 'user', accountType: 'free' });
    const [showBulk, setShowBulk] = useState(false);
    const [viewingUser, setViewingUser] = useState(null);
    const [userDetail, setUserDetail] = useState(null);

    const token = localStorage.getItem('velocity_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit, sort: sortField });
            if (search) params.set('search', search);
            if (filterRole) params.set('role', filterRole);
            if (filterStatus) params.set('status', filterStatus);
            if (filterType) params.set('accountType', filterType);
            const res = await fetch(`/api/admin/users?${params}`, { headers });
            const data = await res.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch { }
        setLoading(false);
    }, [page, limit, search, filterRole, filterStatus, filterType, sortField]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const createUser = async () => {
        if (!newUser.email || !newUser.password) return;
        await fetch('/api/admin/users', { method: 'POST', headers, body: JSON.stringify(newUser) });
        setShowCreate(false);
        setNewUser({ email: '', password: '', displayName: '', niche: '', role: 'user', accountType: 'free' });
        fetchUsers();
    };

    const updateUser = async (id, updates) => {
        await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(updates) });
        setEditingUser(null);
        fetchUsers();
    };

    const deleteUser = async (id) => {
        if (!confirm('Delete this user permanently?')) return;
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers });
        fetchUsers();
    };

    const bulkAction = async (action, value) => {
        await fetch('/api/admin/users/bulk', { method: 'POST', headers, body: JSON.stringify({ ids: selected, action, value }) });
        setSelected([]);
        setShowBulk(false);
        fetchUsers();
    };

    const viewUser = async (id) => {
        const res = await fetch(`/api/admin/users/${id}`, { headers });
        const data = await res.json();
        setUserDetail(data);
        setViewingUser(id);
    };

    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => setSelected(prev => prev.length === users.length ? [] : users.map(u => u._id));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black">User Management</h1>
                    <p className="text-xs text-zinc-500">{total} total users</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all">
                        <UserPlus size={14} /> Create User
                    </button>
                    <button onClick={fetchUsers} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..."
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/30" />
                </div>
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none min-w-[100px]">
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none min-w-[100px]">
                    <option value="">All Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none min-w-[100px]">
                    <option value="">All Types</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Bulk Actions */}
            {selected.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <span className="text-xs font-bold text-indigo-300">{selected.length} selected</span>
                    <button onClick={() => bulkAction('changeStatus', 'suspended')} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-bold">Suspend</button>
                    <button onClick={() => bulkAction('changeStatus', 'active')} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-[10px] font-bold">Activate</button>
                    <button onClick={() => bulkAction('changeType', 'premium')} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-[10px] font-bold">→ Premium</button>
                    <button onClick={() => bulkAction('delete')} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-[10px] font-bold">Delete</button>
                    <button onClick={() => setSelected([])} className="ml-auto text-zinc-500 hover:text-white"><X size={14} /></button>
                </div>
            )}

            {/* Users Table */}
            <div className="rounded-2xl bg-white/[0.01] border border-white/[0.04] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                                <th className="py-3 px-3 text-left w-8">
                                    <input type="checkbox" checked={selected.length === users.length && users.length > 0} onChange={toggleAll}
                                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-transparent accent-indigo-500" />
                                </th>
                                {[
                                    { key: 'displayName', label: 'User' },
                                    { key: 'email', label: 'Email' },
                                    { key: 'role', label: 'Role' },
                                    { key: 'accountType', label: 'Type' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'niche', label: 'Niche' },
                                    { key: 'createdAt', label: 'Created' },
                                ].map(col => (
                                    <th key={col.key} className="py-3 px-3 text-left cursor-pointer hover:text-white group"
                                        onClick={() => setSortField(prev => prev === col.key ? `-${col.key}` : col.key)}>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 group-hover:text-zinc-300">
                                            {col.label} <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100" />
                                        </span>
                                    </th>
                                ))}
                                <th className="py-3 px-3 text-right">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="py-12 text-center text-zinc-600 text-xs">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={9} className="py-12 text-center text-zinc-600 text-xs">No users found</td></tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u._id} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-all ${selected.includes(u._id) ? 'bg-indigo-500/5' : ''}`}>
                                        <td className="py-3 px-3">
                                            <input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggleSelect(u._id)}
                                                className="w-3.5 h-3.5 rounded border-zinc-600 bg-transparent accent-indigo-500" />
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                                                    {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-semibold truncate max-w-[120px]">{u.displayName || 'Unnamed'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-xs text-zinc-400 truncate max-w-[160px]">{u.email}</td>
                                        <td className="py-3 px-3">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                                                {u.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${u.accountType === 'premium' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                                {u.accountType || 'free'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[u.status] || STATUS_BADGE.active}`}>
                                                {u.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-xs text-zinc-500 truncate max-w-[100px]">{u.niche || '—'}</td>
                                        <td className="py-3 px-3 text-[10px] text-zinc-600">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => viewUser(u._id)} className="p-1.5 hover:bg-white/10 rounded-lg" title="View">
                                                    <Eye size={12} className="text-zinc-500 hover:text-white" />
                                                </button>
                                                <button onClick={() => setEditingUser(u)} className="p-1.5 hover:bg-white/10 rounded-lg" title="Edit">
                                                    <Edit3 size={12} className="text-zinc-500 hover:text-indigo-400" />
                                                </button>
                                                <button onClick={() => deleteUser(u._id)} className="p-1.5 hover:bg-white/10 rounded-lg" title="Delete">
                                                    <Trash2 size={12} className="text-zinc-500 hover:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">Rows per page:</span>
                        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="bg-transparent text-xs text-white focus:outline-none">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={14} /></button>
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
                            className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Create New User</h3>
                            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="space-y-2.5">
                            <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Email *" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Password *" type="password" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newUser.displayName} onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))} placeholder="Display name" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input value={newUser.niche} onChange={e => setNewUser(p => ({ ...p, niche: e.target.value }))} placeholder="Niche" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <div className="grid grid-cols-2 gap-2">
                                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <select value={newUser.accountType} onChange={e => setNewUser(p => ({ ...p, accountType: e.target.value }))} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <button onClick={createUser} className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-xs mt-1">Create User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="space-y-2.5">
                            <input defaultValue={editingUser.displayName} id="edit-name" placeholder="Display name" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input defaultValue={editingUser.email} id="edit-email" placeholder="Email" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <input defaultValue={editingUser.niche} id="edit-niche" placeholder="Niche" className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                            <div className="grid grid-cols-3 gap-2">
                                <select defaultValue={editingUser.role} id="edit-role" className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <select defaultValue={editingUser.accountType} id="edit-type" className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select defaultValue={editingUser.status} id="edit-status" className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={() => updateUser(editingUser._id, {
                                displayName: document.getElementById('edit-name').value,
                                email: document.getElementById('edit-email').value,
                                niche: document.getElementById('edit-niche').value,
                                role: document.getElementById('edit-role').value,
                                accountType: document.getElementById('edit-type').value,
                                status: document.getElementById('edit-status').value,
                            })} className="w-full py-2.5 bg-white text-black rounded-xl font-bold text-xs mt-1">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View User Detail Modal */}
            {viewingUser && userDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setViewingUser(null); setUserDetail(null); }}>
                    <div className="bg-[#0e0e0f] rounded-2xl p-6 w-full max-w-lg mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">User Details</h3>
                            <button onClick={() => { setViewingUser(null); setUserDetail(null); }} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl flex items-center justify-center text-lg font-bold text-indigo-300">
                                    {(userDetail.user?.displayName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{userDetail.user?.displayName || 'Unnamed'}</p>
                                    <p className="text-[10px] text-zinc-500">{userDetail.user?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { l: 'Role', v: userDetail.user?.role },
                                    { l: 'Account', v: userDetail.user?.accountType },
                                    { l: 'Status', v: userDetail.user?.status },
                                    { l: 'Niche', v: userDetail.user?.niche || '—' },
                                    { l: 'Projects', v: userDetail.projects },
                                    { l: 'Assets', v: userDetail.assets },
                                    { l: 'YouTube', v: userDetail.user?.youtubeChannel ? 'Connected' : 'Not connected' },
                                    { l: 'Joined', v: userDetail.user?.createdAt ? new Date(userDetail.user.createdAt).toLocaleDateString() : '—' },
                                ].map(({ l, v }) => (
                                    <div key={l} className="p-2.5 bg-white/[0.02] rounded-lg">
                                        <div className="text-[9px] text-zinc-600 uppercase tracking-wider">{l}</div>
                                        <div className="text-xs font-semibold mt-0.5">{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
