import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
    Shield, AlertTriangle, CheckCircle2, XCircle, Scan, RefreshCw,
    Music, Copyright, FileText, BarChart3, Eye, ArrowRight, Zap
} from 'lucide-react';

const RISK_LEVELS = {
    low: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Low Risk' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Medium Risk' },
    high: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'High Risk' },
};

export function SafeGuardView() {
    const { user } = useAuth();
    const { error: showError, success: showSuccess } = useNotification();
    const [content, setContent] = useState('');
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState(null);
    const niche = user?.niche || 'general';

    const runScan = useCallback(async () => {
        if (!content.trim()) {
            showError('Enter content to scan');
            return;
        }
        setScanning(true);
        try {
            const res = await fetch('/api/safeguard/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ content, niche }),
            });
            const data = await res.json();
            setResults(data);
        } catch (err) { showError('Scan failed'); }
        setScanning(false);
    }, [content, niche, showError]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="text-emerald-400" size={22} /> SafeGuard AI
                </h2>
                <p className="text-xs text-zinc-500 mt-1">Content safety & compliance scanner</p>
            </div>

            {/* Input */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <label className="text-xs font-semibold text-zinc-400 block">Paste Script, Title, Description, or Metadata</label>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={"Paste your video script, title, description, or tags here...\n\nWe'll check for:\n• Copyright issues\n• Community guideline violations\n• Demonetization risks\n• Platform policy compliance"}
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
                <button
                    onClick={runScan}
                    disabled={scanning || !content.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
                    {scanning ? 'Scanning...' : 'Run Safety Scan'}
                </button>
            </div>

            {/* Results */}
            {results && (
                <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Safety Score</h3>
                            <div className={`text-xs px-3 py-1 rounded-full font-bold ${RISK_LEVELS[results.overallRisk]?.bg} ${RISK_LEVELS[results.overallRisk]?.color}`
                            }>
                                {RISK_LEVELS[results.overallRisk]?.label || 'Unknown'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20">
                                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                                        stroke={results.safetyScore >= 80 ? '#22c55e' : results.safetyScore >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="3" strokeDasharray={`${results.safetyScore}, 100`} strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-black">
                                    {results.safetyScore}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-zinc-300">{results.summary}</p>
                            </div>
                        </div>
                    </div>

                    {/* Issue Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.issues?.map((issue, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${issue.severity === 'high' ? 'bg-red-500/5 border-red-500/20' :
                                    issue.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                                        'bg-green-500/5 border-green-500/20'
                                }`}>
                                <div className="flex items-start gap-3">
                                    {issue.severity === 'high' ? <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" /> :
                                        issue.severity === 'medium' ? <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" /> :
                                            <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />}
                                    <div>
                                        <h4 className="text-xs font-bold mb-1">{issue.title}</h4>
                                        <p className="text-[11px] text-zinc-400">{issue.description}</p>
                                        {issue.fix && (
                                            <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                                                <Zap size={8} className="text-amber-400" /> Fix: {issue.fix}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Platform Checks */}
                    {results.platformChecks && (
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                            <h3 className="text-sm font-bold mb-3">Platform Compliance</h3>
                            <div className="space-y-2">
                                {results.platformChecks.map((check, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold">{check.platform}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {check.passed ? (
                                                <CheckCircle2 size={14} className="text-green-400" />
                                            ) : (
                                                <XCircle size={14} className="text-red-400" />
                                            )}
                                            <span className="text-[10px] text-zinc-500">{check.note}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
