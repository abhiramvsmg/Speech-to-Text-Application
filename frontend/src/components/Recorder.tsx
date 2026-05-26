'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Pause, Play, AlertCircle, Loader2 } from 'lucide-react';
import { api, TranscriptRecord } from '@/lib/api';

// Native browser SpeechRecognition declaration helper
const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

interface RecorderProps {
  onTranscriptionComplete: (record: TranscriptRecord) => void;
  onStreamChange: (stream: MediaStream | null) => void;
}

export default function Recorder({ onTranscriptionComplete, onStreamChange }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up recording stream, timer, and recognition on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onStreamChange(null);
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setLiveTranscript('');
    
    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      onStreamChange(stream);

      // Determine ideal mimeType for browser recordings
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
      }
      if (!MediaRecorder.isTypeSupported('audio/ogg')) {
        // Fallback to default
        (options as any) = undefined;
      }

      // 2. Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        cleanupStream();
        await uploadAudio(audioBlob);
      };

      // 3. Initialize native interim SpeechRecognition for zero-latency feedback
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          const lang = localStorage.getItem('language') || 'en-US';
          recognition.lang = lang;

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const liveText = finalTranscript || interimTranscript;
            if (liveText.trim()) {
              setLiveTranscript(liveText);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('[Live STT Error]:', e);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (recognitionErr) {
          console.warn('[Live Speech] Failed to start native recognizer:', recognitionErr);
        }
      }

      mediaRecorder.start(250); // Collect data every 250ms for chunk efficiency
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      startTimer();
      
    } catch (err: any) {
      console.error('[Recorder] Error accessing microphone:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please enable mic permissions in your browser bar.'
          : 'Could not connect to microphone. Verify audio inputs are active.'
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();

      // Pause live speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();

      // Resume live speech recognition with new session
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          const lang = localStorage.getItem('language') || 'en-US';
          recognition.lang = lang;

          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const liveText = finalTranscript || interimTranscript;
            if (liveText.trim()) {
              setLiveTranscript(liveText);
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {}
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();

      // Terminate live speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    setError(null);

    try {
      // Load runtime settings from LocalStorage
      const engine = localStorage.getItem('sttEngine') || 'local';
      const key = localStorage.getItem('sttKey') || '';
      const language = localStorage.getItem('language') || 'en-US';

      // Convert blob into file payload
      const extension = blob.type.includes('webm') ? 'webm' : blob.type.includes('ogg') ? 'ogg' : 'wav';
      const file = new File([blob], `mic_voice.${extension}`, { type: blob.type });

      // Trigger server REST transcription
      const record = await api.transcribe(file, engine, key, language);
      onTranscriptionComplete(record);
      setLiveTranscript(''); // clear live stream tray upon success
      
    } catch (err: any) {
      console.error('[Recorder] Upload/Transcription error:', err);
      setError(err.message || 'Server connection failed. Could not process voice transcription.');
    } finally {
      setIsUploading(false);
    }
  };

  // Convert duration into MM:SS format
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-4">
      {/* Visual Status Indicator Panel */}
      <div className="flex items-center justify-between p-3.5 glass-panel border-white/5 bg-white/[0.02]">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            {isRecording && !isPaused && <div className="recording-ring" />}
            <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-500 ${
              isRecording
                ? isPaused 
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-pink-500 shadow-[0_0_12px_2px_#ec4899]'
                : 'bg-gray-600'
            }`} />
          </div>
          <span className="text-xs font-semibold tracking-wide text-gray-300 uppercase">
            {isUploading 
              ? 'Analyzing Speech...' 
              : isRecording 
                ? isPaused ? 'Recording Paused' : 'Recording Voice' 
                : 'System Ready'}
          </span>
        </div>
        <span className="text-sm font-mono font-bold text-white tabular-nums bg-black/40 px-2.5 py-1 rounded border border-white/5 shadow-inner">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Trigger Console */}
      <div className="flex items-center justify-center py-2">
        {!isRecording ? (
          <div className="relative group p-4">
            {/* Ambient neon backdrop blur */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 blur-xl opacity-35 group-hover:opacity-55 transition-opacity" />
            
            <button
              onClick={startRecording}
              disabled={isUploading}
              className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all bg-gradient-to-b from-[#1c1a2e] to-[#0a0812] border border-violet-500/30 text-white hover:border-violet-500/60 shadow-[0_10px_20px_rgba(0,0,0,0.5),_inset_0_2px_3px_rgba(255,255,255,0.1)] active:scale-95 group overflow-hidden cursor-pointer"
            >
              {/* Inner glowing core with 3D inset shadow */}
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Mic className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-115" />
              </div>
              
              {/* Physical button shine reflection */}
              <div className="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-8">
            {/* Pause/Resume button */}
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="w-13 h-13 rounded-full flex items-center justify-center bg-gradient-to-b from-[#2e2a1a] to-[#141208] border border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_2px_2px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Resume recording"
              >
                <Play className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="w-13 h-13 rounded-full flex items-center justify-center bg-gradient-to-b from-[#1c1a2e] to-[#0a0812] border border-violet-500/25 text-gray-300 hover:text-white hover:border-violet-500/50 shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_2px_2px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Pause recording"
              >
                <Pause className="w-5 h-5" />
              </button>
            )}

            {/* Stop and compile button */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-pink-500 blur-lg opacity-40 animate-pulse" />
              <button
                onClick={stopRecording}
                className="relative w-18 h-18 rounded-full flex items-center justify-center bg-gradient-to-b from-[#2e0f1d] to-[#0f0308] border border-pink-500/40 text-pink-400 hover:text-pink-300 hover:border-pink-500/70 shadow-[0_10px_20px_rgba(0,0,0,0.5),_inset_0_2px_3px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all group overflow-hidden cursor-pointer"
                title="Stop recording & transcribe"
              >
                <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-pink-600 to-rose-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)] flex items-center justify-center">
                  <Square className="w-5 h-5 text-white fill-white transition-transform group-hover:scale-90" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcript Capture Feed tray */}
      {isRecording && liveTranscript && (
        <div className="p-3 bg-[#08060f]/60 border border-violet-500/10 rounded-xl relative overflow-hidden animate-fade-in shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500" />
          <div className="flex items-center space-x-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span className="text-[9px] font-bold tracking-wider text-violet-400 uppercase">Live Speech Feed</span>
          </div>
          <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic">
            "{liveTranscript}"
          </p>
        </div>
      )}

      {/* Upload loader overlay */}
      {isUploading && (
        <div className="flex items-center justify-center space-x-2 py-1 text-violet-400 animate-pulse text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Encoding audio stream & compiling transcription...</span>
        </div>
      )}

      {/* Error alert Banner */}
      {error && (
        <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg flex items-start space-x-2 text-xs text-pink-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
