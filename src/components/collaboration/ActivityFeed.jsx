import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';
import { formatTimeAgo } from '../../utils/formatters';

const ACTION_LABELS = {
  project_created: 'created the project',
  project_updated: 'updated the project',
  asset_uploaded: 'uploaded a file',
  asset_deleted: 'deleted a file',
  share_link_created: 'created a share link',
  collaborator_joined: 'joined the project',
  collaborator_removed: 'was removed',
  comment_added: 'added a comment',
};

export function ActivityFeed({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const fetch = async () => {
      try {
        const data = await collaborationService.getActivity(projectId);
        setActivities(data.activities || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  if (loading) return <div className="animate-pulse h-32 bg-white/[0.02] rounded-2xl" />;
  if (activities.length === 0) return null;

  return (
    <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-5">
      <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-4">
        <Activity size={12} /> Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.slice(0, 10).map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
              {(a.userId?.displayName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[12px]">
                <span className="font-semibold text-white">{a.userId?.displayName || 'Unknown'}</span>
                {' '}
                <span className="text-zinc-500">{ACTION_LABELS[a.action] || a.action}</span>
              </p>
              <p className="text-[10px] text-zinc-700">{formatTimeAgo(a.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
