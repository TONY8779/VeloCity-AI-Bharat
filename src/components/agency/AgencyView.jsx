import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Building2, Plus, Users, LayoutDashboard, Settings, UserPlus,
    ChevronRight, Shield, BarChart3, Clock, CheckCircle2, X, FileText, Eye
} from 'lucide-react';

export function AgencyView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState('overview');
    const [clients, setClients] = useState([]);
    const [team, setTeam] = useState([]);
    const [showAddClient, setShowAddClient] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', niche: '', platform: '' });
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'editor' });

    const addClient = () => {
        if (!newClient.name.trim()) return;
        setClients(prev => [...prev, {
            id: Date.now(), ...newClient,
            status: 'active', content: 0, growth: '+0%', lastActive: new Date().toISOString(),
        }]);
        setNewClient({ name: '', niche: '', platform: '' });
        setShowAddClient(false);
        showSuccess('Client added!');
    };

    const addMember = () => {
        if (!newMember.name.trim() || !newMember.email.trim()) return;
        setTeam(prev => [...prev, { id: Date.now(), ...newMember, tasksCompleted: 0, status: 'active' }]);
        setNewMember({ name: '', email: '', role: 'editor' });
        setShowAddMember(false);
        showSuccess('Team member added!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="text-violet-400" size={22} /> VeloCity Agency
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Multi-account management for agencies</p>
                </div>
                <div className="flex gap-2">
                    {['overview', 'clients', 'team', 'reports'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                        >{tab}</button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Active Clients', value: clients.length, icon: Users, color: 'text-violet-400' },
                    { label: 'Team Members', value: team.length, icon: UserPlus, color: 'text-blue-400' },
                    { label: 'Content Created', value: clients.reduce((s, c) => s + c.content, 0), icon: FileText, color: 'text-green-400' },
                    { label: 'Avg Growth', value: '+0%', icon: BarChart3, color: 'text-amber-400' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <stat.icon size={16} className={stat.color} />
                        <div className="text-lg font-black mt-1">{stat.value}</div>
                        <div className="text-[9px] text-zinc-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Users size={14} className="text-violet-400" /> Recent Clients
                        </h3>
                        {clients.length === 0 ? (
                            <p className="text-xs text-zinc-600 py-4">No clients yet. Add your first client!</p>
                        ) : (
                            <div className="space-y-2">
                                {clients.slice(0, 5).map(client => (
                                    <div key={client.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-violet-300">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold">{client.name}</p>
                                                <p className="text-[9px] text-zinc-500">{client.niche} • {client.platform}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-bold">Active</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-blue-400" /> Recent Activity
                        </h3>
                        <div className="space-y-2">
                            {team.length === 0 && clients.length === 0 ? (
                                <p className="text-xs text-zinc-600 py-4">Activity will appear here as your team works</p>
                            ) : (
                                <p className="text-xs text-zinc-600 py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
                <div className="space-y-4">
                    <button onClick={() => setShowAddClient(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                        <Plus size={14} /> Add Client
                    </button>
                    {showAddClient && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddClient(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Add Client</h3>
                                    <button onClick={() => setShowAddClient(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Client name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <input value={newClient.niche} onChange={e => setNewClient(p => ({ ...p, niche: e.target.value }))} placeholder="Niche" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <select value={newClient.platform} onChange={e => setNewClient(p => ({ ...p, platform: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                                        <option value="">Select platform</option>
                                        <option value="YouTube">YouTube</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="TikTok">TikTok</option>
                                        <option value="Multi-Platform">Multi-Platform</option>
                                    </select>
                                    <button onClick={addClient} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Add Client</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {clients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clients.map(client => (
                                <div key={client.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all cursor-pointer">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center text-sm font-bold text-violet-300">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold">{client.name}</h4>
                                            <p className="text-[10px] text-zinc-500">{client.niche}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                        <span>{client.platform}</span>
                                        <span className="text-green-400">{client.growth} growth</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Add your first client to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
                <div className="space-y-4">
                    <button onClick={() => setShowAddMember(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                        <UserPlus size={14} /> Invite Team Member
                    </button>
                    {showAddMember && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMember(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Invite Team Member</h3>
                                    <button onClick={() => setShowAddMember(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <input value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                                        <option value="admin">Admin</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                    <button onClick={addMember} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Send Invite</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {team.length > 0 ? (
                        <div className="space-y-2">
                            {team.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">{member.name}</p>
                                            <p className="text-[9px] text-zinc-500">{member.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${member.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                                            member.role === 'editor' ? 'bg-blue-500/20 text-blue-300' :
                                                'bg-zinc-500/20 text-zinc-300'
                                        }`}>{member.role}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <UserPlus size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Invite team members to collaborate</p>
                        </div>
                    )}
                </div>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
                <div className="text-center py-16 text-zinc-500">
                    <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">White-label reports will generate as you manage clients</p>
                </div>
            )}
        </div>
    );
}
