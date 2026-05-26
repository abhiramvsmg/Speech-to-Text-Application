const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    const response = await fetch(`${API_BASE}/api/transcribe`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Transcription failed with status ${response.status}`);
    }

    const data: TranscriptionResponse = await response.json();
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

  /** Get streamable URL for playing back saved WAV file */
  getAudioUrl(filename: string): string {
    return `${API_BASE}/api/audio/${filename}`;
  }
};
