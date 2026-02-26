export const CSS_FILTERS = {
  none: 'none',
  cinema: 'contrast(1.2) saturate(0.8)',
  noir: 'grayscale(1) contrast(1.2)',
  warm: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)',
  cool: 'hue-rotate(180deg) saturate(1.2)',
};

export const FFMPEG_FILTERS = {
  cinema: 'eq=contrast=1.2:saturation=0.8',
  noir: 'hue=s=0,eq=contrast=1.3',
  warm: 'colorbalance=rs=0.1:gs=0.05:bs=-0.1',
  cool: 'colorbalance=rs=-0.1:gs=0.0:bs=0.15',
};

export const PLATFORM_PRESETS = {
  youtube: { label: 'YouTube', aspectRatio: '16:9', resolution: '1080p', crop: 'scale=-1:1080' },
  tiktok: { label: 'TikTok', aspectRatio: '9:16', resolution: '1080p', crop: 'scale=1080:1920' },
  'instagram-reel': { label: 'Instagram Reel', aspectRatio: '9:16', resolution: '1080p', crop: 'scale=1080:1920' },
  'instagram-post': { label: 'Instagram Post', aspectRatio: '1:1', resolution: '1080p', crop: 'scale=1080:1080' },
  twitter: { label: 'Twitter/X', aspectRatio: '16:9', resolution: '720p', crop: 'scale=-1:720' },
};

export const RESOLUTION_MAP = {
  '720p': { height: 720, label: '720p HD' },
  '1080p': { height: 1080, label: '1080p Full HD' },
  '4k': { height: 2160, label: '4K Ultra HD' },
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'studio', label: 'Studio' },
  { id: 'growth', label: 'Growth' },
  { id: 'assets', label: 'Assets' },
];
