'use client';

import React, { useEffect, useRef } from 'react';

export default function AmbientKineticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;
    
    // Mouse tracking vector
    const mouse = { x: -1000, y: -1000, radius: 150 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Fetch dynamic HSL color mappings based on active settings theme variables
    const getThemeColors = () => {
      if (typeof window === 'undefined') return { primary: '#8b5cf6', secondary: '#ec4899' };
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue('--glow-primary').trim() || '#8b5cf6';
      const secondary = style.getPropertyValue('--glow-secondary').trim() || '#ec4899';
      return { primary, secondary };
    };

    // Initialize 45 cosmic dust floating nodes
    const particleCount = 45;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
      originalVx: number;
      originalVy: number;
      repelTimer: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const vx = (Math.random() - 0.5) * 0.4;
      const vy = (Math.random() - 0.5) * 0.4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx,
        vy,
        originalVx: vx,
        originalVy: vy,
        radius: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        repelTimer: 0
      });
    }

    // Interactive grav ripples
    const ripples: { x: number; y: number; progress: number; maxRadius: number; speed: number }[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        progress: 0,
        maxRadius: 180,
        speed: 4.5
      });
      playCyberRippleForce(e.clientX, e.clientY);
    };

    const playCyberRippleForce = (cx: number, cy: number) => {
      particles.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220 && dist > 10) {
          const force = (220 - dist) / 220;
          p.vx += (dx / dist) * force * 3.5;
          p.vy += (dy / dist) * force * 3.5;
          p.repelTimer = 60; // 1 second dampening
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const colors = getThemeColors();
      
      // Update and draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.progress += r.speed;
        
        if (r.progress >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        
        const alpha = 1 - r.progress / r.maxRadius;
        ctx.strokeStyle = `color-mix(in srgb, ${colors.primary} ${alpha * 100}%, transparent)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.progress, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Connect floating nodes
      ctx.lineWidth = 0.45;
      for (let i = 0; i < particleCount; i++) {
        const pA = particles[i];
        
        for (let j = i + 1; j < particleCount; j++) {
          const pB = particles[j];
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.08;
            ctx.strokeStyle = `color-mix(in srgb, ${colors.primary} ${alpha * 100}%, transparent)`;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }

        // Connect node to mouse cursor
        if (mouse.x > 0) {
          const dx = pA.x - mouse.x;
          const dy = pA.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.15;
            ctx.strokeStyle = `color-mix(in srgb, ${colors.secondary} ${alpha * 100}%, transparent)`;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        
        // Stabilize velocity slowly back to original drift pace
        if (p.repelTimer > 0) {
          p.repelTimer--;
          p.vx += (p.originalVx - p.vx) * 0.05;
          p.vy += (p.originalVy - p.vy) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce particles off the walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        p.pulse += p.pulseSpeed;
        const radius = p.radius + Math.sin(p.pulse) * 0.45;
        
        ctx.fillStyle = `color-mix(in srgb, ${colors.primary} 60%, transparent)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-screen h-screen z-[-3] pointer-events-none bg-transparent"
    />
  );
}
