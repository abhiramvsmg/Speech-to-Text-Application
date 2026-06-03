'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Pause, Play, AlertCircle, Loader2 } from 'lucide-react';
import { api, TranscriptRecord } from '@/lib/api';

// Strict SpeechRecognition type definitions
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

type SpeechRecognitionType = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
};

// Cybernetic synthesized Web Audio SFX Engine
const playCyberSound = (type: 'click' | 'chime' | 'laser' | 'copilot') => {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } 
    else if (type === 'copilot') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
    else if (type === 'laser') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.18);
      
      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } 
    else if (type === 'chime') {
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    }
  } catch {
    console.warn("Audio Context sound effect failed");
  }
};

// Native browser SpeechRecognition declaration helper
const SpeechRecognition = typeof window !== 'undefined' && 
  ((window as typeof window & { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).SpeechRecognition || 
   (window as typeof window & { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition);

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
  const [inputMode, setInputMode] = useState<'mic' | 'text'>('mic');
  const [manualTextInput, setManualTextInput] = useState('');
  const [manualDuration, setManualDuration] = useState(30);

  // Recording References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);

  // WAV Capturing Audio Graph References
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmBuffersRef = useRef<Float32Array[]>([]);
  const pcmLengthRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onStreamChange(null);
    }
  }, [onStreamChange]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [stopTimer]);

  // Clean up recording stream, timer, and recognition on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      cleanupStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [stopTimer, cleanupStream]);

  const startRecording = async () => {
    setError(null);
    setLiveTranscript('');
    playCyberSound('laser');
    
    try {
      // 0. Secure Context Validation (HTTP on non-localhost gets blocked by browsers for recording)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Media Devices API is disabled in insecure contexts. If you are accessing via network IP, please use HTTPS or switch to 'http://localhost:3000'."
        );
      }

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      onStreamChange(stream);

      // 2. Initialize AudioContext and ScriptProcessor for direct 16-bit PCM WAV encoding
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      // Resume context if suspended (common browser security constraint)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // bufferSize = 4096, 1 input channel, 1 output channel
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      const source = audioCtx.createMediaStreamSource(stream);
      audioInputRef.current = source;

      // Reset buffers
      pcmBuffersRef.current = [];
      pcmLengthRef.current = 0;
      isPausedRef.current = false;

      processor.onaudioprocess = (e) => {
        if (isPausedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clone raw float PCM data to avoid garbage collection recycling
        pcmBuffersRef.current.push(new Float32Array(inputData));
        pcmLengthRef.current += inputData.length;
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // 3. Initialize native interim SpeechRecognition for zero-latency feedback
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          const lang = localStorage.getItem('language') || 'en-US';
          recognition.lang = lang;

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const liveText = (finalTranscript + interimTranscript).trim();
            if (liveText) {
              setLiveTranscript(liveText);
            }
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.warn('[Live STT Error]:', event);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (recognitionErr) {
          console.warn('[Live Speech] Failed to start native recognizer:', recognitionErr);
        }
      }

      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      startTimer();
      
    } catch (err: unknown) {
      console.error('[Recorder] Error accessing microphone:', err);
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : 'Could not connect to microphone. Verify audio inputs are active.';
      setError(
        errName === 'NotAllowedError'
          ? 'Microphone access denied. Please enable mic permissions in your browser bar.'
          : errMsg
      );
    }
  };

  const pauseRecording = () => {
    if (isRecording) {
      isPausedRef.current = true;
      setIsPaused(true);
      stopTimer();

      // Pause live speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  const resumeRecording = () => {
    if (isRecording) {
      isPausedRef.current = false;
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

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            const liveText = (finalTranscript + interimTranscript).trim();
            if (liveText) {
              setLiveTranscript(liveText);
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch {}
      }
    }
  };

  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;
      stopTimer();

      // Terminate live speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }

      // Collect data before closing the audio graph
      const buffers = pcmBuffersRef.current;
      const totalLength = pcmLengthRef.current;
      const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;

      // Disconnect and clean up nodes
      if (processorNodeRef.current) {
        try {
          processorNodeRef.current.disconnect();
        } catch {}
        processorNodeRef.current = null;
      }
      if (audioInputRef.current) {
        try {
          audioInputRef.current.disconnect();
        } catch {}
        audioInputRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }

      cleanupStream();

      // Encode captured PCM float arrays into a high-fidelity 16-bit Mono WAV blob
      const wavBlob = encodeWAV(buffers, totalLength, sampleRate);
      uploadAudio(wavBlob);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    setError(null);

    // Save configuration settings
    const engine = localStorage.getItem('sttEngine') || 'local';
    const key = localStorage.getItem('sttKey') || '';
    const language = localStorage.getItem('language') || 'en-US';

    try {
      // Convert blob into file payload - since we encode as WAV in client, it's always WAV!
      const file = new File([blob], `mic_voice.wav`, { type: 'audio/wav' });

      // Trigger server REST transcription
      const record = await api.transcribe(file, engine, key, language);
      onTranscriptionComplete(record);
      playCyberSound('chime');
      setLiveTranscript(''); // clear live stream tray upon success
      
    } catch (err: unknown) {
      console.error('[Recorder] Upload/Transcription error:', err);
      
      // High-Fidelity Browser-native SpeechRecognition fallback
      if (liveTranscript && liveTranscript.trim()) {
        try {
          const fallbackRecord = await api.saveRawTranscript({
            text: liveTranscript,
            duration: duration,
            language: language,
            stt_engine: engine,
            stt_key: key
          });
          onTranscriptionComplete(fallbackRecord);
          playCyberSound('chime');
          setError("⚠️ Server audio transcription failed. Saved high-fidelity local browser-native transcription successfully!");
          setLiveTranscript('');
          return;
        } catch (fallbackErr) {
          console.error('[Recorder] SpeechRecognition fallback save failed:', fallbackErr);
        }
      }
      
      const errMsg = err instanceof Error ? err.message : 'Server connection failed. Could not process voice transcription.';
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveManualText = async () => {
    if (!manualTextInput.trim()) {
      setError('Please type or paste some text first.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const engine = localStorage.getItem('sttEngine') || 'local';
      const key = localStorage.getItem('sttKey') || '';
      const language = localStorage.getItem('language') || 'en-US';
      
      const record = await api.saveRawTranscript({
        text: manualTextInput,
        duration: manualDuration,
        language: language,
        stt_engine: engine,
        stt_key: key
      });
      onTranscriptionComplete(record);
      playCyberSound('chime');
      setManualTextInput('');
      setError('🎉 Note successfully saved and fully integrated with the AURA AI pipeline!');
    } catch (err: unknown) {
      console.error('[Recorder] Save manual text error:', err);
      const errMsg = err instanceof Error ? err.message : 'Server connection failed. Could not process text transcription.';
      setError(errMsg);
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
    <div className="space-y-4 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
      {/* Mode Selector Capsule Toggle */}
      <div 
        style={{ transform: 'translateZ(15px)' }}
        className="flex items-center justify-between p-1 bg-black/40 border border-white/5 rounded-xl shadow-inner max-w-xs mx-auto"
      >
        <button
          id="recorder-mode-mic-btn"
          onClick={() => { setInputMode('mic'); setError(null); }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-extrabold tracking-wider uppercase transition-all duration-300 ${
            inputMode === 'mic' 
              ? 'bg-gradient-to-b from-[#1c1635] to-[#0d0b1a] border border-[#8b5cf6]/35 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎙️ Mic Recorder
        </button>
        <button
          id="recorder-mode-text-btn"
          onClick={() => { setInputMode('text'); setError(null); }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-extrabold tracking-wider uppercase transition-all duration-300 ${
            inputMode === 'text' 
              ? 'bg-gradient-to-b from-[#1c1635] to-[#0d0b1a] border border-[#8b5cf6]/35 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          ⌨️ Text Memo Pad
        </button>
      </div>

      {inputMode === 'mic' ? (
        <>
          {/* Visual Status Indicator Panel */}
          <div 
            style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
            className="flex items-center justify-between p-3.5 glass-panel border-white/5 bg-white/[0.02] preserve-3d"
          >
            <div className="flex items-center space-x-3 preserve-3d">
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
          <div 
            style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}
            className="flex items-center justify-center py-2 preserve-3d"
          >
            {!isRecording ? (
              <div className="relative group p-4 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
                {/* Ambient neon backdrop blur */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 blur-xl opacity-35 group-hover:opacity-55 transition-opacity" />
                
                <button
                  id="recorder-mic-start-btn"
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
                    id="recorder-mic-resume-btn"
                    onClick={resumeRecording}
                    className="w-13 h-13 rounded-full flex items-center justify-center bg-gradient-to-b from-[#2e2a1a] to-[#141208] border border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_2px_2px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Resume recording"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                ) : (
                  <button
                    id="recorder-mic-pause-btn"
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
                    id="recorder-mic-stop-btn"
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
            <div 
              style={{ transform: 'translateZ(25px)' }}
              className="p-3 bg-[#08060f]/60 border border-violet-500/10 rounded-xl relative overflow-hidden animate-fade-in shadow-inner"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500" />
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                <span className="text-[9px] font-bold tracking-wider text-violet-400 uppercase">Live Speech Feed</span>
              </div>
              <p className="text-[11px] text-gray-300 font-mono leading-relaxed italic">
                &ldquo;{liveTranscript}&rdquo;
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
        </>
      ) : (
        /* Direct Text Memo Pad Container */
        <div 
          style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
          className="space-y-4 p-4 glass-panel border-white/5 bg-white/[0.01] preserve-3d"
        >
          <div className="space-y-1">
            <label className="text-[9px] font-extrabold tracking-wider text-violet-400 uppercase">
              Direct Note & AI Synthesis Pipeline
            </label>
            <textarea
              id="recorder-text-input"
              value={manualTextInput}
              onChange={(e) => setManualTextInput(e.target.value)}
              placeholder="Paste or type your notes here... AURA will parse hashtags, analyze mood, build speech timelines, and translate natively."
              className="w-full h-24 p-3 rounded-lg border border-white/5 bg-black/45 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]/30 focus:outline-none text-xs text-gray-300 resize-none font-mono"
            />
          </div>

          {/* Duration slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
              <span>Simulated Speaking Duration</span>
              <span className="text-[#8b5cf6] font-mono">{formatTime(manualDuration)}</span>
            </div>
            <input
              type="range"
              id="recorder-text-duration-slider"
              min="5"
              max="300"
              step="5"
              value={manualDuration}
              onChange={(e) => setManualDuration(parseInt(e.target.value))}
              className="w-full accent-[#8b5cf6] bg-white/10 rounded-lg appearance-none h-1.5"
            />
          </div>

          {/* Process Button */}
          <button
            id="recorder-text-process-btn"
            onClick={handleSaveManualText}
            disabled={isUploading || !manualTextInput.trim()}
            className="w-full py-2.5 rounded-lg flex items-center justify-center font-bold text-[10px] tracking-wider uppercase text-white bg-gradient-to-r from-[#8b5cf6] to-pink-500 hover:from-[#7c3aed] hover:to-pink-400 border border-white/10 shadow-[0_4px_12px_rgba(139,92,246,0.3)] transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Running AI Summarizer & Analytics...</span>
              </>
            ) : (
              <span>🔮 Process and Save Notes</span>
            )}
          </button>
        </div>
      )}

      {/* Error / Status alert Banner */}
      {error && (
        <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg flex items-start space-x-2 text-xs text-pink-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 16-BIT PCM MONO WAV CLIENT-SIDE ENCODER UTILITIES
// ----------------------------------------------------
const encodeWAV = (buffers: Float32Array[], totalLength: number, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + totalLength * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample (16-bit PCM) */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, totalLength * 2, true);

  // Write float samples converted to 16-bit integers
  let offset = 44;
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    for (let j = 0; j < buffer.length; j++) {
      // Clamp float sample between -1.0 and 1.0
      const sample = Math.max(-1, Math.min(1, buffer[j]));
      // Convert to 16-bit signed integer PCM
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
