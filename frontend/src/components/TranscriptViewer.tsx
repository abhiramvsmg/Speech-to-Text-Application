'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, FileText, Clipboard, Download, Check, 
  BookOpen, CheckSquare, Languages, FileCheck2, Loader2, Save, Trash2
} from 'lucide-react';
import { api, TranscriptRecord } from '@/lib/api';

interface TranscriptViewerProps {
  record: TranscriptRecord | null;
  onUpdate: (updated: TranscriptRecord) => void;
  onDelete: (id: string) => void;
}

type TabType = 'original' | 'summary' | 'action_items' | 'translation' | 'polished';

export default function TranscriptViewer({ record, onUpdate, onDelete }: TranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('original');
  const [editedText, setEditedText] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // AI triggers states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [tone, setTone] = useState('professional');
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setEditedText(record.text);
      setEditedTitle(record.title);
      // Reset back to original tab when changing records
      setActiveTab('original');
      setAiError(null);
    }
  }, [record]);

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
      
      // Auto switch tabs
      if (action === 'summarize') setActiveTab('summary');
      if (action === 'action_items') setActiveTab('action_items');
      if (action === 'translate') setActiveTab('translation');
      if (action === 'fix_grammar') {
        setEditedText(res.result);
        setActiveTab('original');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI engine failed to analyze speech. Check keys.');
    } finally {
      setLoadingAction(null);
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

  return (
    <div className="glass-panel border-white/5 overflow-hidden flex flex-col h-full min-h-[500px] animate-fade-in print:bg-white print:text-black print:shadow-none print:border-none">
      
      {/* Title & Metadata Header */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.01] print:border-b-2 print:border-black">
        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-white/15 focus:border-violet-500 focus:outline-none text-white focus:ring-0 transition-colors print:text-black print:font-extrabold"
            placeholder="Untitled Transcription"
          />
          <div className="flex items-center space-x-3 text-xs text-gray-400 print:text-black">
            <span>{new Date(record.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>{record.duration.toFixed(1)}s Duration</span>
            <span>•</span>
            <span className="capitalize">{record.language}</span>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center space-x-2 flex-shrink-0 print:hidden">
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-white/5 flex items-center space-x-1.5 text-xs font-semibold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>
          <button
            onClick={() => onDelete(record.id)}
            className="p-2 text-pink-400 hover:text-pink-300 rounded-lg hover:bg-pink-500/10 transition-colors border border-pink-500/10 flex items-center space-x-1.5 text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-white/5 bg-black/35 overflow-x-auto print:hidden p-1 gap-1">
        {[
          { id: 'original', name: 'Transcript', icon: FileText },
          { id: 'summary', name: 'AI Summary', icon: Sparkles },
          { id: 'action_items', name: 'Action Items', icon: CheckSquare },
          { id: 'translation', name: 'Translation', icon: Languages },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
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
      <div className="flex-1 p-5 relative min-h-[300px]">
        {/* Laser scanner and 3D floating sparks during AI triggers */}
        {loadingAction && (
          <div className="absolute inset-0 bg-[#08060f]/20 backdrop-blur-[1px] flex flex-col items-center justify-center pointer-events-none z-20">
            <div className="relative w-full h-full overflow-hidden">
              {/* Scan laser */}
              <div className="scan-line" />
              
              {/* Floating micro HSL glowing particles */}
              {[...Array(12)].map((_, i) => {
                const size = Math.random() * 5 + 3;
                const left = Math.random() * 100;
                const delay = Math.random() * 2;
                const duration = Math.random() * 1.5 + 1.5;
                return (
                  <div
                    key={i}
                    className="absolute bottom-0 rounded-full bg-gradient-to-tr from-violet-400 to-pink-400 animate-shimmer-particle"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      left: `${left}%`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      boxShadow: '0 0 10px 1px rgba(139, 92, 246, 0.5)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Original Transcript */}
        {activeTab === 'original' && (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-full min-h-[250px] resize-none bg-transparent text-sm leading-relaxed text-gray-200 focus:outline-none border-none p-0 focus:ring-0 placeholder-gray-500 print:text-black print:text-base"
            placeholder="Start typing your voice content here..."
          />
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
                      <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">{hText}</h4>
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
                      <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">{line.replace(/#/g, '').trim()}</h4>
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
                      return <h4 key={idx} className="text-white font-extrabold text-xs tracking-wider mt-3 mb-2 uppercase border-b border-white/5 pb-1.5">{line.replace(/#/g, '').trim()}</h4>;
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
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="py-1 px-1.5 text-[10px] bg-transparent focus:outline-none text-gray-300 cursor-pointer [&>option]:bg-[#12101f] [&>option]:text-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual Tone</option>
                <option value="academic">Academic</option>
              </select>
              <button
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
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Copy current view to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <button
            onClick={() => handleDownload('txt')}
            className="px-3.5 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Download formatted Plain Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>

          <button
            onClick={() => handleDownload('md')}
            className="px-3 py-2 text-xs font-semibold btn-neon-secondary rounded-lg flex items-center space-x-1.5"
            title="Download detailed Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
        </div>
      </div>
    </div>
  );
}
