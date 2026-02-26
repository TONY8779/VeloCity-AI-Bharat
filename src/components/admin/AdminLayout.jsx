import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    LayoutDashboard, Users, Building2, Database, Activity, Download,
    Settings, Shield, ChevronLeft, ChevronRight, LogOut, Search,
    Bell, Moon, Sun, Menu, X, Zap, Crown
} from 'lucide-react';

const NAV = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/companies', icon: Building2, label: 'Companies' },
    { to: '/admin/database', icon: Database, label: 'Database' },
    { to: '/admin/activity', icon: Activity, label: 'Activity Logs' },
    { to: '/admin/export', icon: Download, label: 'Data Export' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
    const { user, logout } = useAuth();
    const { error: showError } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [bootstrapping, setBootstrapping] = useState(false);
    const [isAdmin, setIsAdmin] = useState(null); // null = checking

    // Check admin access
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch('/api/admin/stats', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('velocity_token')}` },
                });
                if (res.ok) {
                    setIsAdmin(true);
                } else {
                    // Any non-200 (401, 403, 500, etc.) → not admin
                    setIsAdmin(false);
                }
            } catch {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, []);

    const handleBootstrap = async () => {
        setBootstrapping(true);
        try {
            const res = await fetch('/api/admin/bootstrap', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('velocity_token')}` },
            });
            const data = await res.json();
            if (data.ok) {
                setIsAdmin(true);
            } else {
                showError(data.error || 'Bootstrap failed');
            }
        } catch { showError('Bootstrap failed'); }
        setBootstrapping(false);
    };

    // Loading state
    if (isAdmin === null) {
        return (
            <div className="min-h-screen bg-[#050506] flex items-center justify-center">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
                    <Shield size={20} className="text-white" />
                </div>
            </div>
        );
    }

    // Not admin — show bootstrap or redirect
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#050506] flex items-center justify-center p-4">
                <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={28} className="text-red-400" />
                    </div>
                    <h2 className="text-xl font-black mb-2">Admin Access Required</h2>
                    <p className="text-sm text-zinc-500 mb-6">
                        You need admin privileges to access this panel. If this is your first time, click below to set yourself as the superadmin.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleBootstrap}
                            disabled={bootstrapping}
                            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {bootstrapping ? 'Setting up...' : '⚡ Become Superadmin (First-Time Setup)'}
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all"
                        >
                            ← Back to App
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentPage = NAV.find(n => location.pathname === n.to || (n.to !== '/admin' && location.pathname.startsWith(n.to)));

    return (
        <div className="min-h-screen bg-[#050506] text-white flex">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-[#0a0a0b] border-r border-white/[0.04] transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* Logo */}
                <div className={`h-16 flex items-center px-4 border-b border-white/[0.04] ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Shield size={16} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-sm font-black tracking-tight">Admin Panel</h1>
                            <p className="text-[9px] text-zinc-600">VeloCity Platform</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {NAV.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${isActive
                                    ? 'bg-white/[0.08] text-white'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                                } ${collapsed ? 'justify-center px-2' : ''}`
                            }
                        >
                            <Icon size={18} className="shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-2 border-t border-white/[0.04]">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-all ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                        <Zap size={18} className="shrink-0" />
                        {!collapsed && <span>Back to App</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] text-zinc-600 hover:text-zinc-400 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.04] bg-[#050506]/80 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
                            <Menu size={18} />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold">{currentPage?.label || 'Admin'}</h2>
                            <p className="text-[10px] text-zinc-600">VeloCity Platform Administration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-xl">
                            <Crown size={12} className="text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{user?.role || 'admin'}</span>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-xs font-bold">
                            {user?.displayName?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
