'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  X, Key, Settings, Sliders, Volume2, Sparkles, 
  Database, HardDrive, CheckCircle2, AlertTriangle, Cpu, Palette 
} from 'lucide-react';
import { api } from '@/lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemStats {
  total_logs: number;
  pruned_logs: number;
  active_audio_logs: number;
  total_duration: number;
  audio_size_mb: number;
  db_size_kb: number;
  ffmpeg_installed: boolean;
  max_storage_mb: number;
  max_files: number;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [sttEngine, setSttEngine] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sttEngine') || 'local' : 'local'));
  const [sttKey, setSttKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sttKey') || '' : ''));
  const [aiProvider, setAiProvider] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('aiProvider') || 'gemini' : 'gemini'));
  const [aiKey, setAiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('aiKey') || '' : ''));
  const [language, setLanguage] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('language') || 'en-US' : 'en-US'));
  const [visualizerStyle, setVisualizerStyle] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('visualizerStyle') || 'sine' : 'sine'));
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') || 'aura-dark' : 'aura-dark'));
  
  // Stats state
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load server stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch stats when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchStats();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchStats]);

  const handleSave = () => {
    localStorage.setItem('sttEngine', sttEngine);
    localStorage.setItem('sttKey', sttKey);
    localStorage.setItem('aiProvider', aiProvider);
    localStorage.setItem('aiKey', aiKey);
    localStorage.setItem('language', language);
    localStorage.setItem('visualizerStyle', visualizerStyle);
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event to notify other components of preference updates
    window.dispatchEvent(new Event('settings-updated'));
    onClose();
  };

  if (!isOpen) return null;

  // Calculate storage usage percentage
  const storagePercent = stats ? Math.min(100, (stats.audio_size_mb / stats.max_storage_mb) * 100) : 0;
  const filesPercent = stats ? Math.min(100, (stats.active_audio_logs / stats.max_files) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-600/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">System Engine Hub</h2>
          </div>
          <button 
            id="settings-close-btn"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Section 1: Speech Engine */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Volume2 className="w-4 h-4" />
              <span>Speech Recognition Engine</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'local', name: 'Free (Google)' },
                { id: 'deepgram', name: 'Deepgram' },
                { id: 'deepinfra', name: 'DeepInfra' },
              ].map((engine) => (
                <button
                  key={engine.id}
                  id={`stt-engine-${engine.id}-btn`}
                  onClick={() => setSttEngine(engine.id)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                    sttEngine === engine.id
                      ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_10px_0_rgba(139,92,246,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {engine.name}
                </button>
              ))}
            </div>

            {sttEngine !== 'local' && (
              <div className="mt-2 space-y-1.5">
                <label className="text-xs text-gray-300 flex items-center space-x-1">
                  <Key className="w-3 h-3 text-pink-400" />
                  <span>{sttEngine === 'deepgram' ? 'Deepgram' : 'DeepInfra'} API Token</span>
                </label>
                <input
                  type="password"
                  id="settings-stt-key-input"
                  value={sttKey}
                  onChange={(e) => setSttKey(e.target.value)}
                  placeholder={`Paste your secret ${sttEngine} token...`}
                  className="w-full py-2 px-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 2: AI Settings */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Sparkles className="w-4 h-4" />
              <span>AI Smart Analytics</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gemini', name: 'Google Gemini' },
                { id: 'deepinfra', name: 'DeepInfra LLM' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  id={`ai-provider-${prov.id}-btn`}
                  onClick={() => setAiProvider(prov.id)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all text-center cursor-pointer ${
                    aiProvider === prov.id
                      ? 'border-pink-500 bg-pink-500/10 text-white shadow-[0_0_10px_0_rgba(236,72,153,0.15)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {prov.name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 flex items-center space-x-1">
                <Key className="w-3 h-3 text-pink-400" />
                <span>{aiProvider === 'gemini' ? 'Gemini' : 'DeepInfra'} API Key</span>
              </label>
              <input
                type="password"
                id="settings-ai-key-input"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="Paste key to activate advanced analytics... (Optional)"
                className="w-full py-2 px-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-pink-500 text-white transition-colors"
              />
              <p className="text-[10px] text-gray-500 italic">
                * If left blank, a powerful local Heuristic AI engine will run as fallback to showcase insights.
              </p>
            </div>
          </div>

          {/* Section 3: Language & Visuals */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Sliders className="w-4 h-4" />
              <span>Language, Visuals & Theme</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-300">Spoken Language</label>
                <select
                  id="settings-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-2 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors [&>option]:bg-[#12101f] [&>option]:text-white cursor-pointer"
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                  <option value="ja-JP">Japanese (Japan)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="zh-CN">Chinese (Mandarin)</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-300">Audio Visualizer</label>
                <select
                  id="settings-visualizer-select"
                  value={visualizerStyle}
                  onChange={(e) => setVisualizerStyle(e.target.value)}
                  className="w-full py-2 px-2 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors [&>option]:bg-[#12101f] [&>option]:text-white cursor-pointer"
                >
                  <option value="sine">Cyber Sine Wave</option>
                  <option value="bars">Neon Frequency Bars</option>
                  <option value="circle">Glow Pulsing Ring</option>
                  <option value="3d-spectrogram">3D Cascading Terrain</option>
                  <option value="3d-particle-orbit">3D Cyber Orbit Sphere</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-gray-300 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-400" />
                  <span>Color Aesthetic Style</span>
                </label>
                <select
                  id="settings-theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full py-2 px-2 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors [&>option]:bg-[#12101f] [&>option]:text-white cursor-pointer"
                >
                  <option value="aura-dark">🔮 Aura Dark (Space Violet & Magenta)</option>
                  <option value="holographic-light">💿 Holographic Light (Premium 3D Light Mode)</option>
                  <option value="matrix-cyber">🟢 Matrix Cyber (Retro Terminal Green)</option>
                  <option value="oceanic-glow">🔵 Oceanic Glow (Cyberpunk Cobalt & Cyan)</option>
                  <option value="volcanic-core">🌋 Volcanic Core (Dark Magma & Orange)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: System Storage & Diagnostics Dashboard */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Database className="w-4 h-4" />
              <span>Storage & Diagnostics Panel</span>
            </h3>

            {isLoadingStats ? (
              <div className="flex items-center justify-center space-x-2 py-4 text-xs text-gray-500">
                <div className="w-4 h-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                <span>Interrogating hardware...</span>
              </div>
            ) : stats ? (
              <div className="space-y-3.5 bg-black/30 border border-white/5 rounded-xl p-3.5 shadow-inner">
                {/* Visual storage indicators */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Space MB */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3 text-violet-400" />
                        <span>Disk Overhead</span>
                      </span>
                      <span className="font-semibold text-white">{stats.audio_size_mb.toFixed(2)} MB / {stats.max_storage_mb}.0 MB</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-pink-500 h-full transition-all duration-500"
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Files Count */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Database className="w-3 h-3 text-pink-400" />
                        <span>LRU Audio Active</span>
                      </span>
                      <span className="font-semibold text-white">{stats.active_audio_logs} / {stats.max_files} WAVs</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-violet-500 h-full transition-all duration-500"
                        style={{ width: `${filesPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5 text-[10px] text-gray-500 font-medium">
                  <div>
                    Database ledger: <strong className="text-gray-300 font-semibold">{stats.db_size_kb.toFixed(1)} KB</strong>
                  </div>
                  <div>
                    Pruned files: <strong className="text-gray-300 font-semibold">{stats.pruned_logs} recordings</strong>
                  </div>
                  
                  {/* FFmpeg Badge */}
                  <div className="col-span-2 flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                    <span className="flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5 text-violet-400" />
                      <span>Audio Compression (FFmpeg)</span>
                    </span>
                    {stats.ffmpeg_installed ? (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Enabled</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold" title="Audio scales to pure PCM WAV files. FFmpeg fallback active.">
                        <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                        <span>WAV Fallback</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-gray-500 py-2">
                Failed to interrogate diagnostics dashboard.
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
          <button
            id="settings-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold btn-neon-secondary rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="settings-apply-btn"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold btn-neon-primary rounded-lg cursor-pointer"
          >
            Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
