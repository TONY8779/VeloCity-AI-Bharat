import React, { useState, useEffect } from 'react';
import {
    Database, Search, ChevronRight, RefreshCw, FileJson, Eye, ChevronLeft,
    ChevronDown, Hash, Box, Copy, Check
} from 'lucide-react';

export function AdminDatabase() {
    const [collections, setCollections] = useState([]);
    const [activeCollection, setActiveCollection] = useState(null);
    const [docs, setDocs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [expandedDoc, setExpandedDoc] = useState(null);
    const [copied, setCopied] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetch('/api/admin/collections', { headers }).then(r => r.json()).then(setCollections).catch(() => { });
    }, []);

    const browseCollection = async (name, pg = 1) => {
        setActiveCollection(name);
        setPage(pg);
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, limit: 20 });
            if (search) params.set('search', search);
            const res = await fetch(`/api/admin/collections/${name}?${params}`, { headers });
            const data = await res.json();
            setDocs(data.docs || []);
            setTotal(data.total || 0);
        } catch { }
        setLoading(false);
    };

    const copyDoc = (doc) => {
        navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
        setCopied(doc._id);
        setTimeout(() => setCopied(null), 2000);
    };

    const getFieldPreview = (value) => {
        if (value === null || value === undefined) return <span className="text-zinc-600">null</span>;
        if (typeof value === 'boolean') return <span className={value ? 'text-green-400' : 'text-red-400'}>{value.toString()}</span>;
        if (typeof value === 'number') return <span className="text-amber-400">{value}</span>;
        if (typeof value === 'string') {
            if (value.length > 60) return <span className="text-emerald-400">"{value.slice(0, 60)}..."</span>;
            return <span className="text-emerald-400">"{value}"</span>;
        }
        if (Array.isArray(value)) return <span className="text-purple-400">[Array({value.length})]</span>;
        if (typeof value === 'object') return <span className="text-cyan-400">{'{Object}'}</span>;
        return <span>{String(value)}</span>;
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-black">Database Browser</h1>
                <p className="text-xs text-zinc-500">Browse and inspect collections</p>
            </div>

            {/* Collection Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {collections.map(c => (
                    <button key={c.name} onClick={() => browseCollection(c.name)}
                        className={`p-4 rounded-2xl border text-left transition-all ${activeCollection === c.name
                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                            }`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Database size={14} className={activeCollection === c.name ? 'text-indigo-400' : 'text-zinc-500'} />
                            <span className="text-xs font-bold">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Hash size={10} className="text-zinc-600" />
                            <span className="text-[10px] text-zinc-500">{c.count} docs</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Documents */}
            {activeCollection && (
                <>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search in ${activeCollection}...`}
                                onKeyDown={e => e.key === 'Enter' && browseCollection(activeCollection, 1)}
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none" />
                        </div>
                        <button onClick={() => browseCollection(activeCollection, page)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {docs.map((doc, i) => {
                            const docId = doc._id || doc.id || i;
                            const isExpanded = expandedDoc === docId;
                            return (
                                <div key={docId} className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                                    {/* Document Header */}
                                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                                        onClick={() => setExpandedDoc(isExpanded ? null : docId)}>
                                        <div className="flex items-center gap-3">
                                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                            <Box size={14} className="text-indigo-400" />
                                            <span className="text-xs font-mono text-zinc-400">{docId}</span>
                                            {doc.displayName && <span className="text-xs text-zinc-300 ml-2">· {doc.displayName}</span>}
                                            {doc.email && <span className="text-[10px] text-zinc-500 ml-1">{doc.email}</span>}
                                            {doc.title && <span className="text-xs text-zinc-300 ml-2">· {doc.title}</span>}
                                        </div>
                                        <button onClick={e => { e.stopPropagation(); copyDoc(doc); }}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                                            {copied === docId ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-zinc-600" />}
                                        </button>
                                    </div>

                                    {/* Expanded JSON View */}
                                    {isExpanded && (
                                        <div className="border-t border-white/[0.04] max-h-[400px] overflow-y-auto">
                                            <div className="p-4 font-mono text-[11px] space-y-1">
                                                {Object.entries(doc).map(([key, value]) => (
                                                    <div key={key} className="flex items-start gap-2 py-0.5 hover:bg-white/[0.02] px-2 rounded-md">
                                                        <span className="text-blue-400 shrink-0 min-w-[100px]">"{key}":</span>
                                                        <div className="break-all">
                                                            {typeof value === 'object' && value !== null ? (
                                                                <pre className="text-xs text-zinc-400 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                                                            ) : (
                                                                getFieldPreview(value)
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {docs.length === 0 && !loading && (
                            <div className="text-center py-12 text-zinc-600 text-xs">No documents found</div>
                        )}
                    </div>

                    {/* Pagination */}
                    {total > 20 && (
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => browseCollection(activeCollection, page - 1)} disabled={page <= 1}
                                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={14} /></button>
                            <span className="text-xs text-zinc-500">Page {page} of {Math.ceil(total / 20)}</span>
                            <button onClick={() => browseCollection(activeCollection, page + 1)} disabled={page >= Math.ceil(total / 20)}
                                className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight size={14} /></button>
                        </div>
                    )}
                </>
            )}

            {!activeCollection && (
                <div className="text-center py-16 text-zinc-600">
                    <Database size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a collection above to browse documents</p>
                </div>
            )}
        </div>
    );
}
