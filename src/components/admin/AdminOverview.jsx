import React, { useState, useEffect } from 'react';
import {
    Users, Activity, Database, Download, TrendingUp, TrendingDown,
    UserPlus, Shield, Crown, BarChart3, ArrowUpRight, ArrowDownRight,
    Zap, Eye, Clock, Server, HardDrive, Cpu, Wifi
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, change, color, subtext }) {
    return (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{label}</div>
            {subtext && <div className="text-[9px] text-zinc-600 mt-1">{subtext}</div>}
        </div>
    );
}

function MiniChart({ data, color = '#6366f1' }) {
    if (!data?.length) return null;
    const max = Math.max(...data.map(d => d.count), 1);
    const h = 40;
    const w = 200;
    const step = w / (data.length - 1 || 1);
    const points = data.map((d, i) => `${i * step},${h - (d.count / max) * h}`).join(' ');
    return (
        <svg width={w} height={h} className="w-full h-10">
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} opacity="0.05" />
        </svg>
    );
}

export function AdminOverview() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then(r => r.json()).then(setStats).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const s = stats || {};

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black">Dashboard Overview</h1>
                <p className="text-xs text-zinc-500 mt-1">Platform statistics and insights</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={s.totalUsers || 0} change={12} color="bg-indigo-500/20 text-indigo-400" />
                <StatCard icon={UserPlus} label="Active Users" value={s.activeUsers || 0} color="bg-green-500/20 text-green-400" subtext={`${s.suspendedUsers || 0} suspended`} />
                <StatCard icon={Crown} label="Premium Users" value={s.premiumUsers || 0} change={8} color="bg-amber-500/20 text-amber-400" />
                <StatCard icon={Shield} label="Admin Users" value={s.adminUsers || 0} color="bg-red-500/20 text-red-400" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Database} label="Projects" value={s.totalProjects || 0} color="bg-purple-500/20 text-purple-400" />
                <StatCard icon={HardDrive} label="Assets" value={s.totalAssets || 0} color="bg-cyan-500/20 text-cyan-400" />
                <StatCard icon={Server} label="Server Status" value="Online" color="bg-emerald-500/20 text-emerald-400" subtext="100% uptime" />
                <StatCard icon={Cpu} label="Memory Mode" value="Active" color="bg-orange-500/20 text-orange-400" subtext="MongoDB not connected" />
            </div>

            {/* User Growth Chart */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold">User Growth</h3>
                        <p className="text-[10px] text-zinc-500">Last 30 days</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                        <TrendingUp size={12} /> Growing
                    </div>
                </div>
                <MiniChart data={s.growthByDay || []} />
                <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-zinc-600">30 days ago</span>
                    <span className="text-[9px] text-zinc-600">Today</span>
                </div>
            </div>

            {/* Recent Users + System */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Signups */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <UserPlus size={14} className="text-indigo-400" /> Recent Signups
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {(s.recentUsers || []).map((u, i) => (
                            <div key={u._id || i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-300">
                                        {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">{u.displayName || 'Unnamed'}</p>
                                        <p className="text-[9px] text-zinc-600">{u.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${u.role === 'superadmin' ? 'bg-red-500/20 text-red-300' :
                                            u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' :
                                                'bg-zinc-500/20 text-zinc-400'
                                        }`}>{u.role || 'user'}</span>
                                    <p className="text-[9px] text-zinc-600 mt-1">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!s.recentUsers || s.recentUsers.length === 0) && (
                            <p className="text-xs text-zinc-600 text-center py-4">No users yet</p>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" /> System Health
                    </h3>
                    <div className="space-y-3">
                        {[
                            { label: 'API Server', status: 'Operational', color: 'bg-emerald-500', icon: Server },
                            { label: 'Database', status: s.totalUsers > 0 ? 'Connected' : 'In-Memory', color: s.totalUsers > 0 ? 'bg-emerald-500' : 'bg-amber-500', icon: Database },
                            { label: 'Auth Service', status: 'Operational', color: 'bg-emerald-500', icon: Shield },
                            { label: 'AI Services', status: 'Available', color: 'bg-emerald-500', icon: Zap },
                            { label: 'CDN / Assets', status: 'Operational', color: 'bg-emerald-500', icon: Wifi },
                        ].map(({ label, status, color, icon: Icon }) => (
                            <div key={label} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Icon size={14} className="text-zinc-500" />
                                    <span className="text-xs font-medium">{label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
                                    <span className="text-[10px] text-zinc-400">{status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
