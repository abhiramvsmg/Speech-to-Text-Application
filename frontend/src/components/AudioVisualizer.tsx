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
  const particlesRef = useRef<any[]>([]);

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

    // Initialize 3D particles if empty
    if (particlesRef.current.length === 0) {
      const count = 120;
      const pts = [];
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = 90; // sphere base radius
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        const h = 230 + (i / count) * 70;
        const color = `hsla(${h}, 95%, 70%, 1)`;
        
        pts.push({
          x, y, z,
          baseX: x, baseY: y, baseZ: z,
          color,
          speed: Math.random() * 0.015 + 0.005,
          size: Math.random() * 2.5 + 1.2
        });
      }
      particlesRef.current = pts;
    }

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
    let yaw = 0;
    let pitch = 0;
    let roll = 0;
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      const isActive = isRecording || (isPlaying && audioElement);

      // Retrieve CSS variable colors dynamically to match dynamic theme settings
      let primaryColor = '#8b5cf6';
      let secondaryColor = '#ec4899';
      let tertiaryColor = '#3b82f6';
      
      if (typeof window !== 'undefined') {
        const rootStyles = getComputedStyle(document.documentElement);
        primaryColor = rootStyles.getPropertyValue('--glow-primary').trim() || '#8b5cf6';
        secondaryColor = rootStyles.getPropertyValue('--glow-secondary').trim() || '#ec4899';
        tertiaryColor = rootStyles.getPropertyValue('--glow-tertiary').trim() || '#3b82f6';
      }

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

      // Calculate average audio frequency level for orbital speeds
      let sumFreq = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumFreq += dataArray[i];
      }
      const avgFreq = sumFreq / (bufferLength || 1);
      
      // Update rotation angles dynamically relative to audio volume
      yaw += 0.003 + (isActive ? avgFreq * 0.00012 : 0);
      pitch += 0.002 + (isActive ? avgFreq * 0.00008 : 0);
      roll += 0.001;

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
          gradient.addColorStop(0, '#0c0b14');
          gradient.addColorStop(0.3, primaryColor); // Primary theme color
          gradient.addColorStop(1, secondaryColor); // Secondary theme color

          ctx.fillStyle = gradient;
          
          // Draw subtle glowing shadow behind active bars
          if (isActive) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = primaryColor + '66';
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
        ctx.shadowColor = primaryColor;
        ctx.strokeStyle = primaryColor + 'd9'; // 85% opacity hex
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
        innerGlow.addColorStop(0, secondaryColor + '40'); // Theme secondary core (25% opacity)
        innerGlow.addColorStop(1, primaryColor + '00'); // Theme primary fadeout
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
          
          // Determine color based on depth with theme dynamic colors
          const alpha = 0.1 + (depthRatio * 0.65);
          const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0');
          const fillAlpha = Math.round(alpha * 0.08 * 255).toString(16).padStart(2, '0');
          
          ctx.strokeStyle = primaryColor + hexAlpha;
          ctx.fillStyle = secondaryColor + fillAlpha; // subtle fill underneath
          
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
      } else if (style === '3d-particle-orbit') {
        // 3D Cyber Orbit Sphere visualizer
        const particles = particlesRef.current;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const fov = 180;
        const distance = 200;
        
        // 1. Calculate projected coordinates for all particles
        const projectedPoints: { x: number; y: number; z: number; size: number; color: string; val: number; alpha: number }[] = [];
        
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          const val = dataArray[i % bufferLength] / 255;
          
          // Warp sphere radius dynamically with frequency
          const warp = 1.0 + (isActive ? val * 0.65 : Math.sin(idlePhase + i) * 0.15);
          const rx = pt.baseX * warp;
          const ry = pt.baseY * warp;
          const rz = pt.baseZ * warp;
          
          // Rotate coordinates around Y-axis (yaw)
          const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
          const x1 = rx * cosY - rz * sinY;
          const z1 = rx * sinY + rz * cosY;
          
          // Rotate coordinates around X-axis (pitch)
          const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
          const y2 = ry * cosX - z1 * sinX;
          const z2 = ry * sinX + z1 * cosX;
          
          // Rotate coordinates around Z-axis (roll)
          const cosZ = Math.cos(roll), sinZ = Math.sin(roll);
          const x3 = x1 * cosZ - y2 * sinZ;
          const y3 = x1 * sinZ + y2 * cosZ;
          
          // Perspective projection
          const perspective = fov / (fov + z2 + distance);
          const px = centerX + x3 * perspective * 1.5;
          const py = centerY + y3 * perspective * 1.5;
          
          // Size & color properties scaled by depth z2
          const size = pt.size * perspective * (1.0 + (isActive ? val * 1.3 : 0));
          
          // Calculate opacity: front is solid, back is faded
          const alpha = Math.max(0.15, Math.min(0.9, 0.5 + (z2 / 120)));
          
          projectedPoints.push({
            x: px,
            y: py,
            z: z2,
            size,
            color: pt.color,
            val,
            alpha
          });
        }
        
        // 2. Draw connections (Translucent glowing mesh connections)
        // To keep it 60 FPS, connect systematically in $O(N)$
        ctx.lineWidth = 0.5;
        for (let i = 0; i < projectedPoints.length; i++) {
          const ptA = projectedPoints[i];
          
          // Connect to next neighbor and neighbor 4 steps ahead to form a beautiful wireframe cage
          const neighbors = [(i + 1) % projectedPoints.length, (i + 4) % projectedPoints.length];
          
          for (const nextIdx of neighbors) {
            const ptB = projectedPoints[nextIdx];
            
            // Recolor dynamic theme connections
            const colorA = i % 2 === 0 ? primaryColor : secondaryColor;
            const colorB = nextIdx % 2 === 0 ? primaryColor : secondaryColor;
            
            // Only connect if close enough to avoid long unsightly stretch lines
            const dist = Math.sqrt(Math.pow(ptA.x - ptB.x, 2) + Math.pow(ptA.y - ptB.y, 2));
            if (dist < 100) {
              const gradient = ctx.createLinearGradient(ptA.x, ptA.y, ptB.x, ptB.y);
              gradient.addColorStop(0, colorA + '26'); // 15% opacity hex
              gradient.addColorStop(1, colorB + '26');
              
              ctx.strokeStyle = gradient;
              ctx.beginPath();
              ctx.moveTo(ptA.x, ptA.y);
              ctx.lineTo(ptB.x, ptB.y);
              ctx.stroke();
            }
          }
        }
        
        // 3. Draw particles sorted by depth (painter's algorithm) so front particles cover back ones
        const sortedPoints = [...projectedPoints].sort((a, b) => a.z - b.z);
        for (let i = 0; i < sortedPoints.length; i++) {
          const pt = sortedPoints[i];
          ctx.beginPath();
          
          // Outer neon glow ring
          const pColor = i % 2 === 0 ? primaryColor : secondaryColor;
          const alphaHex25 = Math.round(pt.alpha * 0.25 * 255).toString(16).padStart(2, '0');
          const alphaHexFull = Math.round(pt.alpha * 255).toString(16).padStart(2, '0');
          
          ctx.arc(pt.x, pt.y, pt.size * 1.6, 0, Math.PI * 2);
          ctx.fillStyle = pColor + alphaHex25;
          ctx.fill();
          
          // Inner solid core
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pColor + alphaHexFull;
          ctx.fill();
        }
      } else {
        // 4. Cyber Sine Wave Style (Default)
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = isActive ? 12 : 5;
        ctx.shadowColor = primaryColor + '99';

        // Draw multiple overlapping waves for a glowing fluid ribbon effect
        const wavesCount = 3;
        for (let w = 0; w < wavesCount; w++) {
          ctx.beginPath();
          
          // Separate properties for layered visuals
          const alpha = 0.9 - w * 0.25;
          const scale = 0.5 + w * 0.25;
          const themeColor = w === 0 ? primaryColor : w === 1 ? secondaryColor : tertiaryColor;
          const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0');
          ctx.strokeStyle = themeColor + hexAlpha;

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
