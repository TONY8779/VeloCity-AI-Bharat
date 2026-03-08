import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Eye, Clock, Users, AlertCircle, Sparkles, RefreshCw, RotateCcw, TrendingUp, Target, Zap } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { awsService as geminiService } from '../../services/awsService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function GrowthView() {
  const {
    ytConnected, ytChannel, ytAnalytics, ytTopVideos, ytDemographics,
    roadmap, setRoadmap, setSelectedDay, generateStrategy, isGenerating, niche,
  } = useOutletContext();
  const { user } = useAuth();
  const { error: showError, success } = useNotification();
  const navigate = useNavigate();

  const [anomalies, setAnomalies] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Auto-fetch AI data when connected
  useEffect(() => {
    if (ytConnected && ytAnalytics && !anomalies) fetchAnomalies();
    if (ytConnected && ytAnalytics && !recommendations) fetchRecommendations();
  }, [ytConnected, ytAnalytics]);

  useEffect(() => {
    if (niche && !trends) fetchTrends();
  }, [niche]);

  const fetchAnomalies = async () => {
    if (!ytTopVideos?.length) return;
    setAnomalyLoading(true);
    try {
      const topVideo = ytTopVideos[0];
      const data = await geminiService.getAnomalyDetection({
        niche,
        videoTitle: topVideo?.title,
        videoDescription: '',
        duration: 60,
        viewCount: topVideo?.views || 0,
        avgViewDuration: ytAnalytics?.totals?.avgViewDuration || 30,
        avgViewPercentage: topVideo?.avgViewPercentage || 50,
      });
      if (data?.anomalies) setAnomalies(data);
    } catch {
      showError('Anomaly detection failed');
    }
    setAnomalyLoading(false);
  };

  const fetchRecommendations = async () => {
    setRecsLoading(true);
    try {
      const data = await geminiService.getGrowthRecommendations({
        niche,
        channelStats: ytChannel || {},
        recentPerformance: ytAnalytics?.totals || {},
        demographics: ytDemographics || {},
        topVideos: ytTopVideos?.slice(0, 5) || [],
      });
      if (data?.recommendations) setRecommendations(data);
    } catch {
      showError('Recommendations failed');
    }
    setRecsLoading(false);
  };

  const fetchTrends = async () => {
    if (!niche) return;
    setTrendsLoading(true);
    try {
      const channelContext = ytChannel ? `Channel: ${ytChannel.title}` : '';
      const data = await geminiService.getTrends(niche, channelContext);
      if (data?.trends) setTrends(data.trends);
    } catch {
      // Silently fail for trends
    }
    setTrendsLoading(false);
  };

  const handleStrategyPivot = async () => {
    navigate('/roadmap');
    generateStrategy();
  };

  return (
    <div className="space-y-5">
      {/* Real YouTube Performance */}
      {ytConnected && ytAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Views (28d)', value: formatNumber(ytAnalytics.totals.views), icon: Eye, color: 'text-blue-400' },
            { label: 'Watch Time', value: `${formatNumber(Math.round(ytAnalytics.totals.watchTime))}m`, icon: Clock, color: 'text-purple-400' },
            { label: 'Subs Gained', value: `+${formatNumber(ytAnalytics.totals.subscribersGained)}`, icon: Users, color: 'text-green-400' },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
              <div className={`mb-2 ${s.color}`}><s.icon size={18} strokeWidth={1.8} /></div>
              <p className="text-3xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[10px] text-zinc-600 font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trend Prediction */}
      {trends && trends.length > 0 && (
        <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-yellow-400" /> Trending in {niche}
            </h3>
            <button onClick={fetchTrends} disabled={trendsLoading} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
              {trendsLoading ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />} Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trends.slice(0, 8).map((t, i) => (
              <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${t.trajectory === 'rising' ? 'bg-green-500/10 text-green-400' :
                      t.trajectory === 'peaking' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                    }`}>{t.trajectory}</span>
                  <span className="text-[11px] font-bold text-blue-400">{t.score}%</span>
                </div>
                <h4 className="text-[13px] font-semibold mb-1 line-clamp-2">{t.topic}</h4>
                <p className="text-[10px] text-zinc-600 line-clamp-2">{t.description}</p>
                {t.suggestedFormat && (
                  <p className="text-[9px] text-purple-400 mt-2">Format: {t.suggestedFormat}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Anomaly Detection */}
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" /> AI Anomaly Detection
          </h3>
          <button onClick={fetchAnomalies} disabled={anomalyLoading} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
            {anomalyLoading ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />} Analyze
          </button>
        </div>
        {anomalyLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin text-zinc-600" size={20} />
            <span className="ml-3 text-sm text-zinc-600">Analyzing with AI...</span>
          </div>
        ) : anomalies?.anomalies ? (
          <>
            {anomalies.summary && (
              <p className="text-[13px] text-zinc-400 mb-4 leading-relaxed">{anomalies.summary}</p>
            )}
            <div className="space-y-2.5">
              {anomalies.anomalies.map((a, i) => (
                <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${a.severity === 'critical' ? 'bg-red-500/5 border-red-500/15' :
                    a.severity === 'medium' ? 'bg-orange-500/5 border-orange-500/15' :
                      'bg-yellow-500/5 border-yellow-500/15'
                  }`}>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                      a.severity === 'medium' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'
                    }`}>{a.time}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{a.reason}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      Drop: <span className={a.severity === 'critical' ? 'text-red-400' : 'text-orange-400'}>{a.drop}</span>
                    </p>
                    {a.recommendation && (
                      <p className="text-[10px] text-green-400 mt-1">Fix: {a.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[13px] text-zinc-600 text-center py-6">Connect YouTube and sync to analyze your videos with AI</p>
        )}
      </div>

      {/* AI Growth Recommendations */}
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Target size={14} className="text-green-400" /> AI Growth Recommendations
          </h3>
          <button onClick={fetchRecommendations} disabled={recsLoading} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
            {recsLoading ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />} Refresh
          </button>
        </div>
        {recsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="animate-spin text-zinc-600" size={20} />
            <span className="ml-3 text-sm text-zinc-600">Generating with AI...</span>
          </div>
        ) : recommendations?.recommendations ? (
          <div className="space-y-3">
            {recommendations.recommendations.map((rec, i) => (
              <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">#{i + 1}</span>
                  <h4 className="text-[14px] font-semibold">{rec.title}</h4>
                  {rec.type && <span className="text-[9px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded">{rec.type}</span>}
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed mb-2">{rec.description}</p>
                {rec.rationale && <p className="text-[10px] text-zinc-600 mb-1">Why: {rec.rationale}</p>}
                {rec.expectedImpact && <p className="text-[10px] text-green-400">Impact: {rec.expectedImpact}</p>}
              </div>
            ))}

            {/* Optimal Posting Times */}
            {recommendations.optimalPostingTimes?.length > 0 && (
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl mt-4">
                <h4 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-3">Optimal Posting Times</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {recommendations.optimalPostingTimes.map((t, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-2.5">
                      <p className="text-[12px] font-semibold text-white">{t.day} {t.time}</p>
                      <p className="text-[9px] text-zinc-600">{t.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.overallStrategy && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <h4 className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2">Overall Strategy</h4>
                <p className="text-[13px] text-zinc-300 leading-relaxed">{recommendations.overallStrategy}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-zinc-600 text-center py-6">Sync your channel data to get AI-powered recommendations</p>
        )}
      </div>

      {/* Strategy Pivot */}
      <div className="bg-[#0a0a0b] rounded-2xl border border-blue-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white text-[#050506] rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">Strategy Pivot</h3>
            <p className="text-zinc-400 text-[14px] leading-relaxed mb-4">
              {anomalies?.summary
                ? anomalies.summary
                : 'The Algorithm can regenerate your entire content roadmap based on fresh AI analysis. Use this when your strategy needs a complete refresh.'}
            </p>
            <button onClick={handleStrategyPivot} disabled={isGenerating}
              className="bg-white text-[#050506] px-5 py-2.5 rounded-lg font-semibold text-[12px] hover:bg-zinc-100 transition-all flex items-center gap-2">
              {isGenerating ? <><RefreshCw className="animate-spin" size={13} /> Refactoring...</> : <><RotateCcw size={13} /> Refactor Scripts</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
