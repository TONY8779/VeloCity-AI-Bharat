import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Zap, Music } from 'lucide-react';

export function RoadmapView() {
  const { roadmap, setSelectedDay } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {roadmap.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-white/[0.02] rounded-2xl animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {roadmap.map((item) => (
          <div
            key={item.day}
            onClick={() => { setSelectedDay(item); navigate('/studio'); }}
            className="group p-5 rounded-2xl border border-white/[0.04] bg-[#0a0a0b] hover:border-white/10 cursor-pointer transition-all hover:bg-[#0e0e0f]"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider bg-white/[0.04] px-3 py-1 rounded-full">Day {item.day}</span>
              <div className="flex items-center gap-1 text-blue-400">
                <Zap size={10} fill="currentColor" />
                <span className="text-[10px] font-bold">{item.trendScore}%</span>
              </div>
            </div>
            {item.trajectory && (
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mb-2 inline-block ${
                item.trajectory === 'rising' ? 'bg-green-500/10 text-green-400' :
                item.trajectory === 'peaking' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {item.trajectory}
              </span>
            )}
            <h4 className="text-[14px] font-semibold mb-2 leading-tight group-hover:text-blue-400 transition-colors">{item.title}</h4>
            <p className="text-[11px] text-zinc-600 line-clamp-2 mb-3 leading-relaxed">{item.script?.hook}</p>
            {item.script?.music && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                <Music size={10} className="text-purple-400" />
                <span>{item.script.music.genre} · {item.script.music.bpm}bpm</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
