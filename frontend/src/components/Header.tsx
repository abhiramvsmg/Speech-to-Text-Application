'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Sparkles, Wifi, WifiOff, ShieldCheck, User } from 'lucide-react';
import { api } from '@/lib/api';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mockUser');
    }
    return null;
  });

  // Poll backend health status
  useEffect(() => {
    const checkConnection = async () => {
      const isOnline = await api.checkHealth();
      setIsServerOnline(isOnline);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const handleToggleUser = () => {
    if (currentUser) {
      localStorage.removeItem('mockUser');
      setCurrentUser(null);
    } else {
      const user = 'Abhir';
      localStorage.setItem('mockUser', user);
      setCurrentUser(user);
    }
  };

  return (
    <header className="glass-panel border-white/5 bg-black/40 p-4 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden animate-fade-in print:hidden">
      {/* Dynamic top logo glow accent */}
      <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-violet-600/10 to-transparent blur-md pointer-events-none" />

      {/* Brand Logo */}
      <div className="flex items-center space-x-2.5 z-10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-[0_0_12px_1px_rgba(139,92,246,0.3)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white">
            AURA<span className="text-pink-500 font-extrabold">.transcript</span>
          </h1>
          <p className="text-[9px] text-gray-500 tracking-widest font-semibold uppercase">Global AI Transcription Suite</p>
        </div>
      </div>

      {/* Control Actions / Statuses */}
      <div className="flex items-center space-x-3.5 z-10">
        {/* Connection status indicator badge */}
        <div 
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold transition-all ${
            isServerOnline
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
          }`}
          title={isServerOnline ? 'Local Flask server is online' : 'Local Flask server is offline'}
        >
          {isServerOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">Engine Active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 animate-pulse" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Multi-user mock profile trigger */}
        <button
          id="header-profile-btn"
          onClick={handleToggleUser}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs transition-all ${
            currentUser
              ? 'bg-violet-600/20 border-violet-500/30 text-white'
              : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
          }`}
          title={currentUser ? `Logged in as ${currentUser}` : 'Log in mock identity'}
        >
          {currentUser ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span className="font-semibold text-[11px] truncate max-w-[80px]">{currentUser}</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span className="font-medium text-[11px]">Guest Profile</span>
            </>
          )}
        </button>

        {/* Settings button */}
        <button
          id="header-settings-btn"
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-all hover:scale-105"
          title="Adjust engines & keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
