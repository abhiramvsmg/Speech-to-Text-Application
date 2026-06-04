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
    const capturedLiveTranscript = liveTranscript.trim();

    try {
      // Convert blob into file payload - since we encode as WAV in client, it's always WAV!
      const file = new File([blob], `mic_voice.wav`, { type: 'audio/wav' });

      // Trigger server REST transcription
      let record = await api.transcribe(file, engine, key, language);
      
      // OPTIMIZATION: If the server returned an empty or placeholder response, but the high-accuracy 
      // browser-native Web Speech API successfully captured text during recording, use the client transcript!
      if ((!record.text || record.text.includes('[No speech detected') || record.text.trim() === '') && capturedLiveTranscript) {
        console.log('[Recorder] Server returned empty/placeholder transcript. Merging with browser-captured text.');
        record = await api.saveRawTranscript({
          title: record.title,
          text: capturedLiveTranscript,
          duration: duration,
          language: language,
          stt_engine: engine,
          stt_key: key
        });
      }

      onTranscriptionComplete(record);
      playCyberSound('chime');
      setLiveTranscript(''); // clear live stream tray upon success
      
    } catch (err: unknown) {
      console.error('[Recorder] Upload/Transcription error:', err);
      
      // High-Fidelity Browser-native SpeechRecognition fallback
      if (capturedLiveTranscript) {
        try {
          const fallbackRecord = await api.saveRawTranscript({
            text: capturedLiveTranscript,
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

  const cancelRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsPaused(false);
      isPausedRef.current = false;
      stopTimer();
      cleanupStream();
      
      // Clean up audio graph nodes
      if (processorNodeRef.current) {
        try { processorNodeRef.current.disconnect(); } catch {}
        processorNodeRef.current = null;
      }
      if (audioInputRef.current) {
        try { audioInputRef.current.disconnect(); } catch {}
        audioInputRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }

      pcmBuffersRef.current = [];
      pcmLengthRef.current = 0;
      setDuration(0);
      setLiveTranscript('');
      playCyberSound('click');
      setError('Recording session reset.');
    }
  };

  return (
    <div className="space-y-6 preserve-3d flex flex-col items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
      
      {/* Mode Selector Capsule Toggle */}
      <div 
        style={{ transform: 'translateZ(15px)' }}
        className="flex items-center justify-between p-1 bg-black/40 border border-white/5 rounded-xl shadow-inner w-full max-w-xs mx-auto print:hidden"
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
        <div className="w-full flex flex-col items-center justify-center space-y-6 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
          
          {/* Holographic Recording Centerpiece Orb */}
          <div 
            style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }} 
            className="relative flex items-center justify-center my-4 preserve-3d"
          >
            {/* Shifting radial mesh backdrop glow */}
            <div className={`absolute w-48 h-48 rounded-full blur-2xl opacity-40 transition-all duration-700 ${
              isRecording 
                ? isPaused 
                  ? 'bg-amber-500 scale-105'
                  : 'bg-gradient-to-tr from-pink-500 to-rose-500 scale-110 animate-pulse'
                : 'bg-gradient-to-tr from-violet-600 to-pink-500 scale-95 group-hover:scale-100'
            }`} />

            {/* Ripple sound waves expanding outward */}
            {isRecording && !isPaused && (
              <>
                <div className="absolute inset-[-12px] rounded-full border border-pink-500/20 animate-[ring-pulse_2s_infinite]" />
                <div className="absolute inset-[-24px] rounded-full border border-violet-500/10 animate-[ring-pulse_2.8s_infinite]" style={{ animationDelay: '0.6s' }} />
              </>
            )}

            {/* Core physical interactive Orb button */}
            <button
              id="recorder-mic-core-orb"
              onClick={() => {
                if (!isRecording) startRecording();
                else if (isPaused) resumeRecording();
                else pauseRecording();
              }}
              disabled={isUploading}
              style={{ transform: 'translateZ(10px)' }}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-white border select-none transition-all duration-500 hover:scale-105 cursor-pointer z-10 relative overflow-hidden backdrop-blur-md ${
                isRecording
                  ? isPaused
                    ? 'border-amber-500 bg-amber-950/20 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-orb-pulse'
                    : 'border-pink-500 bg-pink-950/15 text-white animate-liquid-orb'
                  : 'border-violet-500/25 bg-gradient-to-b from-white/[0.03] to-[#8b5cf6]/[0.05] hover:border-violet-500/50 shadow-[0_12px_36px_rgba(0,0,0,0.4),_inset_0_1px_2px_rgba(255,255,255,0.1)] active:scale-98 animate-card-float'
              }`}
            >
              {/* Inner details based on state */}
              {!isRecording ? (
                <>
                  <Mic className="w-10 h-10 text-violet-400 hover:text-white transition-colors duration-300" />
                  <span className="text-[9px] font-extrabold tracking-widest text-violet-300/80 uppercase mt-2">TAP TO START</span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1 z-20">
                  {/* Timer display */}
                  <span className="text-xl font-mono font-bold tracking-tight text-white tabular-nums">
                    {formatTime(duration)}
                  </span>
                  
                  {/* Small icon indication */}
                  {isPaused ? (
                    <div className="flex flex-col items-center space-y-0.5 animate-pulse">
                      <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-[7.5px] font-extrabold tracking-widest text-amber-400 uppercase">RESUME</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-0.5">
                      <div className="flex items-end space-x-0.5 h-3 my-0.5">
                        <span className="w-0.5 bg-pink-400 rounded-full h-full animate-[wave_0.8s_infinite] origin-bottom" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 bg-white rounded-full h-2/3 animate-[wave_0.5s_infinite] origin-bottom" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 bg-pink-400 rounded-full h-full animate-[wave_0.7s_infinite] origin-bottom" style={{ animationDelay: '0.5s' }} />
                      </div>
                      <span className="text-[7.5px] font-extrabold tracking-widest text-pink-300 uppercase">PAUSE</span>
                    </div>
                  )}
                </div>
              )}

              {/* Physical glass glare overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-[50%] pointer-events-none" />
            </button>
          </div>

          {/* Secondary Controls: Save & Cancel Buttons (only shown in active recording states) */}
          {isRecording && (
            <div 
              style={{ transform: 'translateZ(20px)' }}
              className="flex items-center justify-center space-x-6 animate-drawer-slide z-20"
            >
              {/* Reset/Cancel button */}
              <button
                id="recorder-mic-cancel-btn"
                onClick={cancelRecording}
                className="px-4 py-2 text-[9px] font-bold tracking-wider uppercase bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/25 text-gray-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Discard recording session"
              >
                Reset Clip
              </button>

              {/* Stop & compile session */}
              <button
                id="recorder-mic-stop-btn"
                onClick={stopRecording}
                className="px-5 py-2.5 text-[9px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-pink-600 to-rose-500 border border-white/10 hover:border-pink-400 text-white rounded-xl shadow-[0_4px_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                title="Transcribe session"
              >
                <Square className="w-3.5 h-3.5 fill-current text-white" />
                <span>Compile Note</span>
              </button>
            </div>
          )}

          {/* Live Transcript Capture Feed tray */}
          {isRecording && liveTranscript && (
            <div 
              style={{ transform: 'translateZ(25px)' }}
              className="p-3 bg-[#08060f]/60 border border-violet-500/10 rounded-xl relative overflow-hidden animate-fade-in shadow-inner w-full text-center"
            >
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500" />
              <div className="flex items-center justify-center space-x-1.5 mb-1.5">
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
              <span>Analyzing Speech...</span>
            </div>
          )}
        </div>
      ) : (
        /* Direct Text Memo Pad Container */
        <div 
          style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
          className="space-y-4 p-4 glass-panel border-white/5 bg-white/[0.01] w-full preserve-3d"
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
