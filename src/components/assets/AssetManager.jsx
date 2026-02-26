import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Grid, List, Search, Trash2, RotateCcw, Tag, X, FolderOpen } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { useNotification } from '../../context/NotificationContext';
import { formatBytes, formatTimeAgo } from '../../utils/formatters';

export function AssetManager() {
  const { success, error: showError } = useNotification();
  const [assets, setAssets] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showTrash, setShowTrash] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { showDeleted: showTrash, search: searchQuery || undefined, type: typeFilter || undefined };
      const data = await assetService.list(filters);
      setAssets(data.assets || []);
    } catch {
      showError('Failed to load assets');
    }
    setLoading(false);
  }, [showTrash, searchQuery, typeFilter, showError]);

  const fetchStorage = useCallback(async () => {
    try {
      const data = await assetService.getStorage();
      setStorage(data);
    } catch {}
  }, []);

  useEffect(() => { fetchAssets(); fetchStorage(); }, [fetchAssets, fetchStorage]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await assetService.upload(file);
      }
      success(`${files.length} file(s) uploaded`);
      fetchAssets();
      fetchStorage();
    } catch (err) {
      showError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(Array.from(e.dataTransfer.files));
  };

  const handleDelete = async (id) => {
    try {
      await assetService.remove(id);
      success('Asset moved to trash');
      fetchAssets();
      fetchStorage();
    } catch { showError('Delete failed'); }
  };

  const handleRestore = async (id) => {
    try {
      await assetService.restore(id);
      success('Asset restored');
      fetchAssets();
    } catch { showError('Restore failed'); }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('video/')) return '🎬';
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('audio/')) return '🎵';
    return '📄';
  };

  return (
    <div className="space-y-5">
      {/* Storage Quota */}
      {storage && (
        <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Storage</h3>
            <span className="text-[11px] text-zinc-500">{formatBytes(storage.used)} / {formatBytes(storage.limit)}</span>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${parseFloat(storage.percentUsed) > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(parseFloat(storage.percentUsed), 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">{storage.percentUsed}% used · {storage.accountType} plan</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#0a0a0b] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-zinc-400 focus:outline-none">
          <option value="">All types</option>
          <option value="video">Videos</option>
          <option value="image">Images</option>
          <option value="audio">Audio</option>
        </select>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white text-[#050506]' : 'text-zinc-500 hover:bg-white/5'}`}>
            <Grid size={14} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white text-[#050506]' : 'text-zinc-500 hover:bg-white/5'}`}>
            <List size={14} />
          </button>
        </div>
        <button onClick={() => setShowTrash(!showTrash)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all ${
            showTrash ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/[0.04] text-zinc-500 border border-white/[0.06]'
          }`}>
          <Trash2 size={12} /> {showTrash ? 'Viewing Trash' : 'Trash'}
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'video/*,image/*,audio/*';
          input.onchange = (e) => handleUpload(Array.from(e.target.files));
          input.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-white/[0.06] hover:border-white/10'
        }`}
      >
        <Upload size={28} className={`mx-auto mb-3 ${dragActive ? 'text-blue-400' : 'text-zinc-700'}`} />
        <p className="text-[13px] font-semibold text-zinc-400">
          {uploading ? 'Uploading...' : dragActive ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className="text-[10px] text-zinc-700 mt-1">Videos, images, audio · Max 500MB per file</p>
      </div>

      {/* Asset Grid / List */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 bg-white/[0.02] rounded-2xl animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={36} className="mx-auto text-zinc-800 mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-1">{showTrash ? 'Trash is empty' : 'No assets yet'}</h3>
          <p className="text-sm text-zinc-600">Upload videos, images, or audio to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {assets.map((asset) => (
            <div key={asset._id} className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] overflow-hidden hover:border-white/10 transition-all group">
              <div className="aspect-video bg-black/50 flex items-center justify-center text-3xl">
                {asset.thumbnail ? <img src={asset.thumbnail} className="w-full h-full object-cover" alt="" /> : getFileIcon(asset.mimeType)}
              </div>
              <div className="p-3">
                <p className="text-[12px] font-semibold truncate mb-1">{asset.originalName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">{formatBytes(asset.size)}</span>
                  <span className="text-[10px] text-zinc-700">{formatTimeAgo(asset.createdAt)}</span>
                </div>
                {asset.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.map((tag, i) => (
                      <span key={i} className="text-[8px] bg-white/[0.04] text-zinc-500 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {showTrash ? (
                    <button onClick={(e) => { e.stopPropagation(); handleRestore(asset._id); }} className="p-1.5 bg-green-500/10 rounded-lg text-green-400 hover:bg-green-500/20">
                      <RotateCcw size={12} />
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }} className="p-1.5 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset._id} className="flex items-center gap-4 p-4 bg-[#0a0a0b] rounded-xl border border-white/[0.04] hover:border-white/10 transition-all group">
              <span className="text-xl">{getFileIcon(asset.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{asset.originalName}</p>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600 mt-0.5">
                  <span>{formatBytes(asset.size)}</span>
                  <span>{asset.format?.toUpperCase()}</span>
                  <span>{formatTimeAgo(asset.createdAt)}</span>
                </div>
              </div>
              {showTrash ? (
                <button onClick={() => handleRestore(asset._id)} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg opacity-0 group-hover:opacity-100">
                  <RotateCcw size={14} />
                </button>
              ) : (
                <button onClick={() => handleDelete(asset._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
