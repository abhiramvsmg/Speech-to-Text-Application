'use client';

import React, { useState } from 'react';
import { 
  Sparkles, FileText, Clipboard, Download, Check, 
  BookOpen, CheckSquare, Languages, FileCheck2, Loader2, Save, Trash2,
  Send, MessageSquare, BrainCircuit, Activity, Play, Pause, Volume2
} from 'lucide-react';
import { api, TranscriptRecord } from '@/lib/api';

// -----------------------------------------------------------------
// FUTURISTIC NEURAL NETWORK COGNITIVE SYNTHESIZER CANVAS LOADER
// -----------------------------------------------------------------
interface NeuralSynthesizerCanvasProps {
  actionName: string;
}

export function NeuralSynthesizerCanvas({ actionName }: NeuralSynthesizerCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let width = 0;
    let height = 0;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Create 24 floating neural nodes
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number; pulse: number; speed: number; color: string }[] = [];
    const colors = ['#a78bfa', '#f472b6', '#38bdf8', '#34d399', '#f59e0b'];
    
    for (let i = 0; i < 24; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        radius: Math.random() * 2.5 + 1.5,
        pulse: Math.random() * Math.PI,
        speed: Math.random() * 0.05 + 0.02,
        color: colors[i % colors.length]
      });
    }

    // Create 15 floating ascending sparks
    const sparks: { x: number; y: number; vy: number; vx: number; radius: number; alpha: number; life: number; maxLife: number; color: string }[] = [];
    for (let i = 0; i < 15; i++) {
      sparks.push({
        x: Math.random() * width,
        y: height + Math.random() * 50,
        vy: -(Math.random() * 0.8 + 0.3),
        vx: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        life: 0,
        maxLife: Math.random() * 150 + 100,
        color: colors[i % colors.length]
      });
    }
    
    let phase = 0;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      phase += 0.015;

      // Draw and update ascending sparks
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.y += s.vy;
        s.x += s.vx;
        s.life++;
        
        let currentAlpha = s.alpha;
        if (s.life < 20) {
          currentAlpha = s.alpha * (s.life / 20);
        } else if (s.life > s.maxLife - 30) {
          currentAlpha = s.alpha * (1 - (s.life - (s.maxLife - 30)) / 30);
        }
        
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 4;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
        if (s.life >= s.maxLife || s.y < -10) {
          sparks[i] = {
            x: Math.random() * width,
            y: height + Math.random() * 20,
            vy: -(Math.random() * 0.8 + 0.3),
            vx: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.6 + 0.2,
            life: 0,
            maxLife: Math.random() * 150 + 100,
            color: colors[Math.floor(Math.random() * colors.length)]
          };
        }
      }
      
      // Draw background target radars
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.03)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 140, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw synapses connections
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.22;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
            
            // Electric spark pulses discharging down synapses
            if (Math.sin(phase + i * 2) > 0.8) {
              const pulsePos = (Math.sin(phase * 2 + i * 3) + 1) / 2;
              const px = nodeA.x + (nodeB.x - nodeA.x) * pulsePos;
              const py = nodeA.y + (nodeB.y - nodeA.y) * pulsePos;
              ctx.fillStyle = '#f472b6';
              ctx.shadowColor = '#f472b6';
              ctx.shadowBlur = 6;
              ctx.beginPath();
              ctx.arc(px, py, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
      }
      
      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        
        node.pulse += node.speed;
        const currentRadius = node.radius + Math.sin(node.pulse) * 1.0;
        
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Central floatingScanning hub
      const hubX = width / 2;
      const hubY = height / 2;
      const grad = ctx.createRadialGradient(hubX, hubY, 0, hubX, hubY, 40);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
      grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hubX, hubY, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.save();
      ctx.translate(hubX, hubY);
      ctx.rotate(phase);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 24, Math.PI, Math.PI * 1.45);
      ctx.stroke();
      ctx.restore();
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <div className="absolute inset-0 bg-[#08060f]/80 backdrop-blur-[4px] flex flex-col items-center justify-center z-20 animate-fade-in border border-violet-500/10 rounded-xl overflow-hidden shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 px-6 select-none pointer-events-none">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-violet-600 blur-md opacity-50 animate-ping" />
          <div className="w-8 h-8 rounded-full border border-violet-400 bg-black/80 flex items-center justify-center animate-spin duration-3000">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 shadow-[0_0_8px_#8b5cf6]" />
          </div>
        </div>
        <div className="space-y-1">
          <h4 className="text-white text-[10px] font-extrabold tracking-wider uppercase bg-black/60 px-3 py-1 rounded-full border border-white/5 shadow-md">
            Neural Synthesizer Active
          </h4>
          <p className="text-[9px] text-violet-300 font-bold tracking-wide capitalize animate-pulse">
            Processing {actionName.replace('_', ' ')} logic...
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// COGNITIVE LINGUISTIC SENTIMENT SPEEDOMETER GAUGE CHART
// -----------------------------------------------------------------
interface SentimentData {
  joy: number;
  calm: number;
  confident: number;
  analytical: number;
  urgent: number;
}

interface LinguisticSentimentSpeedometerProps {
  sentiment: SentimentData;
}

export function LinguisticSentimentSpeedometer({ sentiment }: LinguisticSentimentSpeedometerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let width = 0;
    let height = 0;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Weighted scoring mapping: urgent (10), analytical (45), confident (65), calm (80), joy (95)
    const { urgent, analytical, confident, calm, joy } = sentiment;
    const total = urgent + analytical + confident + calm + joy || 1;
    const score = Math.max(5, Math.min(95, (urgent * 10 + analytical * 45 + confident * 65 + calm * 80 + joy * 95) / total));
    
    let currentScore = 0;
    const easeSpeed = 0.05;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      currentScore += (score - currentScore) * easeSpeed;
      
      const centerX = width / 2;
      const centerY = height * 0.78;
      const radius = Math.min(width, height) * 0.52;
      
      const isLight = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'holographic-light';
      
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      
      const startAngle = 0.85 * Math.PI;
      const endAngle = 2.15 * Math.PI;
      const totalAngle = endAngle - startAngle;
      
      // Arc track background
      ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.06)' : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
      
      // Arc gradient
      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, '#f43f5e'); // Urgent/Anxious (Pink/Red)
      gradient.addColorStop(0.25, '#f59e0b'); // Energetic (Amber)
      gradient.addColorStop(0.5, '#10b981'); // Professional (Emerald)
      gradient.addColorStop(0.75, '#3b82f6'); // Analytical (Blue)
      gradient.addColorStop(1, '#a78bfa'); // Calm (Purple/Lavender)
      
      ctx.strokeStyle = gradient;
      const valAngle = startAngle + (currentScore / 100) * totalAngle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, valAngle);
      ctx.stroke();
      
      // Tick marks
      ctx.lineWidth = 1;
      const ticksCount = 11;
      for (let i = 0; i < ticksCount; i++) {
        const tickRatio = i / (ticksCount - 1);
        const angle = startAngle + tickRatio * totalAngle;
        const startX = centerX + Math.cos(angle) * (radius - 12);
        const startY = centerY + Math.sin(angle) * (radius - 12);
        const endX = centerX + Math.cos(angle) * (radius - 20);
        const endY = centerY + Math.sin(angle) * (radius - 20);
        
        ctx.strokeStyle = isLight ? 'rgba(28, 25, 38, 0.15)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      // Glowing speedometer needle pointer
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(valAngle);
      
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = isLight ? '#7c3aed' : '#f472b6';
      ctx.shadowColor = isLight ? 'rgba(124, 58, 237, 0.5)' : '#ec4899';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius - 16, 0);
      ctx.stroke();
      ctx.restore();
      
      // Center needle hub pivot
      ctx.shadowBlur = 0;
      ctx.fillStyle = isLight ? '#7c3aed' : '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = isLight ? '#f472b6' : '#ec4899';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Digital readout score
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = isLight ? '#1c1926' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(currentScore)}%`, centerX, centerY - 28);
      
      // Mood rating text
      let moodName = "Neutral";
      let moodColor = isLight ? '#3b374d' : '#94a3b8';
      if (currentScore < 20) { moodName = "Anxious / Urgent 🚨"; moodColor = '#f43f5e'; }
      else if (currentScore < 40) { moodName = "Energetic / High Tempo ⚡"; moodColor = '#f59e0b'; }
      else if (currentScore < 60) { moodName = "Professional / Focused 💼"; moodColor = '#10b981'; }
      else if (currentScore < 80) { moodName = "Analytical / Deliberate 🎓"; moodColor = '#3b82f6'; }
      else { moodName = "Calm & Synced 🧘"; moodColor = '#a78bfa'; }
      
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = moodColor;
      ctx.fillText(moodName.toUpperCase(), centerX, centerY - 8);
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [sentiment]);
  
  return (
    <div className="w-full h-full min-h-[160px] relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full min-h-[160px]" />
    </div>
  );
}


// -----------------------------------------------------------------
// COGNITIVE SENTIMENT SENTENCE TRAJECTORY TIMELINE GRAPH
// -----------------------------------------------------------------
interface SentimentTimelineProps {
  text: string;
}

export function SentimentTimeline({ text }: SentimentTimelineProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const points = React.useMemo(() => {
    const sentences = (text || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    if (sentences.length === 0) return [50, 50, 50];
    
    const positiveWords = ['great', 'excited', 'good', 'happy', 'awesome', 'amazing', 'perfect', 'glad', 'wonderful', 'yes', 'love', 'success', 'cool', 'nice', 'will', 'resolved', 'highly', 'extremely'];
    const negativeWords = ['problem', 'fail', 'error', 'bad', 'issue', 'bug', 'sad', 'wrong', 'no', 'cannot', 'difficult', 'slow', 'waste', 'broke', 'risk', 'warning'];
    
    return sentences.map(s => {
      const words = s.toLowerCase().split(/\s+/);
      let score = 50;
      words.forEach(w => {
        if (positiveWords.includes(w)) score += 15;
        if (negativeWords.includes(w)) score -= 15;
      });
      return Math.max(10, Math.min(90, score));
    });
  }, [text]);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let width = 0;
    let height = 0;
    
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);
    
    let progress = 0;
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      if (progress < 1) progress += 0.035;
      
      const paddingX = 18;
      const paddingY = 12;
      const graphWidth = width - paddingX * 2;
      const graphHeight = height - paddingY * 2;
      
      const isLight = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'holographic-light';
      
      ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(paddingX, paddingY + graphHeight / 2);
      ctx.lineTo(paddingX + graphWidth, paddingY + graphHeight / 2);
      ctx.stroke();
      
      if (points.length >= 2) {
        ctx.beginPath();
        const stepX = graphWidth / (points.length - 1);
        
        for (let i = 0; i < points.length; i++) {
          const x = paddingX + i * stepX;
          const y = paddingY + graphHeight - ((points[i] / 100) * graphHeight);
          
          if (i === 0) ctx.moveTo(x, y * progress + (1 - progress) * (paddingY + graphHeight / 2));
          else ctx.lineTo(x, y * progress + (1 - progress) * (paddingY + graphHeight / 2));
        }
        
        ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.8)' : 'rgba(244, 72, 182, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Render dots
        for (let i = 0; i < points.length; i++) {
          const x = paddingX + i * stepX;
          const y = (paddingY + graphHeight - ((points[i] / 100) * graphHeight)) * progress + (1 - progress) * (paddingY + graphHeight / 2);
          
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = points[i] > 50 ? '#34d399' : points[i] < 50 ? '#fb7185' : '#818cf8';
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.25)' : 'rgba(129, 140, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paddingX, paddingY + graphHeight / 2);
        ctx.lineTo(paddingX + graphWidth, paddingY + graphHeight / 2);
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [points]);
  
  return (
    <div className="w-full h-full min-h-[75px] relative flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full min-h-[75px]" />
    </div>
  );
}

interface TranscriptViewerProps {
  record: TranscriptRecord | null;
  onUpdate: (updated: TranscriptRecord) => void;
  onDelete: (id: string) => void;
}

type TabType = 'original' | 'summary' | 'action_items' | 'translation' | 'polished' | 'copilot' | 'insights';

// Heuristics Tone Analyzer
const getToneDetails = (text: string) => {
  const t = (text || '').toLowerCase();
  if (t.includes('urgent') || t.includes('immediately') || t.includes('asap') || t.includes('must') || t.includes('critical')) {
    return { label: 'Urgent 🚨', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.08)]' };
  }
  if (t.includes('excited') || t.includes('great') || t.includes('awesome') || t.includes('launch') || t.includes('cool')) {
    return { label: 'Energetic ⚡', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.08)]' };
  }
  if (t.includes('problem') || t.includes('fail') || t.includes('bug') || t.includes('error') || t.includes('issue')) {
    return { label: 'Concerned 😰', color: 'bg-pink-500/10 border-pink-500/20 text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.08)]' };
  }
  if (t.includes('research') || t.includes('study') || t.includes('analyze') || t.includes('calculate') || t.includes('formula')) {
    return { label: 'Academic 🎓', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_8px_rgba(14,165,233,0.08)]' };
  }
  if (t.includes('creative') || t.includes('design') || t.includes('ideas') || t.includes('concept') || t.includes('brainstorm')) {
    return { label: 'Creative 💡', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.08)]' };
  }
  return { label: 'Professional 💼', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.08)]' };
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
  } catch (e) {
    console.warn("Audio Context sound effect failed:", e);
  }
};

interface ThreeDWordSphereProps {
  text: string;
  onWordClick: (word: string) => void;
}

export function ThreeDWordSphere({ text, onWordClick }: ThreeDWordSphereProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Extract keywords
  const keywords = React.useMemo(() => {
    const stopWords = new Set([
      'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'with', 'was', 'as', 'at', 'by', 'an', 'be', 'are', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'not', 'or', 'if', 'then', 'else', 'we', 'they', 'our', 'your', 'my', 'me', 'us', 'them', 'their', 'there', 'here', 'when', 'where', 'how', 'why', 'what', 'who', 'which', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'about', 'some', 'any', 'all', 'more', 'most', 'no', 'yes', 'so', 'just', 'like', 'go', 'up', 'out', 'down', 'get', 'got', 'make', 'made', 'take', 'took', 'see', 'saw', 'know', 'think', 'say', 'said', 'well', 'want', 'look', 'come', 'came', 'use', 'using', 'used', 'very', 'even', 'also', 'many', 'much', 'some', 'other', 'another', 'into', 'than', 'only', 'new', 'first', 'two', 'three', 'one', 'good', 'great', 'best', 'way', 'work', 'time', 'year', 'day', 'people', 'man', 'woman', 'thing', 'things', 'its', 'into', 'actually', 'basically', 'really', 'just', 'also'
    ]);
    
    const words = (text || '')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .split(/\s+/);
      
    const freq: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
      
    const defaultKeywords = ['AURA', 'Speech', 'Real-time', 'Intelligence', 'Spectra', 'Cognitive', 'Analytics', 'Decoders', 'Next.js', 'Flask'];
    
    return sorted.length >= 3 
      ? sorted.map(e => ({ text: e[0], count: e[1] })) 
      : defaultKeywords.map((w, idx) => ({ text: w, count: 5 - (idx % 3) }));
  }, [text]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let width = 0;
    let height = 0;
    
    // Set canvas high DPI size
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resize();
    
    // Create elements list for the sphere
    const colors = ['#a78bfa', '#f472b6', '#38bdf8', '#fb7185', '#c084fc', '#818cf8', '#2dd4bf'];
    const items = keywords.map((kw, i) => {
      const theta = 2 * Math.PI * i / ((1 + Math.sqrt(5)) / 2);
      const phi = Math.acos(1 - 2 * (i + 0.5) / keywords.length);
      return {
        text: kw.text,
        count: kw.count,
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
        color: colors[i % colors.length]
      };
    });
    
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragDistance = 0;
    
    // Bounding boxes of words for click detection
    let clickableBounds: { text: string; x1: number; y1: number; x2: number; y2: number; zDepth: number }[] = [];

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      isDragging = true;
      dragDistance = 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - startX;
      const dy = y - startY;
      
      dragDistance += Math.sqrt(dx * dx + dy * dy);
      
      targetRotY += dx * 0.007;
      targetRotX += dy * 0.007;
      
      startX = x;
      startY = y;
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging = false;
      
      // If it is a click rather than a drag, check intersections
      if (dragDistance < 4) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Sort bounds by zDepth (front items first, which is lower depth)
        const sortedBounds = [...clickableBounds].sort((a, b) => a.zDepth - b.zDepth);
        for (const bound of sortedBounds) {
          if (clickX >= bound.x1 && clickX <= bound.x2 && clickY >= bound.y1 && clickY <= bound.y2) {
            onWordClick(bound.text);
            break;
          }
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update rotations
      if (!isDragging) {
        targetRotY += 0.002;
        targetRotX += 0.0006;
      }
      
      rotX += (targetRotX - rotX) * 0.1;
      rotY += (targetRotY - rotY) * 0.1;
      
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      
      const radius = Math.min(width, height) * 0.32;
      const perspective = radius * 2.2;
      
      // Project points
      const projected = items.map(item => {
        // Rotate around Y axis
        const x1 = item.x * cosY + item.z * sinY;
        const z1 = -item.x * sinY + item.z * cosY;
        
        // Rotate around X axis
        const y2 = item.y * cosX - z1 * sinX;
        const z2 = item.y * sinX + z1 * cosX;
        
        const sphereX = x1 * radius;
        const sphereY = y2 * radius;
        const sphereZ = z2 * radius;
        
        const scale = perspective / (perspective + sphereZ);
        const screenX = width / 2 + sphereX * scale;
        const screenY = height / 2 + sphereY * scale;
        
        return {
          item,
          screenX,
          screenY,
          scale,
          zDepth: sphereZ
        };
      });
      
      // Painter's algorithm: sort by depth descending
      projected.sort((a, b) => b.zDepth - a.zDepth);
      
      // Faint central aura / particle ring (back half)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.04)';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.PI / 8);
      ctx.scale(1, 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.scale(1, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      const isLight = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'holographic-light';
      
      // Draw a glowing gradient center core
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, radius * 0.35
      );
      gradient.addColorStop(0, isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(139, 92, 246, 0.3)');
      gradient.addColorStop(0.5, isLight ? 'rgba(219, 39, 119, 0.08)' : 'rgba(244, 63, 94, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      
      // Faint core orb circle
      ctx.strokeStyle = isLight ? 'rgba(124, 58, 237, 0.15)' : 'rgba(139, 92, 246, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
      ctx.stroke();
      
      clickableBounds = [];
      
      // Render back-to-front projected items
      projected.forEach(({ item, screenX, screenY, scale, zDepth }) => {
        // Opacity mapping (front is high, back is low)
        const depthRatio = (zDepth + radius) / (2 * radius);
        const opacity = Math.max(0.18, Math.min(1.0, 1.0 - depthRatio * 0.72));
        
        // Dotted connection line to center
        ctx.strokeStyle = isLight 
          ? `rgba(124, 58, 237, ${opacity * 0.15})`
          : `rgba(139, 92, 246, ${opacity * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Scale font sizes based on frequency count and perspective depth
        const baseSize = 10 + Math.min(item.count * 0.65, 8);
        const fontSize = Math.max(9, Math.round(baseSize * scale));
        
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Closer elements have subtle glow
        if (zDepth < 0) {
          ctx.shadowColor = item.color;
          ctx.shadowBlur = Math.round(7 * (1.0 - depthRatio));
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = isLight 
          ? `rgba(28, 25, 38, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText(item.text, screenX, screenY);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Measure for click boundaries
        const textWidth = ctx.measureText(item.text).width;
        const padding = 6;
        clickableBounds.push({
          text: item.text,
          x1: screenX - textWidth / 2 - padding,
          y1: screenY - fontSize / 2 - padding,
          x2: screenX + textWidth / 2 + padding,
          y2: screenY + fontSize / 2 + padding,
          zDepth
        });
      });
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    const handleResize = () => {
      resize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [keywords, onWordClick]);
  
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full min-h-[250px] md:min-h-[280px]"
      />
      {/* Visual Indicator of interactivity */}
      <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none select-none">
        <span className="text-[10px] text-gray-500 font-semibold tracking-wider bg-black/45 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm shadow-md uppercase">
          Drag to Rotate • Click a keyword to ask Copilot
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------
// FUTURISTIC GEOMETRIC CANVAS AUDIO WAVEFORM TIMELINE SCRUBBER
// -----------------------------------------------------------------
interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  onScrub: (time: number) => void;
}

export function WaveformScrubber({ currentTime, duration, onScrub }: WaveformScrubberProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverX, setHoverX] = React.useState<number>(0);
  const isDraggingRef = React.useRef(false);

  const getWpmNormalizedWave = React.useMemo(() => {
    const sampleSize = 65;
    const wave: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      const v = 0.15 + 0.5 * Math.sin(i * 0.18) * Math.cos(i * 0.08) + 
                0.25 * Math.sin(i * 0.45) + 
                0.1 * Math.random();
      wave.push(Math.max(0.12, Math.min(0.9, v)));
    }
    return wave;
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, width, height);

    const barWidth = 3;
    const gap = 2.2;
    const wave = getWpmNormalizedWave;
    const totalBars = wave.length;
    const progressRatio = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < totalBars; i++) {
      const h = wave[i] * (height - 8);
      const x = (width / totalBars) * i + gap / 2;
      const y = (height - h) / 2;

      const barRatio = i / totalBars;
      const isPlayed = barRatio <= progressRatio;

      if (isPlayed) {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#f472b6');
        grad.addColorStop(1, '#db2777');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(244, 114, 182, 0.45)';
        ctx.shadowBlur = 4;
      } else {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
        grad.addColorStop(1, 'rgba(109, 40, 217, 0.08)');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 1.5);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }, [currentTime, duration, getWpmNormalizedWave]);

  const handleMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetTime = ratio * duration;

    setHoverX(e.clientX - rect.left);
    setHoverTime(targetTime);

    if (isDraggingRef.current || e.type === 'click') {
      onScrub(targetTime);
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    isDraggingRef.current = false;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full relative py-1.5 select-none preserve-3d">
      <canvas
        ref={canvasRef}
        className="w-full h-8 cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-lg transition-colors"
        onClick={handleMouseEvent}
        onMouseMove={handleMouseEvent}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => { isDraggingRef.current = true; }}
        onMouseUp={() => { isDraggingRef.current = false; }}
      />
      {hoverTime !== null && duration > 0 && (
        <div 
          style={{ left: `${hoverX}px`, transform: 'translateX(-50%) translateZ(25px)' }}
          className="absolute -top-6 text-[9px] font-bold font-mono bg-black/85 border border-white/10 px-2 py-0.5 rounded text-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-25 pointer-events-none"
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}

export default function TranscriptViewer({ record, onUpdate, onDelete }: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('original');
  const [editedText, setEditedText] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toneMapEnabled, setToneMapEnabled] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  
  // AI triggers states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [tone, setTone] = useState('professional');
  const [aiError, setAiError] = useState<string | null>(null);

  // Ask Copilot chat states
  const [chatThreads, setChatThreads] = useState<Record<string, { role: 'user' | 'assistant'; content: string }[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Track the previous record ID to adjust state when record prop changes (React 19 recommended prop adjustment pattern)
  const [prevRecordId, setPrevRecordId] = useState<string | null>(null);

  // Audio playback controller states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  // Initialize and clean up audio player when selected record changes
  React.useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1.0);

    if (record && record.audio_filename) {
      const audioUrl = api.getAudioUrl(record.audio_filename);
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audioPlayerRef.current = audio;

      const onMetadata = () => {
        setDuration(audio.duration || record.duration);
      };
      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', onMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      if (audio.duration) {
        setDuration(audio.duration);
      } else {
        setDuration(record.duration);
      }

      return () => {
        audio.removeEventListener('loadedmetadata', onMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.pause();
      };
    }
  }, [record]);

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [record]);

  const togglePlay = () => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      playCyberSound('click');
    } else {
      audio.play().catch(err => console.warn("Audio playback blocked:", err));
      setIsPlaying(true);
      playCyberSound('copilot');
    }
  };

  const handleScrub = (time: number) => {
    const audio = audioPlayerRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (rate: number) => {
    const audio = audioPlayerRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
    playCyberSound('click');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (record && record.id !== prevRecordId) {
    setEditedText(record.text);
    setEditedTitle(record.title);
    setActiveTab('original');
    setAiError(null);
    setPrevRecordId(record.id);
  }

  if (!record) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-panel border-white/5 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-violet-600/10 flex items-center justify-center mb-4 border border-violet-500/20 animate-pulse">
          <BookOpen className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Voice Log Selected</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Speak into the microphone above or browse through your recording archive to start exploring real-time transcriptions and AI insights.
        </p>
      </div>
    );
  }

  // Parse translation field from database JSON
  const getTranslationsMap = (): Record<string, string> => {
    if (!record.translation) return {};
    try {
      return JSON.parse(record.translation);
    } catch {
      return {};
    }
  };

  const translations = getTranslationsMap();

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateTranscript(record.id, {
        title: editedTitle,
        text: editedText
      });
      onUpdate(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to save transcript modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIAnalyze = async (action: 'summarize' | 'action_items' | 'translate' | 'fix_grammar') => {
    setLoadingAction(action);
    setAiError(null);
    playCyberSound('laser');
    try {
      const provider = (localStorage.getItem('aiProvider') as 'gemini' | 'deepinfra') || 'gemini';
      const apiKey = localStorage.getItem('aiKey') || '';

      const res = await api.analyze({
        id: record.id,
        action,
        target_lang: action === 'translate' ? targetLang : undefined,
        tone: action === 'fix_grammar' ? tone : undefined,
        provider,
        api_key: apiKey
      });

      onUpdate(res.transcript);
      playCyberSound('chime');
      
      // Auto switch tabs
      if (action === 'summarize') setActiveTab('summary');
      if (action === 'action_items') setActiveTab('action_items');
      if (action === 'translate') setActiveTab('translation');
      if (action === 'fix_grammar') {
        setEditedText(res.result);
        setActiveTab('original');
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'AI engine failed to analyze speech. Check keys.';
      setAiError(errMsg);
    } finally {
      setLoadingAction(null);
    }
  };

  const currentThread = record ? (chatThreads[record.id] || []) : [];

  const handleSendMessage = async (customMessage?: string) => {
    if (!record) return;
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || isSendingChat) return;
    
    if (!customMessage) setChatInput('');
    
    const userMsg = { role: 'user' as const, content: textToSend };
    const initialThread = [...currentThread, userMsg];
    
    // Append placeholder slot for assistant response that we will stream into
    const assistantSlotMsg = { role: 'assistant' as const, content: '' };
    const threadWithPlaceholder = [...initialThread, assistantSlotMsg];
    
    setChatThreads(prev => ({
      ...prev,
      [record.id]: threadWithPlaceholder
    }));
    
    setIsSendingChat(true);
    let accumulatedResponse = "";
    
    try {
      const provider = (localStorage.getItem('aiProvider') as 'gemini' | 'deepinfra') || 'gemini';
      const apiKey = localStorage.getItem('aiKey') || '';
      
      await api.askCopilotStream({
        id: record.id,
        messages: initialThread.map(m => ({ role: m.role, content: m.content })),
        provider,
        api_key: apiKey
      }, (chunk) => {
        accumulatedResponse += chunk;
        setChatThreads(prev => {
          const current = prev[record.id] || [];
          if (current.length === 0) return prev;
          const updated = [...current];
          updated[updated.length - 1] = { role: 'assistant', content: accumulatedResponse };
          return {
            ...prev,
            [record.id]: updated
          };
        });
      });
      
      playCyberSound('copilot');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to Copilot stream.';
      setChatThreads(prev => {
        const current = prev[record.id] || [];
        if (current.length === 0) return prev;
        const updated = [...current];
        updated[updated.length - 1] = { role: 'assistant', content: `⚠️ **Error:** ${errMsg}` };
        return {
          ...prev,
          [record.id]: updated
        };
      });
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'original') textToCopy = editedText;
    else if (activeTab === 'summary') textToCopy = record.summary || '';
    else if (activeTab === 'action_items') textToCopy = record.action_items || '';
    else if (activeTab === 'translation') textToCopy = translations[targetLang] || '';
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (format: 'txt' | 'md' | 'pdf') => {
    let content = '';
    let filename = editedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    if (format === 'txt') {
      content = `TITLE: ${editedTitle}\nDATE: ${record.created_at}\n\nTRANSCRIPT:\n${editedText}`;
      filename += '.txt';
    } else if (format === 'md') {
      content = `# 📄 ${editedTitle}\n\n*Recorded on ${new Date(record.created_at).toLocaleString()}*\n\n`;
      content += `## 🎙️ Transcript\n${editedText}\n\n`;
      if (record.summary) content += `## 📝 AI Summary\n${record.summary}\n\n`;
      if (record.action_items) content += `## ⚙️ AI Action Items\n${record.action_items}\n\n`;
      filename += '.md';
    } else if (format === 'pdf') {
      window.print();
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderToneMapSentences = (text: string) => {
    if (!text || !text.trim()) {
      return <p className="text-gray-500 text-xs italic">No transcription content available to map.</p>;
    }
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 1);

    return sentences.map((sentence, idx) => {
      const sLower = sentence.toLowerCase();
      let toneClass = 'bg-emerald-500/5 border border-emerald-500/15 text-emerald-300/90 shadow-[0_0_6px_rgba(16,185,129,0.03)]';
      let toneLabel = 'Professional 💼';
      
      if (sLower.includes('urgent') || sLower.includes('asap') || sLower.includes('immediately') || sLower.includes('critical') || sLower.includes('must') || sLower.includes('error') || sLower.includes('warning') || sLower.includes('now')) {
        toneClass = 'bg-rose-500/10 border border-rose-500/20 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.05)]';
        toneLabel = 'Urgent 🚨';
      } else if (sLower.includes('excited') || sLower.includes('great') || sLower.includes('awesome') || sLower.includes('happy') || sLower.includes('amazing') || sLower.includes('success') || sLower.includes('launch') || sLower.includes('cool')) {
        toneClass = 'bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.05)]';
        toneLabel = 'Energetic ⚡';
      } else if (sLower.includes('analyze') || sLower.includes('metrics') || sLower.includes('percent') || sLower.includes('study') || sLower.includes('data') || sLower.includes('formula') || sLower.includes('code') || sLower.includes('system') || sLower.includes('test')) {
        toneClass = 'bg-sky-500/10 border border-sky-500/20 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.05)]';
        toneLabel = 'Analytical 🎓';
      } else if (sLower.includes('design') || sLower.includes('aesthetic') || sLower.includes('calm') || sLower.includes('simple') || sLower.includes('creative') || sLower.includes('ideas') || sLower.includes('theme')) {
        toneClass = 'bg-violet-500/10 border border-violet-500/20 text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.05)]';
        toneLabel = 'Creative 💡';
      }

      return (
        <span
          key={idx}
          className={`inline-block mx-0.5 my-1 px-2.5 py-1 rounded-xl transition-all duration-300 hover:scale-101 hover:brightness-110 cursor-help select-none ${toneClass}`}
          title={`Dominant Tone: ${toneLabel}`}
        >
          {sentence}
        </span>
      );
    });
  };

  const handleSpeakMessage = (text: string, idx: number) => {
    if (typeof window === 'undefined') return;

    if (speakingMsgIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(null);
      playCyberSound('click');
    } else {
      window.speechSynthesis.cancel();
      setSpeakingMsgIdx(idx);
      
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_\-]/g, ''));
      utterance.onend = () => {
        setSpeakingMsgIdx(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgIdx(null);
      };
      
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural')) || voices[0];
      if (targetVoice) utterance.voice = targetVoice;
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
      playCyberSound('chime');
    }
  };

  return (
    <article id="transcript-article" className="glass-panel border-white/5 overflow-hidden flex flex-col h-full min-h-[500px] animate-fade-in print:bg-white print:text-black print:shadow-none print:border-none preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
      
      {/* Title & Metadata Header */}
      <div 
        style={{ transform: 'translateZ(25px)', transformStyle: 'preserve-3d' }}
        className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.01] print:border-b-2 print:border-black preserve-3d"
      >
        <div className="flex-1 space-y-1 preserve-3d">
          <input
            type="text"
            id="transcript-title-input"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-white/15 focus:border-violet-500 focus:outline-none text-white focus:ring-0 transition-colors print:text-black print:font-extrabold"
            placeholder="Untitled Transcription"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-400 print:text-black">
            <span>{new Date(record.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>{record.duration.toFixed(1)}s Duration</span>
            <span>•</span>
            <span className="capitalize">{record.language}</span>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getToneDetails(record.text).color}`}>
              {getToneDetails(record.text).label}
            </span>
          </div>

          {/* Dynamic dynamic semantic hashtag tag chips with hover effects */}
          {record.semantic_tags && (
            <div 
              style={{ transform: 'translateZ(38px)' }}
              className="flex flex-wrap gap-1.5 mt-2.5 animate-fade-in print:hidden"
            >
              {(() => {
                try {
                  const tags: string[] = JSON.parse(record.semantic_tags || "[]");
                  return tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => {
                        setActiveTab('copilot');
                        setTimeout(() => {
                          handleSendMessage(`Explain the context of this recording in relation to the topic ${tag}.`);
                        }, 100);
                      }}
                      className="text-[9px] font-extrabold bg-[#8b5cf6]/[0.06] hover:bg-[#8b5cf6]/[0.15] border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/40 px-2.5 py-0.5 rounded-full text-violet-300 hover:text-violet-200 cursor-pointer shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(139,92,246,0.15)] select-none"
                    >
                      {tag}
                    </span>
                  ));
                } catch {
                  return null;
                }
              })()}
            </div>
          )}
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0 print:hidden">
          <button
            id="transcript-save-btn"
            onClick={handleManualSave}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-white/5 flex items-center space-x-1.5 text-xs font-semibold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>
          <button
            id="transcript-delete-btn"
            onClick={() => onDelete(record.id)}
            className="p-2 text-pink-400 hover:text-pink-300 rounded-lg hover:bg-pink-500/10 transition-colors border border-pink-500/10 flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 🎙️ AURA TACTICAL AUDIO PLAYBACK DECK */}
      {record.audio_filename && (
        <div 
          style={{ transform: 'translateZ(22px)', transformStyle: 'preserve-3d' }}
          className="mx-4 my-2 px-4 py-2.5 rounded-xl border border-white/5 bg-gradient-to-r from-[#0d0a1d]/90 to-[#120f26]/90 flex flex-col sm:flex-row items-center gap-3 preserve-3d shadow-lg animate-fade-in print:hidden"
        >
          {/* Left: Play/Pause button */}
          <div className="flex items-center space-x-3 flex-shrink-0 preserve-3d">
            <button
              id="audio-deck-play-btn"
              onClick={togglePlay}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                isPlaying 
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)] animate-pulse'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-violet-500/30'
              }`}
              title={isPlaying ? "Pause audio stream" : "Play back recorded audio"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Time Indicators */}
            <div className="text-[10px] font-mono font-bold text-gray-400 flex flex-col select-none">
              <span className="text-white text-xs leading-none tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-gray-500 text-[8px] mt-0.5 border-t border-white/5 pt-0.5 leading-none">/ {formatTime(duration)}</span>
            </div>
          </div>

          {/* Middle: Canvas Waveform Scrubber */}
          <div className="flex-1 w-full min-w-0">
            <WaveformScrubber 
              currentTime={currentTime}
              duration={duration}
              onScrub={handleScrub}
            />
          </div>

          {/* Right: Playback Speed Selector */}
          <div className="flex items-center space-x-1 bg-black/40 border border-white/5 rounded-lg p-0.5 flex-shrink-0 select-none">
            {[1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                id={`audio-deck-rate-${rate.toFixed(2).replace('.', '-')}-btn`}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold transition-all cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {rate.toFixed(2)}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div 
        style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
        className="flex border-b border-white/5 bg-black/35 overflow-x-auto print:hidden p-1 gap-1 preserve-3d"
      >
        {[
          { id: 'original', name: 'Transcript', icon: FileText },
          { id: 'summary', name: 'AI Summary', icon: Sparkles },
          { id: 'action_items', name: 'Action Items', icon: CheckSquare },
          { id: 'translation', name: 'Translation', icon: Languages },
          { id: 'copilot', name: 'Ask Copilot', icon: MessageSquare },
          { id: 'insights', name: '3D Spectra Analytics', icon: BrainCircuit },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`transcript-tab-${tab.id}-btn`}
              onClick={() => { playCyberSound('click'); setActiveTab(tab.id as TabType); }}
              className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-[#1c1635] to-[#0d0b1a] border border-violet-500/30 text-white shadow-[0_4px_12px_-2px_rgba(139,92,246,0.25),_inset_0_1px_1px_rgba(255,255,255,0.08)] transform translate-y-[0px]'
                  : 'border border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02] hover:translate-y-[-1px]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-gray-500'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Area */}
      <div 
        style={{ transformStyle: 'preserve-3d' }}
        className="flex-1 p-5 relative min-h-[300px] preserve-3d"
      >
        {/* Laser scanner and 3D floating sparks during AI triggers */}
        {loadingAction && <NeuralSynthesizerCanvas actionName={loadingAction} />}

        {/* Tab 1: Original Transcript */}
        {activeTab === 'original' && (
          <div className="h-full flex flex-col space-y-3.5 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
            {/* Tone Map Toggle Switch */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2 select-none print:hidden">
              <span className="text-[10px] text-gray-500 font-extrabold tracking-wider uppercase">Linguistic Transcription</span>
              <div className="flex items-center space-x-2">
                <button
                  id="transcript-edit-mode-btn"
                  onClick={() => { playCyberSound('click'); setToneMapEnabled(false); }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    !toneMapEnabled
                      ? 'bg-violet-600/10 border border-violet-500/20 text-white'
                      : 'border border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  📝 Edit Mode
                </button>
                <button
                  id="transcript-tonemap-btn"
                  onClick={() => { playCyberSound('chime'); setToneMapEnabled(true); }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    toneMapEnabled
                      ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.15)]'
                      : 'border border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  🔮 Tone Map
                </button>
              </div>
            </div>

            {!toneMapEnabled ? (
              <textarea
                id="transcript-text-textarea"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full min-h-[220px] resize-none bg-transparent text-sm leading-relaxed text-gray-200 focus:outline-none border-none p-0 focus:ring-0 placeholder-gray-500 print:text-black print:text-base"
                placeholder="Start typing your voice content here..."
              />
            ) : (
              <div className="w-full h-full min-h-[220px] overflow-y-auto max-h-[35vh] pr-1 space-y-2 text-sm leading-relaxed text-gray-200 print:text-black">
                {renderToneMapSentences(editedText)}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Summary */}
        {activeTab === 'summary' && (
          <div className="h-full prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[40vh] space-y-3 pr-1">
            {record.summary ? (
              // Simple parser for bullet points to show clean visuals
              record.summary.split('\n').map((line, idx) => {
                if (line.startsWith('#')) {
                  const hText = line.replace(/#/g, '').trim();
                  return (
                    <div key={idx} className="flex items-center space-x-2.5 mt-5 mb-3.5 first:mt-2">
                      <span className="w-1.5 h-4 bg-gradient-to-b from-violet-500 to-pink-500 rounded-sm" />
                      <h3 className="text-white font-extrabold text-xs tracking-wider uppercase">{hText}</h3>
                    </div>
                  );
                }
                if (line.startsWith('-') || line.startsWith('*')) {
                  return (
                    <div key={idx} className="flex items-start space-x-3 my-2.5 pl-3 border-l-2 border-violet-500/25 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                      <span className="text-gray-200 text-xs font-medium leading-relaxed">{line.substring(1).trim()}</span>
                    </div>
                  );
                }
                if (line.startsWith('>')) {
                  return (
                    <blockquote key={idx} className="border-l-3 border-pink-500 bg-gradient-to-r from-pink-500/[0.04] to-transparent px-4 py-3 rounded-r-lg text-xs italic my-4 text-gray-300 font-medium">
                      {line.replace(/>/g, '').trim()}
                    </blockquote>
                  );
                }
                return <p key={idx} className="my-2 text-xs text-gray-400 font-normal leading-relaxed">{line}</p>;
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                <p className="text-gray-400 text-xs max-w-xs">
                  Generate a structured, professional executive summary containing key takeaways and priorities.
                </p>
                <button
                  id="summary-generate-btn"
                  onClick={() => handleAIAnalyze('summarize')}
                  disabled={loadingAction !== null}
                  className="px-4 py-2 text-xs font-semibold btn-neon-primary rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  {loadingAction === 'summarize' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                  )}
                  <span>Generate Summary</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Action Items Checklist */}
        {activeTab === 'action_items' && (
          <div className="h-full text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[40vh] space-y-3 pr-1">
            {record.action_items ? (
              record.action_items.split('\n').map((line, idx) => {
                if (line.startsWith('#')) {
                  return (
                    <div key={idx} className="flex items-center space-x-2.5 mt-5 mb-3.5">
                      <span className="w-1.5 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-sm" />
                      <h3 className="text-white font-extrabold text-xs tracking-wider uppercase">{line.replace(/#/g, '').trim()}</h3>
                    </div>
                  );
                }
                if (line.includes('- [ ]') || line.includes('- [x]')) {
                  const checked = line.includes('- [x]');
                  const cleaned = line.replace(/- \[[x ]\]/g, '').trim();
                  // Check if priority exists inside
                  const priorityMatch = cleaned.match(/Priority:\s*`(\w+)`/);
                  const priority = priorityMatch ? priorityMatch[1] : 'Medium';
                  
                  const assigneeMatch = cleaned.match(/Assignee:\s*`([^`]+)`/);
                  const assignee = assigneeMatch ? assigneeMatch[1] : 'Unassigned';
                  
                  const labelText = cleaned.split('|')[0].trim();
                  
                  const badgeColor = 
                    priority.toLowerCase() === 'high' 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.08)]' 
                      : priority.toLowerCase() === 'low' 
                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.08)]' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.08)]';

                  return (
                    <div key={idx} className="flex items-start space-x-3.5 p-3 rounded-xl bg-gradient-to-r from-white/[0.01] to-[#8b5cf6]/[0.01] hover:from-white/[0.03] hover:to-[#8b5cf6]/[0.03] border border-white/5 hover:border-violet-500/15 transition-all duration-300 group my-2.5 shadow-md">
                      <input 
                        type="checkbox" 
                        id={`action-item-checkbox-${idx}`}
                        defaultChecked={checked}
                        className="mt-1 h-4.5 w-4.5 rounded border-gray-600 bg-black/60 text-violet-600 focus:ring-violet-500 cursor-pointer shadow-inner transition-transform group-hover:scale-105"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-semibold leading-relaxed transition-all ${checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                          {labelText}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="flex items-center space-x-1 text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 font-medium">
                            Assignee: <strong className="text-gray-200 ml-1 font-semibold">{assignee}</strong>
                          </span>
                          <span className={`text-[9px] border px-2 py-0.5 rounded font-semibold capitalize ${badgeColor}`}>
                            Priority: {priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return <p key={idx} className="my-1 text-xs text-gray-400 leading-relaxed pl-1">{line}</p>;
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                <p className="text-gray-400 text-xs max-w-xs">
                  Analyze transcripts and automatically isolate deliverables, assignees, deadlines, and priorities.
                </p>
                <button
                  id="action-items-extract-btn"
                  onClick={() => handleAIAnalyze('action_items')}
                  disabled={loadingAction !== null}
                  className="px-4 py-2 text-xs font-semibold btn-neon-primary rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  {loadingAction === 'action_items' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5 text-pink-300" />
                  )}
                  <span>Extract Action Items</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Translations */}
        {activeTab === 'translation' && (
          <div className="h-full text-sm text-gray-300 leading-relaxed overflow-y-auto max-h-[40vh] space-y-4 pr-1">
            {/* Top configuration header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 print:hidden">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Target Language:</span>
                <select
                  id="translation-target-lang-select"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="py-1 px-2 text-xs bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white [&>option]:bg-[#12101f] [&>option]:text-white cursor-pointer"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Chinese">Chinese (Mandarin)</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>

              {translations[targetLang] && (
                <button
                  id="translation-retranslate-btn"
                  onClick={() => handleAIAnalyze('translate')}
                  disabled={loadingAction !== null}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center space-x-1 cursor-pointer"
                >
                  <Loader2 className={`w-3 h-3 ${loadingAction === 'translate' ? 'animate-spin' : 'hidden'}`} />
                  <span>Re-translate</span>
                </button>
              )}
            </div>

            {translations[targetLang] ? (
              <div className="relative p-4 rounded-xl border border-violet-500/10 bg-gradient-to-r from-violet-500/[0.02] to-transparent my-2 min-h-[150px] overflow-hidden">
                {/* Visual side accent border */}
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-pink-500" />
                
                {/* Ambient background watermark icon */}
                <div className="absolute right-4 bottom-4 text-violet-500/5 pointer-events-none">
                  <Languages className="w-24 h-24 stroke-[1]" />
                </div>
                
                <div className="prose prose-invert max-w-none text-xs text-gray-200 leading-relaxed space-y-2 relative z-10">
                  {translations[targetLang].split('\n').map((line, idx) => {
                    if (line.startsWith('#')) {
                      return <h3 key={idx} className="text-white font-extrabold text-xs tracking-wider mt-3 mb-2 uppercase border-b border-white/5 pb-1.5">{line.replace(/#/g, '').trim()}</h3>;
                    }
                    return <p key={idx} className="my-1.5 leading-relaxed font-medium">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
                <p className="text-gray-400 text-xs max-w-xs">
                  Translate the entire text natively into your selected target language with grammatical accuracy.
                </p>
                <button
                  id="translation-translate-btn"
                  onClick={() => handleAIAnalyze('translate')}
                  disabled={loadingAction !== null}
                  className="px-4 py-2 text-xs font-semibold btn-neon-primary rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  {loadingAction === 'translate' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Languages className="w-3.5 h-3.5 text-pink-300" />
                  )}
                  <span>Translate to {targetLang}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Ask AI Copilot Chat */}
        {activeTab === 'copilot' && (
          <div className="flex flex-col h-full min-h-[300px] max-h-[40vh]">
            {/* Scrollable chat content trail */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 max-h-[30vh] min-h-[200px]">
              {currentThread.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="flex flex-col items-center justify-center text-center py-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
                      <MessageSquare className="w-6 h-6 text-violet-400 shadow-sm" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-white text-xs font-extrabold tracking-wider uppercase">Interactive Copilot Chat</h3>
                      <p className="text-gray-400 text-[10px] max-w-xs leading-relaxed">
                        Converse directly with the AI about this transcript. Draft communications, isolate deliverables, or check grammar.
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick-Prompt helper chips */}
                  <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                    {[
                      { label: "📧 Draft Email Summary", text: "Draft a professional email summary of this voice note that I can send to my team." },
                      { label: "📋 Extract Urgent Tasks", text: "Isolate all urgent tasks and follow-up items from this recording." },
                      { label: "🔍 Explain Concepts", text: "Explain the main discussion topics and core concepts covered in this transcript." },
                      { label: "💡 Write Action Draft", text: "Write a high-level action draft or newsletter based on the transcript contents." }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        id={`copilot-quick-prompt-${idx}-btn`}
                        onClick={() => handleSendMessage(chip.text)}
                        className="p-2 text-[10px] font-semibold text-left bg-gradient-to-r from-white/[0.02] to-[#8b5cf6]/[0.01] hover:from-white/[0.04] hover:to-[#8b5cf6]/[0.03] border border-white/5 hover:border-violet-500/20 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentThread.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white shadow-md rounded-tr-none'
                          : 'bg-white/5 border border-white/10 text-gray-200 shadow-md rounded-tl-none font-medium'
                      }`}>
                        {msg.content.split('\n').map((line, lIdx) => {
                          if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
                            return (
                              <div key={lIdx} className="flex items-center space-x-1.5 my-1 pl-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                <span>{line.replace(/- \[[x ]\]/g, '').trim()}</span>
                              </div>
                            );
                          }
                          return <p key={lIdx} className="my-0.5">{line}</p>;
                        })}
                        {msg.role === 'assistant' && msg.content && (
                          <div className="mt-1.5 flex items-center justify-between border-t border-white/5 pt-1 mt-1 text-[8px] text-gray-500 select-none">
                            <span className="font-semibold uppercase tracking-wider">AURA Copilot</span>
                            <div className="flex items-center space-x-1.5">
                              {speakingMsgIdx === idx && (
                                <div className="flex items-end space-x-0.5 h-2 flex-shrink-0 mr-1.5">
                                  <span className="w-0.5 bg-pink-400 rounded-full h-full animate-[wave_0.8s_infinite] origin-bottom" style={{ animationDelay: '0.1s' }} />
                                  <span className="w-0.5 bg-violet-400 rounded-full h-2/3 animate-[wave_0.5s_infinite] origin-bottom" style={{ animationDelay: '0.3s' }} />
                                  <span className="w-0.5 bg-pink-400 rounded-full h-full animate-[wave_0.7s_infinite] origin-bottom" style={{ animationDelay: '0.5s' }} />
                                </div>
                              )}
                              <button
                                id={`copilot-speak-${idx}-btn`}
                                onClick={() => handleSpeakMessage(msg.content, idx)}
                                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all hover:bg-white/5 font-extrabold uppercase tracking-wide text-[7.5px] ${
                                  speakingMsgIdx === idx ? 'text-pink-400 font-bold bg-pink-500/5 border border-pink-500/10' : 'text-gray-500 hover:text-white'
                                }`}
                              >
                                {speakingMsgIdx === idx ? '⏹️ Mute' : '🔊 Speak'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isSendingChat && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 text-gray-400 rounded-xl px-3 py-2 text-xs flex items-center space-x-2 rounded-tl-none font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>Copilot is typing...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input message form */}
            <div className="flex items-center space-x-2 border-t border-white/5 pt-3 mt-3">
              <input
                type="text"
                id="copilot-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask the AI Copilot a question about this log..."
                className="flex-1 py-2 px-3 text-xs bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors"
                disabled={isSendingChat}
              />
              <button
                id="copilot-chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={isSendingChat || !chatInput.trim()}
                className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: 3D Spectra Analytics & Cognitive Insights */}
        {activeTab === 'insights' && (() => {
          // Perform cognitive calculations
          const stopWords = new Set([
            'the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'with', 'was', 'as', 'at', 'by', 'an', 'be', 'are', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'not', 'or', 'if', 'then', 'else', 'we', 'they', 'our', 'your', 'my', 'me', 'us', 'them', 'their', 'there', 'here', 'when', 'where', 'how', 'why', 'what', 'who', 'which', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must', 'about', 'some', 'any', 'all', 'more', 'most', 'no', 'yes', 'so', 'just', 'like', 'go', 'up', 'out', 'down', 'get', 'got', 'make', 'made', 'take', 'took', 'see', 'saw', 'know', 'think', 'say', 'said', 'well', 'want', 'look', 'come', 'came', 'use', 'using', 'used', 'very', 'even', 'also', 'many', 'much', 'some', 'other', 'another', 'into', 'than', 'only', 'new', 'first', 'two', 'three', 'one', 'good', 'great', 'best', 'way', 'work', 'time', 'year', 'day', 'people', 'man', 'woman', 'thing', 'things', 'its', 'into', 'actually', 'basically', 'really', 'just', 'also'
          ]);

          const words = (record.text || '')
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
            .split(/\s+/);
            
          const freq: Record<string, number> = {};
          words.forEach(w => {
            if (w.length > 2 && !stopWords.has(w)) {
              freq[w] = (freq[w] || 0) + 1;
            }
          });

          const sorted = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);
            
          const defaultKeywords = ['AURA', 'Speech', 'Real-time', 'Intelligence', 'Spectra', 'Cognitive', 'Analytics', 'Decoders', 'Next.js', 'Flask'];
          const keywords = sorted.length >= 3 
            ? sorted.map(e => ({ text: e[0], count: e[1] })) 
            : defaultKeywords.map((w, idx) => ({ text: w, count: 5 - (idx % 3) }));

          const wordCount = record.text ? record.text.trim().split(/\s+/).length : 0;
          const wpm = record.duration > 0 ? Math.round(wordCount / (record.duration / 60)) : 0;
          
          let wpmFeedback = "Silence";
          let wpmColor = "text-gray-400";
          if (wpm > 0 && wpm < 100) {
            wpmFeedback = "Deliberate & Calm";
            wpmColor = "text-sky-400";
          } else if (wpm >= 100 && wpm <= 150) {
            wpmFeedback = "Perfect Harmony (Conversational)";
            wpmColor = "text-emerald-400";
          } else if (wpm > 150 && wpm <= 180) {
            wpmFeedback = "Rapid (High Energy)";
            wpmColor = "text-amber-400";
          } else if (wpm > 180) {
            wpmFeedback = "Hyper-Speed (Too Fast)";
            wpmColor = "text-rose-400";
          }

          // Heuristic cognitive indicators
          const lowerText = (record.text || '').toLowerCase();
          
          // Filler words
          const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'really', 'so', 'just', 'you know', 'i mean'];
          let fillerCount = 0;
          fillers.forEach(f => {
            const regex = new RegExp(`\\b${f}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) fillerCount += matches.length;
          });

          // Urgent words
          const urgents = ['urgent', 'asap', 'immediately', 'quick', 'must', 'critical', 'important', 'now'];
          let urgentCount = 0;
          urgents.forEach(u => {
            const regex = new RegExp(`\\b${u}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) urgentCount += matches.length;
          });

          // Professional words
          const professionals = ['agenda', 'deliverable', 'objective', 'roadmap', 'milestone', 'action', 'analysis', 'review', 'synthesize', 'results', 'project', 'strategy', 'client', 'meeting', 'team', 'plan', 'task'];
          let professionalCount = 0;
          professionals.forEach(p => {
            const regex = new RegExp(`\\b${p}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) professionalCount += matches.length;
          });

          // Scores: Confidence, Urgency, Clarity, Professionalism
          const baseConfidence = 88;
          const tempoMod = wpm >= 110 && wpm <= 145 ? 6 : -4;
          const fillerPenalty = Math.min(18, fillerCount * 2.5);
          const confidenceScore = Math.max(60, Math.min(99, Math.round(baseConfidence + tempoMod - fillerPenalty)));

          const baseUrgency = wpm > 155 ? 55 : 30;
          const urgencyScore = Math.max(10, Math.min(100, Math.round(baseUrgency + urgentCount * 12)));

          const clarityScore = Math.max(45, Math.min(98, Math.round(96 - Math.abs(wpm - 125) * 0.35 - fillerCount * 3)));

          const baseProf = 85;
          const profPenalty = Math.min(20, fillerCount * 3);
          const profBonus = Math.min(15, professionalCount * 3.5);
          const professionalismScore = Math.max(50, Math.min(98, Math.round(baseProf - profPenalty + profBonus)));

          // Dynamic sentiment metrics from SQLite/AI or calculation fallback
          let sentimentData = { joy: 60, calm: 70, confident: 75, analytical: 60, urgent: 25 };
          if (record.sentiment_metrics) {
            try {
              sentimentData = JSON.parse(record.sentiment_metrics);
            } catch {}
          } else {
            sentimentData = {
              joy: clarityScore > 85 ? 80 : 60,
              calm: wpm < 130 ? 80 : 60,
              confident: confidenceScore,
              analytical: professionalismScore,
              urgent: urgencyScore
            };
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-[350px] animate-fade-in text-gray-200 preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
              {/* Left Column: 3D Word Sphere */}
              <div 
                style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}
                className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl border border-white/5 bg-black/40 min-h-[300px] relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] preserve-3d hover:border-violet-500/20 hover:shadow-[0_8px_30px_rgba(139,92,246,0.08)] transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-4 bg-gradient-to-b from-violet-500 to-pink-500 rounded-sm" />
                    <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">3D Spectra Vocabulary Orbit</h4>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono font-semibold">
                    {keywords.length} unique nodes
                  </span>
                </div>
                
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                  <ThreeDWordSphere 
                    text={record.text} 
                    onWordClick={(word) => {
                      playCyberSound('copilot');
                      setActiveTab('copilot');
                      setTimeout(() => {
                        handleSendMessage(`Explain the keyword '${word}' in the context of this recording and detail its significance.`);
                      }, 100);
                    }} 
                  />
                </div>
              </div>

              {/* Right Column: Cognitive Metrics & Sentiment Spectrum */}
              <div className="lg:col-span-6 flex flex-col space-y-4 preserve-3d animate-fade-in" style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Speaking Pace & Filler Dashboard */}
                <div 
                  style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}
                  className="p-4 rounded-xl border border-white/5 bg-black/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden preserve-3d hover:border-sky-500/20 hover:shadow-[0_8px_30px_rgba(56,189,248,0.06)] transition-all duration-300"
                >
                  <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
                    <Activity className="w-20 h-20 stroke-[1]" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-4 bg-gradient-to-b from-sky-400 to-blue-500 rounded-sm" />
                      <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">Tempo & Tone Index</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold font-mono">
                      Real-Time Analysis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => {
                        playCyberSound('copilot');
                        setActiveTab('copilot');
                        setTimeout(() => {
                          handleSendMessage(`Analyze the speaking tempo of ${wpm} WPM for this transcription. Tell me if it is effective, and how to improve pace for better audience delivery.`);
                        }, 100);
                      }}
                      style={{ transform: 'translateZ(10px)' }}
                      className="bg-white/[0.02] border border-white/5 hover:border-sky-500/30 hover:shadow-[0_4px_12px_rgba(56,189,248,0.1)] rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300"
                    >
                      <span className="text-[10px] text-gray-400 font-semibold">Speaking Tempo</span>
                      <div className="my-1.5 flex items-baseline space-x-1.5">
                        <span className={`text-2xl font-extrabold tracking-tight ${wpmColor}`}>{wpm}</span>
                        <span className="text-[10px] text-gray-500 font-semibold font-mono">WPM</span>
                      </div>
                      <span className={`text-[10px] font-bold ${wpmColor}`}>{wpmFeedback}</span>
                    </div>

                    <div 
                      onClick={() => {
                        playCyberSound('copilot');
                        setActiveTab('copilot');
                        setTimeout(() => {
                          handleSendMessage(`This transcript contains ${fillerCount} filler words. List all occurrences of filler words, show the sentences containing them, and rewrite those sentences to show how they would sound with professional clarity.`);
                        }, 100);
                      }}
                      style={{ transform: 'translateZ(10px)' }}
                      className="bg-white/[0.02] border border-white/5 hover:border-pink-500/30 hover:shadow-[0_4px_12px_rgba(236,72,153,0.1)] rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300"
                    >
                      <span className="text-[10px] text-gray-400 font-semibold">Linguistic Filler Ratio</span>
                      <div className="my-1.5 flex items-baseline space-x-1.5">
                        <span className={`text-2xl font-extrabold tracking-tight ${fillerCount > 4 ? 'text-pink-400' : 'text-violet-400'}`}>{fillerCount}</span>
                        <span className="text-[10px] text-gray-500 font-semibold font-mono">fillers</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold leading-tight">
                        {fillerCount === 0 
                          ? '🏆 Pristine clarity!' 
                          : fillerCount < 3 
                            ? 'Excellent flow control' 
                            : 'Consider slow pausing'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linguistic Sentiment Speedometer */}
                <div 
                  id="sentiment-radar-card"
                  style={{ transform: 'translateZ(42px)', transformStyle: 'preserve-3d' }}
                  className="p-4 rounded-xl border border-white/5 bg-black/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col preserve-3d hover:border-violet-500/20 hover:shadow-[0_8px_30px_rgba(139,92,246,0.08)] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-4 bg-gradient-to-b from-violet-500 to-pink-500 rounded-sm" />
                      <h3 className="text-white font-extrabold text-xs tracking-wider uppercase">Linguistic Sentiment Speedometer Gauge</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[160px]">
                    <LinguisticSentimentSpeedometer sentiment={sentimentData} />
                  </div>
                </div>

                {/* Sentiment Sentence Timeline */}
                <div 
                  id="sentiment-timeline-card"
                  style={{ transform: 'translateZ(32px)', transformStyle: 'preserve-3d' }}
                  className="p-4 rounded-xl border border-white/5 bg-black/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col preserve-3d hover:border-pink-500/20 hover:shadow-[0_8px_30px_rgba(236,72,153,0.08)] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-4 bg-gradient-to-b from-pink-400 to-rose-500 rounded-sm" />
                      <h3 className="text-white font-extrabold text-xs tracking-wider uppercase">Linguistic Sentiment Trend Timeline</h3>
                    </div>
                  </div>
                  
                  <div className="h-[75px]">
                    <SentimentTimeline text={record.text} />
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </div>

      {/* Error Panel for AI processing failures */}
      {aiError && (
        <div className="mx-5 mb-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg text-xs text-pink-300 animate-fade-in print:hidden">
          <strong>AI Insight Error:</strong> {aiError}
        </div>
      )}

      {/* Footer Controls & Export Options */}
      <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/30 print:hidden">
        
        {/* Left Side: Copy/Tones triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tone Fixer (only show when on main Transcript Tab) */}
          {activeTab === 'original' && (
            <div className="flex items-center space-x-1 border border-white/5 rounded-lg bg-black/40 p-1 flex-shrink-0">
              <select
                id="tone-polish-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="py-1 px-1.5 text-[10px] bg-transparent focus:outline-none text-gray-300 cursor-pointer [&>option]:bg-[#12101f] [&>option]:text-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual Tone</option>
                <option value="academic">Academic</option>
              </select>
              <button
                id="grammar-polish-btn"
                onClick={() => handleAIAnalyze('fix_grammar')}
                disabled={loadingAction !== null || !editedText.trim()}
                className="py-1 px-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 transition-colors disabled:opacity-50"
              >
                {loadingAction === 'fix_grammar' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <FileCheck2 className="w-3 h-3 text-pink-200" />
                )}
                <span>Polish Grammar</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Exports */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            id="export-copy-btn"
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Copy current view to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <button
            id="export-txt-btn"
            onClick={() => handleDownload('txt')}
            className="px-3.5 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Download formatted Plain Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>

          <button
            id="export-markdown-btn"
            onClick={() => handleDownload('md')}
            className="px-3 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Download detailed Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
        </div>
      </div>
    </article>
  );
}
