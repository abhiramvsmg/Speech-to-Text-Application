'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
  style?: string; // 'sine' | 'bars' | 'circle'
  isRecording?: boolean;
  isPlaying?: boolean;
}

export default function AudioVisualizer({
  stream,
  audioElement,
  style = 'sine',
  isRecording = false,
  isPlaying = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const historyRef = useRef<number[][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize Web Audio API
    let analyser: AnalyserNode | null = null;
    let audioContext: AudioContext | null = null;

    const cleanupAudio = () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        sourceNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        // We keep it open or close it
      }
    };

    const setupVisualizer = () => {
      cleanupAudio();

      const activeSource = stream || (isPlaying ? audioElement : null);
      if (!activeSource) return;

      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        audioContext = audioCtxRef.current;

        // Resume context if suspended (common browser security constraint)
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        analyser.fftSize = style === 'circle' ? 256 : 512;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        if (stream) {
          // 1. Microphone Source
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          sourceNodeRef.current = source;
        } else if (audioElement) {
          // 2. Playback Audio Element Source
          // Standard warning: CORS block can trigger if audio served without correct headers,
          // but our backend has CORS fully enabled, so it works.
          try {
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            sourceNodeRef.current = source;
          } catch (err) {
            console.log('[Visualizer] Element already connected or CORS blocked: ', err);
          }
        }
      } catch (err) {
        console.error('[Visualizer] Web Audio setup error:', err);
      }
    };

    setupVisualizer();

    // Render loop
    let idlePhase = 0;
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      const isActive = isRecording || (isPlaying && audioElement);

      // 1. Maintain 3D history buffer if requested
      if (style === '3d-spectrogram') {
        const history = historyRef.current;
        const maxHistory = 22;
        
        if (isActive && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Scale down buffer to 128 elements for high density visual layout speed
          const compressedFrame: number[] = [];
          const step = Math.max(1, Math.floor(bufferLength / 128));
          for (let i = 0; i < bufferLength; i += step) {
            compressedFrame.push(dataArray[i]);
          }
          history.push(compressedFrame);
          if (history.length > maxHistory) {
            history.shift();
          }
        } else {
          // Generate moving wave terrain for resting state
          if (history.length < maxHistory) {
            for (let h = history.length; h < maxHistory; h++) {
              history.push(new Array(128).fill(0));
            }
          }
          history.shift();
          
          idlePhase += 0.035;
          const mockFrame: number[] = [];
          for (let i = 0; i < 128; i++) {
            const angle1 = (i / 128) * Math.PI * 3 + idlePhase;
            const angle2 = (i / 128) * Math.PI * 5 - idlePhase * 1.5;
            const val = Math.sin(angle1) * Math.cos(angle2) * 20 + 25;
            mockFrame.push(val);
          }
          history.push(mockFrame);
        }
      } else {
        if (isActive && analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
        } else {
          // Generate mock data for resting animation
          idlePhase += 0.04;
          for (let i = 0; i < bufferLength; i++) {
            // Beautiful fading sine wave pattern for ambient screen presence
            const angle = (i / bufferLength) * Math.PI * 4 + idlePhase;
            dataArray[i] = Math.sin(angle) * 35 + 40;
          }
        }
      }

      // --- STYLES DRAW LOGIC ---
      if (style === 'bars') {
        // 1. Neon Frequency Bars Style
        const barWidth = (width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const barHeight = percent * (height * 0.75);

          // Glowing gradients
          const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
          gradient.addColorStop(0, '#120f26');
          gradient.addColorStop(0.3, '#7c3aed'); // Primary violet
          gradient.addColorStop(1, '#ec4899'); // Secondary pink

          ctx.fillStyle = gradient;
          
          // Draw subtle glowing shadow behind active bars
          if (isActive) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
      } else if (style === 'circle') {
        // 2. Glow Pulsing Ring Style
        const centerX = width / 2;
        const centerY = height / 2;
        // Adjust radius by the average amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;
        const baseRadius = Math.min(width, height) * 0.25 + (average / 255) * 30;

        ctx.shadowBlur = isActive ? 20 : 8;
        ctx.shadowColor = '#8b5cf6';
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.85)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const offset = percent * 45;
          const angle = (i / bufferLength) * Math.PI * 2;
          const r = baseRadius + offset;

          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Draw an inner glowing core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
        const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 0.7);
        innerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.25)'); // Pink core
        innerGlow.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = innerGlow;
        ctx.shadowBlur = 0;
        ctx.fill();

      } else if (style === '3d-spectrogram') {
        // 3. 3D Cascading Spectrogram Mode (Premium 3D Visualizer!)
        const history = historyRef.current;
        
        ctx.lineWidth = 1.8;
        
        // Draw from back (oldest) to front (newest) so they overlap correctly
        for (let h = 0; h < history.length; h++) {
          const frame = history[h];
          const depthRatio = h / (history.length - 1 || 1); // 0 (back) to 1 (front)
          
          // Calculate perspective offsets
          // Further back means shifted higher, compressed horizontally
          const yOffset = (1 - depthRatio) * (height * 0.4) + (height * 0.1);
          const xCompression = 0.65 + (depthRatio * 0.35); // back is narrower
          const scale = 0.2 + (depthRatio * 0.8); // back is smaller
          
          // Determine color based on depth: back is deep purple, front is neon violet/pink
          const r = Math.round(59 + depthRatio * (236 - 59));
          const g = Math.round(130 + depthRatio * (72 - 130));
          const b = Math.round(246 + depthRatio * (153 - 246));
          const alpha = 0.1 + (depthRatio * 0.65);
          
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`; // subtle fill underneath
          
          ctx.beginPath();
          const sliceWidth = (width * xCompression) / frame.length;
          const xStart = (width * (1 - xCompression)) / 2;
          
          let x = xStart;
          
          for (let i = 0; i < frame.length; i++) {
            const val = frame[i];
            const percent = val / 255;
            const amp = percent * (height * 0.28) * scale;
            
            // Apply a beautiful wave shape or smoothing to boundaries (drop to 0 at edges)
            const edgeFilter = Math.sin((i / frame.length) * Math.PI);
            const y = (height * 0.8) - yOffset - (amp * edgeFilter);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          
          // Close path to draw terrain fill
          ctx.lineTo(xStart + (width * xCompression), (height * 0.8) - yOffset);
          ctx.lineTo(xStart, (height * 0.8) - yOffset);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // 4. Cyber Sine Wave Style (Default)
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = isActive ? 12 : 5;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';

        // Draw multiple overlapping waves for a glowing fluid ribbon effect
        const wavesCount = 3;
        for (let w = 0; w < wavesCount; w++) {
          ctx.beginPath();
          
          // Separate properties for layered visuals
          const alpha = 0.9 - w * 0.25;
          const scale = 0.5 + w * 0.25;
          const color = w === 0 ? '#8b5cf6' : w === 1 ? '#ec4899' : '#3b82f6';
          ctx.strokeStyle = `rgba(${color === '#8b5cf6' ? '139, 92, 246' : color === '#ec4899' ? '236, 72, 153' : '59, 130, 246'}, ${alpha})`;

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i];
            const percent = value / 255;
            // Phase adjustment creates the flowing ribbon movement
            const waveOffset = Math.sin((i / bufferLength) * Math.PI * 4 + idlePhase * (w + 1)) * 12;
            const y = (height / 2) + ((percent - 0.5) * height * 0.5 * scale) + waveOffset;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              // Smooth bezier links
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      // Reset shadows
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      cleanupAudio();
    };
  }, [stream, audioElement, style, isRecording, isPlaying]);

  return (
    <div className="w-full h-full relative group">
      {/* Decorative Glowing border for canvas frame */}
      <div className="absolute inset-0 border border-violet-500/10 group-hover:border-violet-500/30 rounded-xl transition-colors pointer-events-none" />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded-xl bg-black/20 backdrop-blur-sm"
      />
    </div>
  );
}
