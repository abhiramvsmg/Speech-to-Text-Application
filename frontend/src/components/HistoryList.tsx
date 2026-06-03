'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Calendar, Clock, Sparkles, 
  Play, Pause, FileCheck2, Volume2, Database, AlertCircle 
} from 'lucide-react';
import { api, TranscriptRecord } from '@/lib/api';
import Tilt3D from './Tilt3D';

interface HistoryListProps {
  transcripts: TranscriptRecord[];
  selectedId: string | null;
  onSelect: (record: TranscriptRecord) => void;
  onDelete?: (id: string) => void;
  onAudioPlayChange: (element: HTMLAudioElement | null, isPlaying: boolean) => void;
}

export default function HistoryList({
  transcripts,
  selectedId,
  onSelect,
  onDelete,
  onAudioPlayChange,
}: HistoryListProps) {
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
    onAudioPlayChange(null, false);
  }, [onAudioPlayChange]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const handlePlayToggle = (e: React.MouseEvent, record: TranscriptRecord) => {
    e.stopPropagation(); // Avoid selecting the card
    
    if (!record.audio_filename) {
      alert("No audio file is available for this recording.");
      return;
    }

    const audioUrl = api.getAudioUrl(record.audio_filename);

    if (playingId === record.id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      onAudioPlayChange(audioRef.current, false);
    } else {
      // Stop existing first
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Play new
      const newAudio = new Audio(audioUrl);
      newAudio.crossOrigin = "anonymous"; // Essential to avoid Canvas Web Audio API CORS block
      audioRef.current = newAudio;
      setPlayingId(record.id);

      newAudio.play().catch(err => {
        console.error("Audio playback blocked/failed:", err);
        setPlayingId(null);
        onAudioPlayChange(null, false);
      });

      onAudioPlayChange(newAudio, true);

      newAudio.onended = () => {
        setPlayingId(null);
        onAudioPlayChange(null, false);
      };
    }
  };

  // Filter transcripts by search keyword
  const filtered = transcripts.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.text.toLowerCase().includes(search.toLowerCase())
  );

  // Compute summary stats
  const totalDuration = transcripts.reduce((acc, curr) => acc + curr.duration, 0);
  const aiStatsCount = transcripts.filter(t => t.summary || t.action_items).length;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input
          type="text"
          id="history-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs or keywords..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-black/40 border border-white/5 focus:border-violet-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-3 gap-2.5 stats-glow p-3.5 glass-panel border-white/5 bg-white/[0.01]">
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] tracking-wider text-gray-500 font-semibold uppercase">Total Logs</span>
          <span className="text-sm font-bold text-white tabular-nums">{transcripts.length}</span>
        </div>
        <div className="flex flex-col space-y-1 border-l border-white/5 pl-3">
          <span className="text-[10px] tracking-wider text-gray-500 font-semibold uppercase">Total Length</span>
          <span className="text-xs font-bold text-white truncate tabular-nums">{formatDuration(totalDuration)}</span>
        </div>
        <div className="flex flex-col space-y-1 border-l border-white/5 pl-3">
          <span className="text-[10px] tracking-wider text-gray-500 font-semibold uppercase">AI Insights</span>
          <span className="text-sm font-bold text-pink-400 tabular-nums">{aiStatsCount}</span>
        </div>
      </div>

      {/* Scrollable Records cabinet */}
      <div className="flex-1 overflow-y-auto max-h-[50vh] md:max-h-[60vh] space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-gray-600" />
            <p className="text-xs text-gray-500">
              {search ? 'No matching logs located.' : 'History is empty. Record your first clip!'}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedId === item.id;
            const isPlaying = playingId === item.id;

          return (
            <Tilt3D key={item.id} intensity={4} className="w-full">
              <div
                id={`history-item-${item.id}`}
                onClick={() => onSelect(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-violet-500/40 bg-gradient-to-r from-violet-600/[0.07] to-transparent shadow-[0_6px_20px_-3px_rgba(139,92,246,0.18)] translate-y-[-2px]'
                    : 'border-white/5 bg-white/[0.01] hover:border-white/12 hover:bg-white/[0.03] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
              >
                {/* Visual hover border glow accent */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-r transition-all duration-300 ${
                  isSelected 
                    ? 'bg-gradient-to-b from-violet-500 to-pink-500 scale-y-100' 
                    : 'bg-transparent scale-y-0 group-hover:scale-y-100 group-hover:bg-white/20'
                }`} />

                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-xs font-bold truncate transition-colors flex-1 ${
                        isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {item.title}
                      </h4>
                      {/* Active Playback Equalizer Wave Indicator */}
                      {isPlaying && (
                        <div className="flex items-end space-x-0.5 h-3 flex-shrink-0">
                          <span className="w-0.5 bg-pink-500 rounded-full h-full animate-[wave_0.8s_infinite] origin-bottom" style={{ animationDelay: '0.1s' }} />
                          <span className="w-0.5 bg-violet-500 rounded-full h-2/3 animate-[wave_0.5s_infinite] origin-bottom" style={{ animationDelay: '0.3s' }} />
                          <span className="w-0.5 bg-pink-500 rounded-full h-full animate-[wave_0.7s_infinite] origin-bottom" style={{ animationDelay: '0.5s' }} />
                        </div>
                      )}
                    </div>

                    {/* Metadata tags line */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="tabular-nums">{item.duration.toFixed(1)}s</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                      </span>
                    </div>

                    {/* AI & Audio attachment mini badges */}
                    <div className="flex items-center space-x-2 pt-1">
                      {item.audio_filename && (
                        <span className="flex items-center space-x-0.5 text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/10 py-0.5 px-1.5 rounded font-semibold">
                          <Volume2 className="w-2 h-2" />
                          <span>WAV</span>
                        </span>
                      )}
                      {item.summary && (
                        <span className="flex items-center space-x-0.5 text-[8px] bg-pink-500/10 text-pink-400 border border-pink-500/10 py-0.5 px-1.5 rounded font-semibold">
                          <Sparkles className="w-2 h-2" />
                          <span>Summary</span>
                        </span>
                      )}
                      {item.action_items && (
                        <span className="flex items-center space-x-0.5 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 py-0.5 px-1.5 rounded font-semibold">
                          <FileCheck2 className="w-2 h-2" />
                          <span>Tasks</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Playback Trigger widget */}
                  {item.audio_filename && (
                    <button
                      id={`history-play-btn-${item.id}`}
                      onClick={(e) => handlePlayToggle(e, item)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        isPlaying 
                          ? 'bg-pink-500/25 border-pink-500/50 text-pink-400 shadow-[0_0_8px_0_rgba(236,72,153,0.25)] animate-pulse'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10 hover:bg-white/10'
                      }`}
                      title={isPlaying ? "Pause audio stream" : "Play back recorded audio"}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                  )}
                </div>
              </div>
            </Tilt3D>
          );
        })
        )}
      </div>

      {/* DB Connection footer indicator */}
      <div className="flex items-center justify-center space-x-1.5 py-1 text-[10px] text-gray-500 border-t border-white/5">
        <Database className="w-3 h-3 text-violet-500" />
        <span>Connected to local SQLite container cache</span>
      </div>
    </div>
  );
}
