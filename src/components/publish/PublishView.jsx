import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Send, Calendar, Clock, Youtube, Instagram, Twitter, Linkedin, Video,
    Plus, Trash2, Image, FileText, CheckCircle2, AlertCircle, X, ChevronLeft,
    ChevronRight, LayoutGrid, Settings
} from 'lucide-react';

const PLATFORMS = [
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400 bg-red-500/20' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400 bg-pink-500/20' },
    { id: 'tiktok', label: 'TikTok', icon: Video, color: 'text-cyan-400 bg-cyan-500/20' },
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-blue-400 bg-blue-500/20' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400 bg-blue-600/20' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PublishView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeView, setActiveView] = useState('compose');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const schedulePost = async () => {
        if (!title.trim() || !content.trim() || selectedPlatforms.length === 0) {
            showError('Fill in all fields and select at least one platform');
            return;
        }
        const post = {
            id: Date.now(),
            title,
            content,
            platforms: selectedPlatforms,
            scheduledFor: scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : null,
            status: scheduleDate ? 'scheduled' : 'draft',
            createdAt: new Date().toISOString(),
        };
        setScheduledPosts(prev => [...prev, post]);
        setTitle('');
        setContent('');
        setSelectedPlatforms([]);
        setScheduleDate('');
        setScheduleTime('');
        showSuccess(scheduleDate ? 'Post scheduled!' : 'Post saved as draft');
    };

    const publishNow = async () => {
        if (!title.trim() || !content.trim() || selectedPlatforms.length === 0) {
            showError('Fill in all fields and select at least one platform');
            return;
        }
        const post = {
            id: Date.now(),
            title,
            content,
            platforms: selectedPlatforms,
            scheduledFor: null,
            status: 'published',
            createdAt: new Date().toISOString(),
        };
        setScheduledPosts(prev => [...prev, post]);
        setTitle('');
        setContent('');
        setSelectedPlatforms([]);
        showSuccess('Published to ' + selectedPlatforms.length + ' platforms!');
    };

    const removePost = (id) => {
        setScheduledPosts(prev => prev.filter(p => p.id !== id));
    };

    // Calendar helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const calendarDays = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getPostsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return scheduledPosts.filter(p => p.scheduledFor?.startsWith(dateStr));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Send className="text-indigo-400" size={22} /> One-Click Publish
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Publish everywhere simultaneously</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveView('compose')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'compose' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                    >
                        <FileText size={14} className="inline mr-1" /> Compose
                    </button>
                    <button
                        onClick={() => setActiveView('calendar')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'calendar' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                    >
                        <Calendar size={14} className="inline mr-1" /> Calendar
                    </button>
                </div>
            </div>

            {activeView === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Compose Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-4">
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Post title..."
                                className="w-full bg-transparent text-lg font-bold placeholder:text-zinc-700 focus:outline-none"
                            />
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Write your content here... It will be auto-formatted for each platform."
                                rows={8}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                            />

                            {/* Platform Selection */}
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 mb-2 block">Publish To</label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
                                        <button
                                            key={id}
                                            onClick={() => togglePlatform(id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedPlatforms.includes(id)
                                                    ? `${color} border-current`
                                                    : 'bg-white/5 text-zinc-500 border-transparent hover:bg-white/10'
                                                }`}
                                        >
                                            <Icon size={14} /> {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-1 block">Schedule Date</label>
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={e => setScheduleDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-zinc-400 mb-1 block">Schedule Time</label>
                                    <input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={e => setScheduleTime(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={publishNow}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                                >
                                    <Send size={14} /> Publish Now
                                </button>
                                <button
                                    onClick={schedulePost}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all"
                                >
                                    <Clock size={14} /> {scheduleDate ? 'Schedule' : 'Save Draft'}
                                </button>
                            </div>
                        </div>

                        {/* Platform Preview */}
                        {selectedPlatforms.length > 0 && content && (
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                <h3 className="text-sm font-bold mb-3">Platform Preview</h3>
                                <div className="space-y-3">
                                    {selectedPlatforms.map(pId => {
                                        const plat = PLATFORMS.find(p => p.id === pId);
                                        const Icon = plat.icon;
                                        return (
                                            <div key={pId} className="p-3 bg-white/[0.03] rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon size={14} className={plat.color.split(' ')[0]} />
                                                    <span className="text-xs font-semibold">{plat.label}</span>
                                                    <span className="text-[9px] text-zinc-500">
                                                        {pId === 'twitter' ? `${Math.min(content.length, 280)}/280 chars` :
                                                            pId === 'linkedin' ? `${content.length} chars` : 'Auto-formatted'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-400 line-clamp-3">
                                                    {pId === 'twitter' ? content.slice(0, 280) : content}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scheduled Posts Sidebar */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1">
                            Scheduled & Drafts ({scheduledPosts.length})
                        </h3>
                        {scheduledPosts.length === 0 ? (
                            <div className="text-center py-8 text-zinc-600">
                                <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No posts scheduled yet</p>
                            </div>
                        ) : (
                            scheduledPosts.map(post => (
                                <div key={post.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-xs font-semibold truncate flex-1">{post.title}</h4>
                                        <button onClick={() => removePost(post.id)} className="text-zinc-600 hover:text-red-400 ml-2">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {post.platforms.map(pId => {
                                            const plat = PLATFORMS.find(p => p.id === pId);
                                            const Icon = plat?.icon;
                                            return Icon ? <Icon key={pId} size={10} className={plat.color.split(' ')[0]} /> : null;
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${post.status === 'published' ? 'bg-green-500/20 text-green-300' :
                                                post.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-zinc-500/20 text-zinc-300'
                                            }`}>
                                            {post.status}
                                        </span>
                                        {post.scheduledFor && (
                                            <span className="text-[9px] text-zinc-500">
                                                {new Date(post.scheduledFor).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                /* Calendar View */
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-white/10 rounded-lg">
                            <ChevronLeft size={16} />
                        </button>
                        <h3 className="text-sm font-bold">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-white/10 rounded-lg">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {DAYS.map(d => <div key={d} className="text-center text-[9px] font-bold text-zinc-600 py-2">{d}</div>)}
                        {calendarDays.map((day, i) => {
                            const posts = getPostsForDay(day);
                            const isToday = day && new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth();
                            return (
                                <div
                                    key={i}
                                    className={`min-h-[60px] p-1 rounded-lg border transition-all ${day ? (isToday ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/[0.04] hover:bg-white/[0.03]') : 'border-transparent'
                                        }`}
                                >
                                    {day && (
                                        <>
                                            <div className={`text-[10px] font-semibold mb-1 ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>{day}</div>
                                            {posts.map(p => (
                                                <div key={p.id} className="text-[8px] bg-indigo-500/20 text-indigo-300 rounded px-1 py-0.5 mb-0.5 truncate">
                                                    {p.title}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
