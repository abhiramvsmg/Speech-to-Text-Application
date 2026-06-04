'use client';

import React, { useState, useEffect } from 'react';
import { api, TranscriptRecord } from '@/lib/api';
import SettingsModal from '@/components/SettingsModal';
import AudioVisualizer from '@/components/AudioVisualizer';
import Recorder from '@/components/Recorder';
import TranscriptViewer from '@/components/TranscriptViewer';
import HistoryList from '@/components/HistoryList';
import Tilt3D from '@/components/Tilt3D';
import { 
  Volume2, Sparkles, History, HelpCircle, Settings, User, 
  ShieldCheck, Wifi, WifiOff, LayoutDashboard, Sliders, Database, Menu, Terminal
} from 'lucide-react';
import AmbientKineticBackground from '@/components/AmbientKineticBackground';

export default function Page() {
  // Application Data States
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptRecord | null>(null);

  // Audio & Visualizer States
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('visualizerStyle') || 'sine';
    }
    return 'sine';
  });

  // Interface Toggle States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const loadVisualizerPreference = () => {
    if (typeof window !== 'undefined') {
      setVisualizerStyle(localStorage.getItem('visualizerStyle') || 'sine');
    }
  };

  const loadThemePreference = () => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme') || 'holographic-light';
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  // 1. Initial Data Fetch & Preference Load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const records = await api.listTranscripts();
        setTranscripts(records);
        if (records.length > 0) {
          setSelectedTranscript(records[0]);
        }
      } catch (err) {
        console.error("Failed to load historical transcription logs:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    loadThemePreference();

    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('mockUser'));
    }

    // Health check check
    const checkConnection = async () => {
      const isOnline = await api.checkHealth();
      setIsServerOnline(isOnline);
    };
    checkConnection();
    const connectionInterval = setInterval(checkConnection, 10000);

    // Listen for setting changes
    const handleSettingsUpdate = () => {
      loadVisualizerPreference();
      loadThemePreference();
    };

    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
      clearInterval(connectionInterval);
    };
  }, []);

  // 2. Stream and Playback triggers
  const handleStreamChange = (stream: MediaStream | null) => {
    setActiveStream(stream);
    setIsRecording(stream !== null);
  };

  const handleAudioPlayChange = (element: HTMLAudioElement | null, playing: boolean) => {
    setActiveAudioElement(element);
    setIsPlaying(playing);
  };

  // 3. Document mutation callbacks
  const handleTranscriptionComplete = (record: TranscriptRecord) => {
    setTranscripts(prev => [record, ...prev]);
    setSelectedTranscript(record);
  };

  const handleUpdateTranscript = (updated: TranscriptRecord) => {
    setTranscripts(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selectedTranscript && selectedTranscript.id === updated.id) {
      setSelectedTranscript(updated);
    }
  };

  const handleDeleteTranscript = async (id: string) => {
    const ok = await api.deleteTranscript(id);
    if (ok) {
      setTranscripts(prev => prev.filter(t => t.id !== id));
      if (selectedTranscript && selectedTranscript.id === id) {
        setSelectedTranscript(null);
      }
    } else {
      alert("Failed to delete the selected log.");
    }
  };

  const handleToggleUser = () => {
    if (currentUser) {
      localStorage.removeItem('mockUser');
      setCurrentUser(null);
    } else {
      const user = 'Abhir';
      localStorage.setItem('mockUser', user);
      setCurrentUser(user);
    }
  };

  return (
    <>
      <AmbientKineticBackground />
      <div className="min-h-screen flex text-foreground bg-transparent transition-all duration-500 overflow-hidden font-sans">
        
        {/* Left Side: Vertical Holographic Navigation Strip */}
        <aside className="w-16 md:w-20 bg-black/45 glass-panel border-r border-white/5 flex flex-col items-center justify-between py-6 flex-shrink-0 z-40 transition-all duration-300 print:hidden m-3 rounded-2xl">
          {/* Logo Action Item */}
          <div className="flex flex-col items-center space-y-1 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-[8px] font-bold text-gray-500 tracking-widest uppercase mt-1">AURA</span>
          </div>

          {/* Navigation Action Buttons Group */}
          <nav className="flex flex-col items-center space-y-5">
            {/* Dashboard Icon */}
            <button
              id="sidebar-dashboard-btn"
              onClick={() => {
                const element = document.getElementById('audio-visualizer-card');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 hover:border-violet-500/30 text-gray-400 hover:text-white transition-all cursor-pointer hover:scale-105"
              title="Dashboard Workspace"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            {/* Profile account switch */}
            <button
              id="sidebar-profile-btn"
              onClick={handleToggleUser}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer hover:scale-105 ${
                currentUser
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
              title={currentUser ? `Logged in as ${currentUser}` : 'Log in guest profile'}
            >
              {currentUser ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </button>

            {/* History panel visibility toggle */}
            <button
              id="sidebar-history-toggle-btn"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer hover:scale-105 ${
                isHistoryOpen
                  ? 'bg-pink-600/10 border-pink-500/30 text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.2)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
              title="Toggle Cabinet Archives"
            >
              <History className="w-5 h-5" />
            </button>

            {/* Engine configuration details */}
            <button
              id="sidebar-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 hover:border-violet-500/30 text-gray-400 hover:text-white transition-all cursor-pointer hover:scale-105"
              title="Systems Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>

          {/* Bottom Actions status & details */}
          <div className="flex flex-col items-center space-y-4">
            {/* Backend connection status */}
            <div 
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isServerOnline
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
              }`}
              title={isServerOnline ? 'Local Flask engine is online' : 'Local Flask engine is offline'}
            >
              {isServerOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 animate-pulse" />}
            </div>
          </div>
        </aside>

        {/* Center Canvas Area: Command Workspace */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative p-4 md:p-6 space-y-6">
          
          {/* Top Status and Metadata Tracker */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 print:hidden gap-3">
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                <span>AURA</span>
                <span className="text-xs bg-gradient-to-r from-violet-500 to-pink-500 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                  Suite Console
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase font-semibold">Global AI Transcription Workspace</p>
            </div>

            {/* Micro details indicator panels */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-gray-400">
                <Terminal className="w-3 h-3 text-violet-400" />
                <span>Audio Stream: <strong className="text-white">44.1 kHz PCM</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-gray-400">
                <Database className="w-3 h-3 text-pink-400" />
                <span>Ledger Connection: <strong className="text-white">SQLite Cloud Cache</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-gray-400">
                <Sliders className="w-3 h-3 text-sky-400" />
                <span>AI Core Status: <strong className="text-white">Heuristic Active</strong></span>
              </div>
            </div>
          </header>

          {/* Main workspace splits and structures */}
          <div className="flex items-stretch flex-1 gap-6 min-h-0 relative">
            
            {/* Center Workbench Stage */}
            <div className="flex-1 flex flex-col space-y-6 min-w-0 transition-all duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Visualizer Canvas Deck */}
                <section id="audio-visualizer-card" className="lg:col-span-6 flex flex-col">
                  <Tilt3D className="flex-1 flex flex-col min-h-[260px]">
                    <div className="glass-panel border-white/5 p-5 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-white/[0.01] to-[#8b5cf6]/[0.02]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                        <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5">
                          <Volume2 className="w-4 h-4 text-violet-400" />
                          <span>AURA Spectrometer Network</span>
                        </h2>
                        
                        {/* Interactive Spectrometer Style Toggles */}
                        <div className="flex items-center flex-wrap gap-1 print:hidden bg-black/40 p-0.5 border border-white/5 rounded-lg select-none">
                          {[
                            { id: 'sine', label: 'Sine' },
                            { id: 'bars', label: 'Bars' },
                            { id: 'circle', label: 'Ring' },
                            { id: '3d-spectrogram', label: '3D Terrain' },
                            { id: '3d-particle-orbit', label: '3D Orbit' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setVisualizerStyle(item.id);
                                localStorage.setItem('visualizerStyle', item.id);
                              }}
                              className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                                visualizerStyle === item.id 
                                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                              title={`Switch to ${item.label}`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Audio visualizer canvas */}
                      <div className="flex-1 w-full relative min-h-[180px]">
                        <AudioVisualizer
                          stream={activeStream}
                          audioElement={activeAudioElement}
                          style={visualizerStyle}
                          isRecording={isRecording}
                          isPlaying={isPlaying}
                        />
                      </div>
                    </div>
                  </Tilt3D>
                </section>

                {/* Voice capture core orb control deck */}
                <section className="lg:col-span-6 flex flex-col">
                  <Tilt3D className="h-full">
                    <div className="glass-panel border-white/5 p-5 bg-gradient-to-br from-white/[0.01] to-[#ec4899]/[0.02] h-full relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="mb-4">
                        <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4 text-pink-400" />
                          <span>Linguistic Voice Capture Terminal</span>
                        </h2>
                      </div>
                      
                      {/* Recorder component block */}
                      <div className="flex-1">
                        <Recorder
                          onStreamChange={handleStreamChange}
                          onTranscriptionComplete={handleTranscriptionComplete}
                        />
                      </div>
                    </div>
                  </Tilt3D>
                </section>
              </div>

              {/* Main Transcript Viewer Pane */}
              <section className="flex-1 flex flex-col">
                <Tilt3D className="h-full">
                  <TranscriptViewer
                    record={selectedTranscript}
                    onUpdate={handleUpdateTranscript}
                    onDelete={handleDeleteTranscript}
                  />
                </Tilt3D>
              </section>

            </div>

            {/* Collapsible History Drawer on the right side */}
            {isHistoryOpen && (
              <aside 
                className="w-80 lg:w-96 flex-shrink-0 flex flex-col h-full animate-drawer-slide print:hidden z-30"
                style={{
                  transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Tilt3D className="h-full">
                  <div className="glass-panel border-white/5 p-5 flex flex-col h-full bg-gradient-to-b from-[#0e0c1a]/95 to-[#050409]/95 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <h2 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5">
                        <History className="w-4 h-4 text-pink-400" />
                        <span>Voice Archive Ledger</span>
                      </h2>
                      <button
                        id="history-close-btn"
                        onClick={() => setIsHistoryOpen(false)}
                        className="text-[9px] font-bold text-gray-500 hover:text-white uppercase tracking-wider px-2 py-0.5 border border-white/5 rounded hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Hide Panel
                      </button>
                    </div>
                    
                    {/* Render listings */}
                    {isLoadingHistory ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
                        <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                        <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Mounting cabinets...</span>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0">
                        <HistoryList
                          transcripts={transcripts}
                          selectedId={selectedTranscript?.id || null}
                          onSelect={setSelectedTranscript}
                          onDelete={handleDeleteTranscript}
                          onAudioPlayChange={handleAudioPlayChange}
                        />
                      </div>
                    )}
                  </div>
                </Tilt3D>
              </aside>
            )}

          </div>

          {/* Quick instructions footer status bar */}
          <footer className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 gap-2 border-t border-white/5 pt-4 print:hidden select-none">
            <div className="flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
              <span>Aesthetic Guide: Access color engine overrides inside systems configurations to shift themes to holographic light/dark.</span>
            </div>
            <span>AURA © 2026. Made with ❤️ for high-performance audio synthesis.</span>
          </footer>

          {/* System Settings configuration modal */}
          {isSettingsOpen && (
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </main>
      </div>
    </>
  );
}
