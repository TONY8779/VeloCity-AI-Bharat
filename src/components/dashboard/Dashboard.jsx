import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Users, Eye, Video, TrendingUp, LogOut, ExternalLink, Flame, Play, Music, ThumbsUp, MessageCircle } from 'lucide-react';
import { formatNumber, parseISODuration } from '../../utils/formatters';
import { AWSHealthWidget } from './AWSHealthWidget';

export function Dashboard() {
  const {
    ytConnected, ytChannel, ytVideos, ytAnalytics, ytTopVideos, ytDemographics,
    handleYouTubeConnect, handleYouTubeDisconnect,
    roadmap, setSelectedDay,
  } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* AWS Service Health */}
      <AWSHealthWidget />

      {ytConnected && ytChannel ? (
        <>
          {/* Channel Overview */}
          <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {ytChannel.thumbnail && <img src={ytChannel.thumbnail} className="w-11 h-11 rounded-full border border-white/10" alt="" />}
                <div>
                  <h3 className="text-[15px] font-bold">{ytChannel.title}</h3>
                  <p className="text-[11px] text-zinc-500">{ytChannel.customUrl}</p>
                </div>
              </div>
              <button onClick={handleYouTubeDisconnect} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                <LogOut size={12} /> Disconnect
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Subscribers', value: formatNumber(ytChannel.subscriberCount), icon: Users, color: 'text-blue-400' },
                { label: 'Total Views', value: formatNumber(ytChannel.viewCount), icon: Eye, color: 'text-purple-400' },
                { label: 'Videos', value: ytChannel.videoCount, icon: Video, color: 'text-green-400' },
                { label: 'Net Subs (28d)', value: ytAnalytics ? `+${formatNumber(ytAnalytics.totals.netSubscribers)}` : '...', icon: TrendingUp, color: 'text-orange-400' },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                  <div className={`mb-2 ${s.color}`}><s.icon size={16} strokeWidth={1.8} /></div>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-zinc-600 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Grid */}
          {ytAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Views (Last 28 Days)</h3>
                <p className="text-3xl font-bold mb-4">{formatNumber(ytAnalytics.totals.views)}</p>
                <div className="flex items-end gap-[2px] h-20">
                  {(ytAnalytics.daily || []).map((d, i) => {
                    const allViews = (ytAnalytics.daily || []).map(x => x?.views || 1);
                    const maxV = allViews.length > 0 ? Math.max(...allViews) : 1;
                    const h = ((d?.views || 0) / maxV) * 100;
                    return (
                      <div key={i} className="flex-1 bg-blue-500/60 rounded-t-sm transition-all hover:bg-blue-400" style={{ height: `${Math.max(h, 2)}%` }}
                        title={`${d.day}: ${d.views} views`} />
                    );
                  })}
                </div>
              </div>
              <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Watch Time</h3>
                <p className="text-3xl font-bold mb-1">{formatNumber(Math.round(ytAnalytics.totals.watchTime))} <span className="text-sm text-zinc-500 font-normal">minutes</span></p>
                <p className="text-sm text-zinc-500 mb-4">Avg view duration: {Math.round(ytAnalytics.totals.avgViewDuration)}s</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-lg font-bold text-green-400">+{formatNumber(ytAnalytics.totals.likes)}</p>
                    <p className="text-[10px] text-zinc-600">Likes</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-lg font-bold text-blue-400">{formatNumber(ytAnalytics.totals.shares)}</p>
                    <p className="text-[10px] text-zinc-600">Shares</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Videos */}
          {ytTopVideos.length > 0 && (
            <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Top Performing Videos (28d)</h3>
              <div className="space-y-2">
                {ytTopVideos.slice(0, 5).map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                    {v.thumbnail && <img src={v.thumbnail} className="w-20 h-12 object-cover rounded-lg flex-shrink-0" alt="" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{v.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-zinc-500">{formatNumber(v.views)} views</span>
                        <span className="text-[10px] text-zinc-600">{Math.round(v.avgViewPercentage || 0)}% avg watched</span>
                        <span className="text-[10px] text-green-500">+{v.subscribersGained} subs</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-zinc-400 flex-shrink-0">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demographics */}
          {ytDemographics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ytDemographics.ageGroups?.length > 0 && (
                <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
                  <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Audience Age</h3>
                  <div className="space-y-2">
                    {ytDemographics.ageGroups.map((ag, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-400 w-16 font-medium">{ag.group}</span>
                        <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ag.percentage}%` }} />
                        </div>
                        <span className="text-[11px] text-zinc-400 w-10 text-right font-medium">{ag.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ytDemographics.countries?.length > 0 && (
                <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
                  <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Top Countries</h3>
                  <div className="space-y-2">
                    {ytDemographics.countries.slice(0, 6).map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-lg">
                        <span className="text-[12px] font-medium">{c.country}</span>
                        <span className="text-[11px] text-zinc-500">{formatNumber(c.views)} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Videos */}
          {ytVideos.length > 0 && (
            <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recent Uploads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ytVideos.slice(0, 6).map((v, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl border border-white/[0.04] overflow-hidden hover:border-white/10 transition-all">
                    {v.thumbnail && <img src={v.thumbnail} className="w-full aspect-video object-cover" alt="" />}
                    <div className="p-3">
                      <p className="text-[12px] font-semibold line-clamp-2 leading-tight mb-2">{v.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1"><Eye size={10} /> {formatNumber(v.viewCount)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp size={10} /> {formatNumber(v.likeCount)}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={10} /> {formatNumber(v.commentCount)}</span>
                      </div>
                      <p className="text-[9px] text-zinc-700 mt-1">{parseISODuration(v.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Connect YouTube CTA */}
          <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-8 text-center">
            <svg width="40" height="28" viewBox="0 0 24 17" fill="none" className="mx-auto mb-4 opacity-50"><path d="M23.5 2.5A3 3 0 0021.4.4C19.5 0 12 0 12 0S4.5 0 2.6.4A3 3 0 00.5 2.5 31.5 31.5 0 000 8.5a31.5 31.5 0 00.5 6A3 3 0 002.6 16.6c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 002.1-2.1 31.5 31.5 0 00.5-6 31.5 31.5 0 00-.5-6z" fill="#FF0000" /><path d="M9.75 12.02l6.25-3.52-6.25-3.52v7.04z" fill="#fff" /></svg>
            <h3 className="text-lg font-bold mb-2">Connect Your YouTube Channel</h3>
            <p className="text-sm text-zinc-500 mb-5 max-w-md mx-auto">Get real subscriber counts, view analytics, watch time data, audience demographics, and video performance.</p>
            <button onClick={handleYouTubeConnect} className="bg-white text-[#050506] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-100 transition-all inline-flex items-center gap-2">
              <ExternalLink size={15} /> Connect YouTube
            </button>
          </div>

          {/* Today's Mission */}
          {roadmap.length > 0 && (
            <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" /> Today's Mission
                </h3>
                <button onClick={() => navigate('/studio')} className="text-[11px] text-blue-400 hover:underline">Open Studio</button>
              </div>
              <h4 className="text-2xl font-bold mb-2">{roadmap[0]?.title}</h4>
              <p className="text-zinc-500 text-[15px] leading-relaxed mb-4">{roadmap[0]?.script?.hook}</p>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedDay(roadmap[0]); navigate('/studio'); }} className="bg-white text-[#050506] px-5 py-2.5 rounded-lg font-semibold text-[12px] flex items-center gap-2 hover:bg-zinc-100 transition-all">
                  <Play size={13} fill="currentColor" /> Start Filming
                </button>
                <button onClick={() => navigate('/roadmap')} className="bg-white/[0.04] border border-white/[0.06] text-white px-5 py-2.5 rounded-lg font-semibold text-[12px] hover:bg-white/[0.08] transition-all">
                  View Roadmap
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
