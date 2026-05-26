'use client';

import React, { useState, useEffect } from 'react';
import { api, TranscriptRecord } from '@/lib/api';
import Header from '@/components/Header';
import SettingsModal from '@/components/SettingsModal';
import AudioVisualizer from '@/components/AudioVisualizer';
import Recorder from '@/components/Recorder';
import TranscriptViewer from '@/components/TranscriptViewer';
import HistoryList from '@/components/HistoryList';
import Tilt3D from '@/components/Tilt3D';
import { Volume2, Sparkles, History, HelpCircle } from 'lucide-react';

export default function Page() {
  // Application Data States
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptRecord | null>(null);

  // Audio & Visualizer States
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState('sine');

  // Interface Toggle States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

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
    loadVisualizerPreference();

    // Listen for setting changes
    const handleSettingsUpdate = () => {
      loadVisualizerPreference();
    };

    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  const loadVisualizerPreference = () => {
    if (typeof window !== 'undefined') {
      setVisualizerStyle(localStorage.getItem('visualizerStyle') || 'sine');
    }
  };

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

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto flex flex-col space-y-6">
      
      {/* Navbar header section */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Primary Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* Left Side: Wave visualizer + Recorder Control */}
        <div className="lg:col-span-4 flex flex-col space-y-6 print:hidden">
          
          {/* Audio Visualizer Card */}
          <Tilt3D className="flex-1 flex flex-col min-h-[220px]">
            <div className="glass-panel border-white/5 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-violet-400" />
                  <span>Audio Spectrogram</span>
                </h3>
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 capitalize">
                  {visualizerStyle === 'sine' ? 'Sine' : visualizerStyle === 'bars' ? 'Frequency' : visualizerStyle === 'circle' ? 'Pulsing Ring' : '3D Spectrogram'}
                </span>
              </div>
              
              {/* Visualizer canvas holder */}
              <div className="flex-1 w-full relative min-h-[150px]">
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

          {/* Voice recording controls card */}
          <Tilt3D>
            <div className="glass-panel border-white/5 p-4 bg-gradient-to-br from-white/[0.01] to-[#8b5cf6]/[0.02] h-full">
              <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Voice Capture Terminal</span>
              </h3>
              <Recorder
                onStreamChange={handleStreamChange}
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            </div>
          </Tilt3D>
        </div>

        {/* Center Panel: Main Transcription and AI Viewer */}
        <div className="lg:col-span-5 flex flex-col">
          <Tilt3D className="h-full">
            <TranscriptViewer
              record={selectedTranscript}
              onUpdate={handleUpdateTranscript}
              onDelete={handleDeleteTranscript}
            />
          </Tilt3D>
        </div>

        {/* Right Panel: Historical Archive Cabinet */}
        <div className="lg:col-span-3 flex flex-col print:hidden">
          <Tilt3D className="h-full">
            <div className="glass-panel border-white/5 p-4 flex flex-col h-full">
              <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase flex items-center space-x-1.5 mb-3.5 border-b border-white/5 pb-2.5">
                <History className="w-4 h-4 text-violet-400" />
                <span>Voice Log Archives</span>
              </h3>
              
              {isLoadingHistory ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                  <span className="text-[10px] text-gray-500 font-medium">Mounting cabinets...</span>
                </div>
              ) : (
                <HistoryList
                  transcripts={transcripts}
                  selectedId={selectedTranscript?.id || null}
                  onSelect={setSelectedTranscript}
                  onDelete={handleDeleteTranscript}
                  onAudioPlayChange={handleAudioPlayChange}
                />
              )}
            </div>
          </Tilt3D>
        </div>

      </div>

      {/* Floating System Help tooltip tray */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 gap-2 border-t border-white/5 pt-4 print:hidden">
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
          <span>Quick tips: Use Settings modal to input your API keys for advanced transcription models.</span>
        </div>
        <span>AURA © 2026. Made with ❤️ for high-performance audio synthesis.</span>
      </footer>

      {/* System Settings configuration modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
