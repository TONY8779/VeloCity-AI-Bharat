import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Database, Key, Plus, Copy, Eye, EyeOff, RefreshCw, Trash2, X,
    Webhook, BarChart3, Code2, FileText, CheckCircle2, ExternalLink, Settings
} from 'lucide-react';

export function DataStreamView() {
    const { user } = useAuth();
    const { success: showSuccess, error: showError } = useNotification();
    const [activeTab, setActiveTab] = useState('keys');
    const [apiKeys, setApiKeys] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [showCreateKey, setShowCreateKey] = useState(false);
    const [showCreateWebhook, setShowCreateWebhook] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newWebhook, setNewWebhook] = useState({ url: '', events: [] });
    const [visibleKeys, setVisibleKeys] = useState({});

    const createKey = () => {
        if (!newKeyName.trim()) return;
        const key = {
            id: Date.now(),
            name: newKeyName,
            key: 'vc_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString(),
            lastUsed: null,
            requests: 0,
        };
        setApiKeys(prev => [...prev, key]);
        setNewKeyName('');
        setShowCreateKey(false);
        showSuccess('API key created!');
    };

    const deleteKey = (id) => {
        setApiKeys(prev => prev.filter(k => k.id !== id));
        showSuccess('API key deleted');
    };

    const toggleKeyVisibility = (id) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyKey = (key) => {
        navigator.clipboard.writeText(key);
        showSuccess('API key copied!');
    };

    const EVENTS = ['content.created', 'content.published', 'analytics.updated', 'comment.received', 'subscriber.gained'];

    const createWebhook = () => {
        if (!newWebhook.url.trim() || newWebhook.events.length === 0) {
            showError('URL and at least one event required');
            return;
        }
        const wh = {
            id: Date.now(),
            ...newWebhook,
            status: 'active',
            deliveries: 0,
            lastTriggered: null,
        };
        setWebhooks(prev => [...prev, wh]);
        setNewWebhook({ url: '', events: [] });
        setShowCreateWebhook(false);
        showSuccess('Webhook created!');
    };

    const toggleWebhookEvent = (event) => {
        setNewWebhook(prev => ({
            ...prev,
            events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Database className="text-teal-400" size={22} /> DataStream API
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">API keys, webhooks & developer tools</p>
                </div>
                <div className="flex gap-2">
                    {['keys', 'webhooks', 'docs', 'usage'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                        >{tab}</button>
                    ))}
                </div>
            </div>

            {/* API Keys Tab */}
            {activeTab === 'keys' && (
                <div className="space-y-4">
                    <button onClick={() => setShowCreateKey(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                        <Plus size={14} /> Create API Key
                    </button>

                    {showCreateKey && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateKey(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Create API Key</h3>
                                    <button onClick={() => setShowCreateKey(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g., Production, Staging)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <button onClick={createKey} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Generate Key</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {apiKeys.length > 0 ? (
                        <div className="space-y-2">
                            {apiKeys.map(key => (
                                <div key={key.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Key size={14} className="text-teal-400" />
                                            <span className="text-xs font-bold">{key.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => toggleKeyVisibility(key.id)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                {visibleKeys[key.id] ? <EyeOff size={12} className="text-zinc-400" /> : <Eye size={12} className="text-zinc-400" />}
                                            </button>
                                            <button onClick={() => copyKey(key.key)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                <Copy size={12} className="text-zinc-400" />
                                            </button>
                                            <button onClick={() => deleteKey(key.id)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                                <Trash2 size={12} className="text-zinc-500 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs bg-white/5 rounded-lg px-3 py-2 text-zinc-400">
                                        {visibleKeys[key.id] ? key.key : '••••••••••••••••••••••'}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-600">
                                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                        <span>{key.requests} requests</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <Key size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Create an API key to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
                <div className="space-y-4">
                    <button onClick={() => setShowCreateWebhook(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                        <Plus size={14} /> Create Webhook
                    </button>

                    {showCreateWebhook && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateWebhook(false)}>
                            <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold">Create Webhook</h3>
                                    <button onClick={() => setShowCreateWebhook(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                                </div>
                                <div className="space-y-3">
                                    <input value={newWebhook.url} onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))} placeholder="Webhook URL (https://...)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-2 block">Events</label>
                                        <div className="flex flex-wrap gap-2">
                                            {EVENTS.map(event => (
                                                <button key={event} onClick={() => toggleWebhookEvent(event)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${newWebhook.events.includes(event) ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-zinc-500 border border-transparent'
                                                        }`}
                                                >{event}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={createWebhook} className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm">Create Webhook</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {webhooks.length > 0 ? (
                        <div className="space-y-2">
                            {webhooks.map(wh => (
                                <div key={wh.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Webhook size={14} className="text-purple-400" />
                                            <span className="text-xs font-mono truncate max-w-[200px]">{wh.url}</span>
                                        </div>
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-bold">{wh.status}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {wh.events.map(e => (
                                            <span key={e} className="text-[9px] px-2 py-0.5 bg-white/5 rounded-full text-zinc-500">{e}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-zinc-500">
                            <Webhook size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Set up webhooks to receive real-time events</p>
                        </div>
                    )}
                </div>
            )}

            {/* Docs Tab */}
            {activeTab === 'docs' && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Code2 size={14} className="text-teal-400" /> API Documentation
                    </h3>
                    <div className="space-y-4">
                        {[
                            { method: 'GET', path: '/api/datastream/analytics', desc: 'Fetch your channel analytics' },
                            { method: 'GET', path: '/api/datastream/content', desc: 'List all published content' },
                            { method: 'POST', path: '/api/datastream/export', desc: 'Export data as CSV/JSON' },
                            { method: 'GET', path: '/api/datastream/subscribers', desc: 'Subscriber growth data' },
                        ].map((endpoint, i) => (
                            <div key={i} className="p-3 bg-white/[0.03] rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${endpoint.method === 'GET' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                                        }`}>{endpoint.method}</span>
                                    <code className="text-xs text-zinc-300 font-mono">{endpoint.path}</code>
                                </div>
                                <p className="text-[10px] text-zinc-500">{endpoint.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-black/30 rounded-xl">
                        <p className="text-[9px] text-zinc-500 font-mono mb-1"># Example Request</p>
                        <code className="text-xs text-teal-300 font-mono">
                            curl -H "X-API-Key: vc_YOUR_KEY" https://api.velocity.app/api/datastream/analytics
                        </code>
                    </div>
                </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
                <div className="text-center py-16 text-zinc-500">
                    <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">API usage analytics will appear as you make requests</p>
                </div>
            )}
        </div>
    );
}
