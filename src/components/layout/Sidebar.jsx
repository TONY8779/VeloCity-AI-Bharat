import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, BookOpen, Video, TrendingUp, FolderOpen,
  Zap, LogOut, Flame, Users, Sun, Image, Type, Repeat, MessageCircle,
  Shield, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../utils/formatters';

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/roadmap', icon: Calendar, label: 'Roadmap' },
      { to: '/notebook', icon: BookOpen, label: 'Notebook' },
      { to: '/studio', icon: Video, label: 'Studio' },
      { to: '/assets', icon: FolderOpen, label: 'Assets' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/trends', icon: Flame, label: 'Trend Hunter' },
      { to: '/competitors', icon: Users, label: 'Competitors' },
      { to: '/briefing', icon: Sun, label: 'Morning Brief' },
      { to: '/growth', icon: TrendingUp, label: 'Growth' },
    ],
  },
  {
    label: 'Creation',
    items: [
      { to: '/thumbmaster', icon: Image, label: 'ThumbMaster' },
      { to: '/titlecraft', icon: Type, label: 'TitleCraft' },
      { to: '/evergreen', icon: Repeat, label: 'Evergreen' },
    ],
  },
  {
    label: 'Distribution',
    items: [
      { to: '/commentgenius', icon: MessageCircle, label: 'CommentGenius' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/safeguard', icon: Shield, label: 'SafeGuard' },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (label) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="hidden lg:flex w-60 border-r border-white/[0.04] flex-col bg-[#080809] overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-[#050506]" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight">VeloCity</h1>
          <p className="text-[9px] text-zinc-600 font-medium">The Algorithm · Active</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin">
        {navSections.map(({ label, items }) => {
          const isCollapsed = collapsed[label];
          return (
            <div key={label}>
              <button
                onClick={() => toggleSection(label)}
                className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {label}
                {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {items.map(({ to, icon: Icon, label: itemLabel }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-white text-[#050506] shadow-lg'
                          : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                          <span className="text-[12px] font-semibold tracking-tight">{itemLabel}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Admin Panel Link */}
      <div className="px-3 pb-2">
        <NavLink to="/admin"
          className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/10 text-red-400 hover:from-red-500/20 hover:to-orange-500/20 transition-all">
          <Shield size={13} /> Admin Panel
        </NavLink>
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2 border-t border-white/[0.04]">
        {user?.niche && (
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">Niche</p>
            <p className="text-[11px] font-semibold text-blue-400 truncate">{user.niche}</p>
          </div>
        )}
        {user?.youtubeConnected && user?.youtubeChannel && (
          <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-2 mb-1">
              <svg width="12" height="9" viewBox="0 0 24 17" fill="none"><path d="M23.5 2.5A3 3 0 0021.4.4C19.5 0 12 0 12 0S4.5 0 2.6.4A3 3 0 00.5 2.5 31.5 31.5 0 000 8.5a31.5 31.5 0 00.5 6A3 3 0 002.6 16.6c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 002.1-2.1 31.5 31.5 0 00.5-6 31.5 31.5 0 00-.5-6z" fill="#FF0000" /><path d="M9.75 12.02l6.25-3.52-6.25-3.52v7.04z" fill="#fff" /></svg>
              <span className="text-[10px] text-green-400 font-semibold">Connected</span>
            </div>
            <p className="text-[11px] font-semibold text-white truncate">{user.youtubeChannel.title}</p>
            <p className="text-[10px] text-zinc-600">{formatNumber(user.youtubeChannel.subscriberCount)} subs</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-zinc-600 hover:text-red-400 transition-colors text-[11px]"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
