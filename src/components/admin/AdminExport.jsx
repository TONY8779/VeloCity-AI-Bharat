import React, { useState, useEffect } from 'react';
import {
    Download, FileJson, FileSpreadsheet, Database, CheckCircle2,
    ArrowDown, Calendar, Filter, RefreshCw
} from 'lucide-react';

export function AdminExport() {
    const [collections, setCollections] = useState([]);
    const [selected, setSelected] = useState('User');
    const [format, setFormat] = useState('json');
    const [exporting, setExporting] = useState(false);
    const [exportHistory, setExportHistory] = useState([]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetch('/api/admin/collections', {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(setCollections).catch(() => { });
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch(`/api/admin/export/${selected}?format=${format}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const contentType = res.headers.get('content-type');
            const blob = await res.blob();
            const ext = format === 'csv' ? 'csv' : 'json';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selected}_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            setExportHistory(prev => [{
                collection: selected,
                format: ext,
                date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                status: 'success',
            }, ...prev]);
        } catch {
            setExportHistory(prev => [{
                collection: selected, format, date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), status: 'failed',
            }, ...prev]);
        }
        setExporting(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black">Data Export</h1>
                <p className="text-xs text-zinc-500">Export your platform data in various formats</p>
            </div>

            {/* Export Card */}
            <div className="max-w-xl p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Download size={14} className="text-indigo-400" /> New Export
                </h3>

                <div className="space-y-4">
                    {/* Collection Select */}
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Collection</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {collections.map(c => (
                                <button key={c.name} onClick={() => setSelected(c.name)}
                                    className={`p-3 rounded-xl text-left transition-all border ${selected === c.name
                                            ? 'bg-indigo-500/10 border-indigo-500/30'
                                            : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                        }`}>
                                    <div className="flex items-center gap-2">
                                        <Database size={12} className={selected === c.name ? 'text-indigo-400' : 'text-zinc-500'} />
                                        <span className="text-xs font-bold">{c.name}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">{c.count} records</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Select */}
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">Format</label>
                        <div className="flex gap-2">
                            <button onClick={() => setFormat('json')}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all border flex-1 ${format === 'json' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                    }`}>
                                <FileJson size={16} className={format === 'json' ? 'text-amber-400' : 'text-zinc-500'} />
                                <div className="text-left">
                                    <div className="text-xs font-bold">JSON</div>
                                    <div className="text-[9px] text-zinc-500">Full structured data</div>
                                </div>
                            </button>
                            <button onClick={() => setFormat('csv')}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all border flex-1 ${format === 'csv' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                                    }`}>
                                <FileSpreadsheet size={16} className={format === 'csv' ? 'text-green-400' : 'text-zinc-500'} />
                                <div className="text-left">
                                    <div className="text-xs font-bold">CSV</div>
                                    <div className="text-[9px] text-zinc-500">Spreadsheet compatible</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Export Button */}
                    <button onClick={handleExport} disabled={exporting}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                        {exporting ? 'Exporting...' : `Export ${selected} as ${format.toUpperCase()}`}
                    </button>
                </div>
            </div>

            {/* Export History */}
            {exportHistory.length > 0 && (
                <div className="max-w-xl">
                    <h3 className="text-sm font-bold mb-3">Export History</h3>
                    <div className="space-y-1">
                        {exportHistory.map((e, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={14} className={e.status === 'success' ? 'text-green-400' : 'text-red-400'} />
                                    <div>
                                        <span className="text-xs font-semibold">{e.collection}</span>
                                        <span className="text-[10px] text-zinc-500 ml-2">.{e.format}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-500">{e.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
