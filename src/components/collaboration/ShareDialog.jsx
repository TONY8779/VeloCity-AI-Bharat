import React, { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Users, Trash2 } from 'lucide-react';
import { collaborationService } from '../../services/collaborationService';
import { useNotification } from '../../context/NotificationContext';

export function ShareDialog({ projectId, onClose }) {
  const { success, error: showError } = useNotification();
  const [shareUrl, setShareUrl] = useState('');
  const [permissions, setPermissions] = useState('view');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (projectId) fetchCollaborators();
  }, [projectId]);

  const fetchCollaborators = async () => {
    try {
      const data = await collaborationService.getCollaborators(projectId);
      setCollaborators(data || []);
    } catch {}
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const data = await collaborationService.shareProject(projectId, permissions);
      setShareUrl(data.shareUrl);
      success('Share link created');
    } catch { showError('Failed to create share link'); }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeCollaborator = async (userId) => {
    try {
      await collaborationService.removeCollaborator(projectId, userId);
      fetchCollaborators();
      success('Collaborator removed');
    } catch { showError('Failed to remove collaborator'); }
  };

  const revokeLink = async () => {
    try {
      await collaborationService.revokeShare(projectId);
      setShareUrl('');
      success('Share link revoked');
    } catch { showError('Failed to revoke'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.06] p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Share Project</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>

        {/* Generate Link */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <select value={permissions} onChange={(e) => setPermissions(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-zinc-400 focus:outline-none">
              <option value="view">View only</option>
              <option value="edit">Can edit</option>
            </select>
            <button onClick={generateShareLink} disabled={loading}
              className="flex-1 bg-blue-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
              <Link2 size={14} /> {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>

          {shareUrl && (
            <div className="flex gap-2">
              <input type="text" value={shareUrl} readOnly
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[12px] text-zinc-400 focus:outline-none" />
              <button onClick={copyLink} className="p-2.5 bg-white/[0.04] rounded-xl hover:bg-white/[0.08] transition-all">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-zinc-400" />}
              </button>
              <button onClick={revokeLink} className="p-2.5 bg-red-500/10 rounded-xl hover:bg-red-500/20 text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Collaborators */}
        <div>
          <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={12} /> Collaborators ({collaborators.length})
          </h4>
          {collaborators.length === 0 ? (
            <p className="text-[12px] text-zinc-700 text-center py-4">No collaborators yet</p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                      {(c.userId?.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold">{c.userId?.displayName || 'Unknown'}</p>
                      <p className="text-[10px] text-zinc-600">{c.permissions}</p>
                    </div>
                  </div>
                  <button onClick={() => removeCollaborator(c.userId?._id)} className="text-zinc-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
