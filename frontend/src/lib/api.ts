const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Keep port 5000 for backend
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const API_BASE = getApiBase();

const getUserHeaders = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      return { 'X-User-ID': mockUser };
    }
  }
  return {};
};

export interface TranscriptRecord {
  id: string;
  title: string;
  text: string;
  duration: number;
  created_at: string;
  language: string;
  summary: string | null;
  action_items: string | null;
  translation: string | null; // JSON String mapping lang -> translated text
  audio_filename: string | null;
  sentiment_metrics?: string | null;
  semantic_tags?: string | null;
}

export interface TranscriptionResponse {
  status: string;
  transcript: TranscriptRecord;
}

export interface AIResponse {
  status: string;
  result: string;
  transcript: TranscriptRecord;
}

export const api = {
  /** Health check */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },

  /** Fetch real-time system stats */
  async getStats(): Promise<{
    total_logs: number;
    pruned_logs: number;
    active_audio_logs: number;
    total_duration: number;
    audio_size_mb: number;
    db_size_kb: number;
    ffmpeg_installed: boolean;
    max_storage_mb: number;
    max_files: number;
  }> {
    const response = await fetch(`${API_BASE}/api/stats`);
    if (!response.ok) {
      throw new Error('Failed to retrieve system stats');
    }
    const data = await response.json();
    return data.stats;
  },

  /** Upload audio file for speech-to-text transcription */
  async transcribe(
    file: File, 
    engine: string = 'local', 
    apiKey: string = '', 
    language: string = 'en-US'
  ): Promise<TranscriptRecord> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers: Record<string, string> = {
      'X-STT-Engine': engine,
      'X-Language': language,
      ...getUserHeaders(),
    };

    if (apiKey) {
      headers['X-STT-Key'] = apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Transcription failed with status ${response.status}`);
      }

      const data: TranscriptionResponse = await response.json();
      return data.transcript;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Transcription request timed out. Using high-fidelity local browser fallback.');
      }
      throw err;
    }
  },

  /** Save a text transcript directly (SpeechRecognition fallback) */
  async saveRawTranscript(params: {
    title?: string;
    text: string;
    duration: number;
    language: string;
    stt_engine?: string;
    stt_key?: string;
  }): Promise<TranscriptRecord> {
    const response = await fetch(`${API_BASE}/api/transcripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getUserHeaders(),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Saving transcript failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.transcript;
  },

  /** Request AI analysis (summary, translation, TODOs, grammar) */
  async analyze(params: {
    id: string;
    action: 'summarize' | 'translate' | 'action_items' | 'fix_grammar';
    target_lang?: string;
    tone?: string;
    provider?: 'gemini' | 'deepinfra';
    api_key?: string;
  }): Promise<AIResponse> {
    const response = await fetch(`${API_BASE}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `AI processing failed with status ${response.status}`);
    }

    return response.json();
  },

  /** Fetch all transcripts, optional search query */
  async listTranscripts(searchQuery: string = ''): Promise<TranscriptRecord[]> {
    const url = searchQuery 
      ? `${API_BASE}/api/transcripts?q=${encodeURIComponent(searchQuery)}` 
      : `${API_BASE}/api/transcripts`;
      
    const response = await fetch(url, {
      headers: getUserHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to retrieve transcripts');
    }
    return response.json();
  },

  /** Fetch single transcript */
  async getTranscript(id: string): Promise<TranscriptRecord> {
    const response = await fetch(`${API_BASE}/api/transcripts/${id}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve transcript');
    }
    return response.json();
  },

  /** Manually update transcript text or title */
  async updateTranscript(id: string, payload: { title?: string; text?: string }): Promise<TranscriptRecord> {
    const response = await fetch(`${API_BASE}/api/transcripts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to update transcript');
    }
    return response.json();
  },

  /** Delete transcript from database & server storage */
  async deleteTranscript(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/transcripts/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  },

  /** Converse with the AI Copilot about a specific transcript */
  async askCopilot(params: {
    id: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    provider?: 'gemini' | 'deepinfra';
    api_key?: string;
  }): Promise<{ status: string; result: string }> {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Copilot chat failed with status ${response.status}`);
    }

    return response.json();
  },

  /** Converse with the AI Copilot with token streaming (SSE) */
  async askCopilotStream(
    params: {
      id: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
      provider?: 'gemini' | 'deepinfra';
      api_key?: string;
    },
    onChunk: (text: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Streaming chat failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is not readable");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Save last unfinished line back to the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const rawJson = trimmed.slice(6);
            const data = JSON.parse(rawJson);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.chunk) {
              onChunk(data.chunk);
            }
          } catch (err) {
            console.warn("Failed to parse SSE JSON line:", err);
          }
        }
      }
    }
  },

  /** Get streamable URL for playing back saved WAV file */
  getAudioUrl(filename: string): string {
    return `${API_BASE}/api/audio/${filename}`;
  }
};
