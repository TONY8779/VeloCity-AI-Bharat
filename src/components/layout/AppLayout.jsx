import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Zap, X, ChevronDown, Sparkles, RefreshCw, LayoutDashboard, Calendar, BookOpen, Video, TrendingUp, FolderOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useLiveClock } from '../../hooks/useLiveClock';
import { geminiService } from '../../services/geminiService';
import { youtubeService } from '../../services/youtubeService';
import { formatNumber } from '../../utils/formatters';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roadmap', icon: Calendar, label: 'Roadmap' },
  { to: '/notebook', icon: BookOpen, label: 'Notebook' },
  { to: '/studio', icon: Video, label: 'Studio' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
  { to: '/assets', icon: FolderOpen, label: 'Assets' },
];

export function AppLayout() {
  const { user, refreshUser } = useAuth();
  const { error: showError } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const liveClock = useLiveClock();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSyncAgo, setLastSyncAgo] = useState(0);
  const lastSyncTime = useRef(Date.now());

  // YouTube data
  const [ytConnected, setYtConnected] = useState(user?.youtubeConnected || false);
  const [ytChannel, setYtChannel] = useState(user?.youtubeChannel || null);
  const [ytVideos, setYtVideos] = useState([]);
  const [ytAnalytics, setYtAnalytics] = useState(null);
  const [ytTopVideos, setYtTopVideos] = useState([]);
  const [ytDemographics, setYtDemographics] = useState(null);

  // Roadmap
  const [roadmap, setRoadmap] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // Notebook
  const [notebookText, setNotebookText] = useState('');
  const [synthesizedScript, setSynthesizedScript] = useState(null);

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState('idle');

  // Check YouTube connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      window.history.replaceState({}, '', location.pathname);
      refreshUser();
      setYtConnected(true);
    }
  }, [location, refreshUser]);

  useEffect(() => {
    setYtConnected(user?.youtubeConnected || false);
    setYtChannel(user?.youtubeChannel || null);
  }, [user]);

  // Fetch YouTube data when connected
  useEffect(() => {
    if (!ytConnected) return;
    Promise.allSettled([
      youtubeService.getChannel().then(data => { if (data?.title) setYtChannel(data); }).catch(() => {}),
      youtubeService.getVideos().then(d => setYtVideos(Array.isArray(d?.videos) ? d.videos : [])).catch(() => {}),
      youtubeService.getAnalytics().then(data => {
        if (data?.totals && data?.daily) {
          data.totals = { views: 0, watchTime: 0, subscribersGained: 0, subscribersLost: 0, netSubscribers: 0, avgViewDuration: 0, likes: 0, shares: 0, ...data.totals };
          data.daily = Array.isArray(data.daily) ? data.daily : [];
          setYtAnalytics(data);
        }
      }).catch(() => {}),
      youtubeService.getTopVideos().then(d => setYtTopVideos(Array.isArray(d?.topVideos) ? d.topVideos : [])).catch(() => {}),
      youtubeService.getDemographics().then(d => {
        if (d) setYtDemographics({ ageGroups: Array.isArray(d.ageGroups) ? d.ageGroups : [], countries: Array.isArray(d.countries) ? d.countries : [] });
      }).catch(() => {}),
    ]);
  }, [ytConnected]);

  // Generate strategy
  const generateStrategy = useCallback(async () => {
    const niche = user?.niche;
    if (!niche) return;
    setIsGenerating(true);
    try {
      const channelContext = ytChannel ? `Channel: ${ytChannel.title}, ${formatNumber(ytChannel.subscriberCount)} subs` : '';
      const data = await geminiService.fetchRoadmap(niche, channelContext);
      if (data?.roadmap && Array.isArray(data.roadmap) && data.roadmap.length > 0) {
        const validRoadmap = data.roadmap.map((item, i) => ({
          day: item?.day || i + 1,
          title: item?.title || `Day ${i + 1}`,
          trendScore: item?.trendScore || 85,
          trajectory: item?.trajectory || 'rising',
          script: {
            hook: item?.script?.hook || 'Loading...',
            body: item?.script?.body || '',
            captions: Array.isArray(item?.script?.captions) ? item.script.captions : ['WATCH', 'FOLLOW'],
            music: item?.script?.music || { genre: 'Lo-Fi', bpm: 90, mood: 'Chill' },
          },
        }));
        setRoadmap(validRoadmap);
        setSelectedDay(validRoadmap[0]);
      }
    } catch (err) {
      showError('Failed to generate roadmap');
    }
    lastSyncTime.current = Date.now();
    setLastSyncAgo(0);
    setIsGenerating(false);
  }, [user, ytChannel, showError]);

  // Initial roadmap generation
  useEffect(() => {
    if (user?.niche && roadmap.length === 0) generateStrategy();
  }, [user?.niche]);

  // Sync timer
  useEffect(() => {
    const id = setInterval(() => setLastSyncAgo(Math.floor((Date.now() - lastSyncTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // YouTube handlers
  const handleYouTubeConnect = async () => {
    try {
      const url = await youtubeService.getAuthUrl();
      window.location.href = url;
    } catch {
      showError('YouTube OAuth server not running. Start the backend server.');
    }
  };

  const handleYouTubeDisconnect = async () => {
    await youtubeService.disconnect();
    setYtConnected(false);
    setYtChannel(null);
    setYtVideos([]);
    setYtAnalytics(null);
    setYtTopVideos([]);
    setYtDemographics(null);
    refreshUser();
  };

  // Close mobile menu on navigation
  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    return path.slice(1).charAt(0).toUpperCase() + path.slice(2);
  };

  const sharedState = {
    ytConnected, ytChannel, ytVideos, ytAnalytics, ytTopVideos, ytDemographics,
    handleYouTubeConnect, handleYouTubeDisconnect,
    roadmap, setRoadmap, selectedDay, setSelectedDay,
    notebookText, setNotebookText, synthesizedScript, setSynthesizedScript,
    generateStrategy, isGenerating,
    niche: user?.niche || '',
    saveStatus, setSaveStatus,
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex font-sans select-none overflow-hidden">
      <Sidebar />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#080809]/95 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-[#050506]" />
          </div>
          <span className="text-sm font-bold">VeloCity</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-zinc-400">
          {mobileMenuOpen ? <X size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-12 left-0 right-0 z-40 bg-[#080809]/95 backdrop-blur-xl border-b border-white/[0.04] p-3 space-y-1">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isActive ? 'bg-white text-[#050506] shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              <span className="text-[13px] font-semibold tracking-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-[#050506]">
        <header className="sticky top-0 z-40 px-4 lg:px-8 py-4 flex justify-between items-center bg-[#050506]/80 backdrop-blur-md border-b border-white/[0.03] mt-12 lg:mt-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{getPageTitle()}</h2>
            <p className="text-[11px] text-zinc-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {lastSyncAgo < 5 ? 'Synced' : `${lastSyncAgo}s ago`} · {liveClock.time} IST
              {saveStatus === 'saving' && <span className="ml-2 text-amber-400">Saving...</span>}
              {saveStatus === 'saved' && <span className="ml-2 text-green-400">Saved</span>}
            </p>
          </div>
          <button
            onClick={generateStrategy}
            disabled={isGenerating}
            className="bg-white text-[#050506] px-5 py-2 rounded-lg font-semibold text-[12px] flex items-center gap-2 hover:bg-zinc-100 transition-all active:scale-95"
          >
            {isGenerating ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
            {isGenerating ? 'Syncing...' : 'Sync'}
          </button>
        </header>

        <div className="p-4 lg:p-8">
          <Outlet context={sharedState} />
        </div>
      </main>
    </div>
  );
}
