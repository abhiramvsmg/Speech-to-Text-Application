'use client';

import React, { useEffect, useState } from 'react';
import { X, Key, Shield, Settings, Sliders, Volume2, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [sttEngine, setSttEngine] = useState('local');
  const [sttKey, setSttKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiKey, setAiKey] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [visualizerStyle, setVisualizerStyle] = useState('sine');

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSttEngine(localStorage.getItem('sttEngine') || 'local');
      setSttKey(localStorage.getItem('sttKey') || '');
      setAiProvider(localStorage.getItem('aiProvider') || 'gemini');
      setAiKey(localStorage.getItem('aiKey') || '');
      setLanguage(localStorage.getItem('language') || 'en-US');
      setVisualizerStyle(localStorage.getItem('visualizerStyle') || 'sine');
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('sttEngine', sttEngine);
    localStorage.setItem('sttKey', sttKey);
    localStorage.setItem('aiProvider', aiProvider);
    localStorage.setItem('aiKey', aiKey);
    localStorage.setItem('language', language);
    localStorage.setItem('visualizerStyle', visualizerStyle);
    
    // Dispatch custom event to notify other components of preference updates
    window.dispatchEvent(new Event('settings-updated'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-600/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">System Engine Hub</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Section 1: Speech Engine */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Volume2 className="w-4 h-4" />
              <span>Speech Recognition Engine</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'local', name: 'Free (Google)' },
                { id: 'deepgram', name: 'Deepgram' },
                { id: 'deepinfra', name: 'DeepInfra' },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => setSttEngine(engine.id)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                    sttEngine === engine.id
                      ? 'border-violet-500 bg-violet-500/10 text-white shadow-[0_0_10px_0_rgba(139,92,246,0.2)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {engine.name}
                </button>
              ))}
            </div>

            {sttEngine !== 'local' && (
              <div className="mt-2 space-y-1.5">
                <label className="text-xs text-gray-300 flex items-center space-x-1">
                  <Key className="w-3 h-3 text-pink-400" />
                  <span>{sttEngine === 'deepgram' ? 'Deepgram' : 'DeepInfra'} API Token</span>
                </label>
                <input
                  type="password"
                  value={sttKey}
                  onChange={(e) => setSttKey(e.target.value)}
                  placeholder={`Paste your secret ${sttEngine} token...`}
                  className="w-full py-2 px-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Section 2: AI Settings */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Sparkles className="w-4 h-4" />
              <span>AI Smart Analytics</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gemini', name: 'Google Gemini' },
                { id: 'deepinfra', name: 'DeepInfra LLM' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => setAiProvider(prov.id)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                    aiProvider === prov.id
                      ? 'border-pink-500 bg-pink-500/10 text-white shadow-[0_0_10px_0_rgba(236,72,153,0.15)]'
                      : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {prov.name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 flex items-center space-x-1">
                <Key className="w-3 h-3 text-pink-400" />
                <span>{aiProvider === 'gemini' ? 'Gemini' : 'DeepInfra'} API Key</span>
              </label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="Paste key to activate advanced analytics... (Optional)"
                className="w-full py-2 px-3 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-pink-500 text-white transition-colors"
              />
              <p className="text-[10px] text-gray-500 italic">
                * If left blank, a powerful local Heuristic AI engine will run as fallback to showcase insights.
              </p>
            </div>
          </div>

          {/* Section 3: Speech Language */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="text-sm font-semibold tracking-wider text-violet-400 flex items-center space-x-1.5 uppercase">
              <Sliders className="w-4 h-4" />
              <span>Language & Visuals</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300">Spoken Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-2 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors [&>option]:bg-[#12101f] [&>option]:text-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                  <option value="ja-JP">Japanese (Japan)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="zh-CN">Chinese (Mandarin)</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-300">Audio Visualizer</label>
                <select
                  value={visualizerStyle}
                  onChange={(e) => setVisualizerStyle(e.target.value)}
                  className="w-full py-2 px-2 text-sm bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-violet-500 text-white transition-colors [&>option]:bg-[#12101f] [&>option]:text-white"
                >
                  <option value="sine">Cyber Sine Wave</option>
                  <option value="bars">Neon Frequency Bars</option>
                  <option value="circle">Glow Pulsing Ring</option>
                  <option value="3d-spectrogram">3D Cascading Terrain</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold btn-neon-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold btn-neon-primary rounded-lg"
          >
            Apply Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
