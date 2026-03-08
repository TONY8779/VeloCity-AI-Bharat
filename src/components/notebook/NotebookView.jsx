import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Brain, Target, CheckCircle2, Sparkles, RefreshCw, ArrowUpRight, Music, Globe2, Volume2, VolumeX } from 'lucide-react';
import { synthesizeScript, translateScript, synthesizeSpeech } from '../../services/awsService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi' }, { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' }, { code: 'bn', name: 'Bengali' },
  { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam' },
];

export function NotebookView() {
  const {
    notebookText, setNotebookText, synthesizedScript, setSynthesizedScript,
    roadmap, setRoadmap, setSelectedDay, ytConnected, ytChannel, niche,
  } = useOutletContext();
  const { user } = useAuth();
  const { error: showError } = useNotification();
  const navigate = useNavigate();
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedScript, setTranslatedScript] = useState(null);
  const [selectedLang, setSelectedLang] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const handleSynthesize = async () => {
    if (!notebookText.trim()) return;
    setIsSynthesizing(true);
    setTranslatedScript(null);
    try {
      const channelContext = ytChannel ? `Channel: ${ytChannel.title}, style: ${ytChannel.description?.substring(0, 200)}` : '';
      const data = await synthesizeScript(notebookText, niche, channelContext);
      if (data?.script) {
        setSynthesizedScript({
          hook: data.script.hook || '',
          body: data.script.body || '',
          captions: Array.isArray(data.script.captions) ? data.script.captions : [],
          music: data.script.music || null,
        });
      }
    } catch (err) {
      showError('Synthesis failed. Try again.');
    }
    setIsSynthesizing(false);
  };

  const handleTranslate = async (langCode) => {
    if (!synthesizedScript || !langCode) return;
    setSelectedLang(langCode);
    setIsTranslating(true);
    try {
      const data = await translateScript(synthesizedScript, langCode);
      if (data?.script) {
        setTranslatedScript(data.script);
      }
    } catch (err) {
      showError('Translation failed. Try again.');
    }
    setIsTranslating(false);
  };

  const handleListen = async (script) => {
    if (isPlaying && audioRef) {
      audioRef.pause();
      setIsPlaying(false);
      return;
    }
    try {
      const fullText = `${script.hook}. ${script.body}`;
      const data = await synthesizeSpeech(fullText, 'Kajal');
      if (data?.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setAudioRef(audio);
        setIsPlaying(true);
      }
    } catch (err) {
      showError('Audio generation failed.');
    }
  };

  const sendToStudio = () => {
    if (roadmap.length > 0 && synthesizedScript) {
      const nr = [...roadmap];
      nr[0] = { ...nr[0], script: synthesizedScript };
      setRoadmap(nr);
      setSelectedDay(nr[0]);
      navigate('/studio');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-[#0a0a0b] rounded-2xl border border-white/[0.04] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Brain size={18} className="text-blue-400" />
          <div>
            <h3 className="text-[14px] font-bold">Neural Notebook</h3>
            <p className="text-[10px] text-zinc-600">Raw thoughts → Viral scripts · Powered by The Algorithm</p>
          </div>
        </div>

        <textarea
          value={notebookText}
          onChange={(e) => setNotebookText(e.target.value)}
          placeholder={`Dump raw thoughts...\n\ne.g. "want to make a video about why ${niche || 'this topic'} is changing, saw a tweet about new tools..."`}
          className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3.5 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-blue-500/30 transition-all min-h-[180px] resize-y leading-relaxed mb-4"
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/[0.04] text-[10px] text-zinc-500">
            <Target size={10} className="text-blue-400" /> {niche || 'No niche set'}
          </span>
          {ytConnected && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/[0.04] text-[10px] text-green-400">
              <CheckCircle2 size={10} /> YouTube linked
            </span>
          )}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-lg border border-orange-500/20 text-[10px] text-orange-400">
            🤖 AWS Bedrock
          </span>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={!notebookText.trim() || isSynthesizing}
          className="w-full bg-blue-600 py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSynthesizing ? <><RefreshCw className="animate-spin" size={14} /> Synthesizing...</> : <><Sparkles size={14} /> Synthesize Script</>}
        </button>
      </div>

      {synthesizedScript && (
        <div className="bg-[#0a0a0b] rounded-2xl border border-blue-500/20 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">Synthesized</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Listen Button */}
              <button
                onClick={() => handleListen(synthesizedScript)}
                className="text-[11px] text-purple-400 font-semibold flex items-center gap-1 hover:underline"
              >
                {isPlaying ? <><VolumeX size={12} /> Stop</> : <><Volume2 size={12} /> Listen</>}
              </button>
              <button onClick={sendToStudio} className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 hover:underline">
                Send to Studio <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1 block">Hook</label>
            <p className="text-xl font-bold">{synthesizedScript.hook}</p>
          </div>

          <div className="mb-5">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Script</label>
            <p className="text-zinc-300 text-[15px] leading-relaxed">{synthesizedScript.body}</p>
          </div>

          <div className="mb-5">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Captions</label>
            <div className="flex flex-wrap gap-2">
              {synthesizedScript.captions?.map((cap, i) => (
                <span key={i} className="bg-yellow-400 text-black px-3 py-1 text-[11px] font-black uppercase italic transform -rotate-1 skew-x-2 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] border border-black">
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {synthesizedScript.music && (
            <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.04] flex items-center gap-3 mb-5">
              <Music size={16} className="text-purple-400" />
              <div>
                <p className="text-[12px] font-semibold">{synthesizedScript.music.genre} · {synthesizedScript.music.bpm} BPM</p>
                <p className="text-[10px] text-zinc-600">Mood: {synthesizedScript.music.mood}</p>
              </div>
            </div>
          )}

          {/* Translate Section */}
          <div className="border-t border-white/[0.04] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe2 size={14} className="text-green-400" />
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Translate Script</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  disabled={isTranslating}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${selectedLang === lang.code ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:bg-white/[0.05]'}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            {isTranslating && (
              <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-500">
                <RefreshCw className="animate-spin" size={12} /> Translating via AWS Translate...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Translated Script */}
      {translatedScript && (
        <div className="bg-[#0a0a0b] rounded-2xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Globe2 size={14} className="text-green-400" />
              <span className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">
                {LANGUAGES.find(l => l.code === selectedLang)?.name || 'Translated'}
              </span>
            </div>
            <button
              onClick={() => handleListen(translatedScript)}
              className="text-[11px] text-purple-400 font-semibold flex items-center gap-1 hover:underline"
            >
              <Volume2 size={12} /> Listen
            </button>
          </div>
          <div className="mb-4">
            <label className="text-[10px] text-green-400 font-semibold uppercase tracking-wider mb-1 block">Hook</label>
            <p className="text-lg font-bold">{translatedScript.hook}</p>
          </div>
          <div className="mb-4">
            <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Script</label>
            <p className="text-zinc-300 text-[14px] leading-relaxed">{translatedScript.body}</p>
          </div>
          {translatedScript.captions && (
            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2 block">Captions</label>
              <div className="flex flex-wrap gap-2">
                {translatedScript.captions.map((cap, i) => (
                  <span key={i} className="bg-green-400 text-black px-3 py-1 text-[11px] font-black uppercase italic transform -rotate-1 skew-x-2 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] border border-black">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
