'use client';

import React, { useRef, useState, useEffect } from 'react';

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // Maximum rotation in degrees
}

export default function Tilt3D({ children, className = '', intensity = 6 }: Tilt3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)',
  });
  const [isMobile, setIsMobile] = useState(false);

  // Simple feature detection for touch devices to bypass tilts and avoid layout jitter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(
          ('ontouchstart' in window) || 
          (navigator.maxTouchPoints > 0)
        );
      };
      checkMobile();
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor X relative to element
    const y = e.clientY - rect.top;  // cursor Y relative to element

    // Normalize coordinates: -0.5 is left/top boundary, 0.5 is right/bottom boundary
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;

    // Calculate rotation angles (X rotation comes from Y coordinate, Y rotation from X coordinate)
    const rotateX = -yc * intensity;
    const rotateY = xc * intensity;

    // Direct hardware-accelerated transform style
    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`);

    // Reflective glare shine gradient following cursor vectors
    const glx = (x / rect.width) * 100;
    const gly = (y / rect.height) * 100;

    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${glx}% ${gly}%, rgba(255, 255, 255, 0.12) 0%, transparent 55%)`,
    });
  };

  const handleMouseLeave = () => {
    // Graceful spring fallback back to flat equilibrium state
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle(prev => ({
      ...prev,
      opacity: 0,
    }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden preserve-3d transition-shadow duration-300 ${className}`}
    >
      {/* Dynamic reflective glare shine overlay */}
      {!isMobile && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
          style={glareStyle}
        />
      )}
      
      {/* 3D Inner Content Panel */}
      <div 
        style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
