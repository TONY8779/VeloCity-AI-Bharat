import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Server, Zap, Clock, AlertCircle, CheckCircle2, Wifi, DollarSign } from 'lucide-react';
import { getAWSMetrics, getHealthStatus } from '../../services/awsService';

const AWS_SERVICES = [
    { id: 'bedrock', name: 'Bedrock AI', icon: '🤖' },
    { id: 's3', name: 'S3 Storage', icon: '📦' },
    { id: 'transcribe', name: 'Transcribe', icon: '🎙️' },
    { id: 'rekognition', name: 'Rekognition', icon: '👁️' },
    { id: 'polly', name: 'Polly Voice', icon: '🔊' },
    { id: 'comprehend', name: 'Comprehend', icon: '🧠' },
    { id: 'translate', name: 'Translate', icon: '🌐' },
    { id: 'dynamodb', name: 'DynamoDB', icon: '💾' },
];

export function AWSHealthWidget() {
    const [health, setHealth] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [h, m] = await Promise.all([
                getHealthStatus().catch(() => null),
                getAWSMetrics().catch(() => null),
            ]);
            setHealth(h);
            setMetrics(m);
        } catch {
            // silent fail
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchData]);

    const isConfigured = health?.aws?.configured || false;
    const totalCalls = metrics?.totalCalls || 0;
    const totalErrors = metrics?.totalErrors || 0;
    const avgResponseTime = metrics?.avgResponseTime || 0;
    const serviceBreakdown = metrics?.serviceBreakdown || {};
    const recentCalls = metrics?.recentCalls || [];

    return (
        <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
                        <Server size={16} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-bold">AWS Service Health</h3>
                        <p className="text-[10px] text-zinc-600">ap-south-1 · Mumbai</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${isConfigured ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isConfigured ? <><CheckCircle2 size={10} /> Live</> : <><AlertCircle size={10} /> Not Configured</>}
                </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-4 gap-2">
                {AWS_SERVICES.map(svc => {
                    const svcMetric = serviceBreakdown[svc.id];
                    const hasActivity = svcMetric && svcMetric.calls > 0;
                    return (
                        <div key={svc.id} className={`p-2 rounded-xl border text-center transition-all ${hasActivity ? 'border-green-500/20 bg-green-500/[0.03]' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                            <div className="text-base mb-1">{svc.icon}</div>
                            <div className="text-[9px] font-medium text-zinc-400 truncate">{svc.name}</div>
                            {hasActivity && (
                                <div className="text-[8px] text-green-400 mt-0.5">{svcMetric.calls} calls</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Zap size={10} className="text-blue-400" />
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">API Calls</span>
                    </div>
                    <p className="text-lg font-bold">{totalCalls}</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={10} className="text-yellow-400" />
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Avg Time</span>
                    </div>
                    <p className="text-lg font-bold">{avgResponseTime}<span className="text-[10px] text-zinc-500">ms</span></p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle size={10} className="text-red-400" />
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Errors</span>
                    </div>
                    <p className="text-lg font-bold">{totalErrors}</p>
                </div>
            </div>

            {/* Response Time Bar Chart (last 10 calls) */}
            {recentCalls.length > 0 && (
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Response Times</p>
                    <div className="flex items-end gap-1 h-12">
                        {recentCalls.slice(-20).map((call, i) => {
                            const maxTime = Math.max(...recentCalls.slice(-20).map(c => c.responseTime), 1);
                            const height = Math.max(4, (call.responseTime / maxTime) * 48);
                            return (
                                <div key={i} className="flex-1 group relative">
                                    <div
                                        className={`w-full rounded-t transition-all ${call.status === 'error' ? 'bg-red-500' : 'bg-blue-500/60'}`}
                                        style={{ height: `${height}px` }}
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-800 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                        {call.service}: {call.responseTime}ms
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
