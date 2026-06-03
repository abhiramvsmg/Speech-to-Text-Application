import os
import sqlite3
import json
from datetime import datetime
import uuid

# Define database file path
DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
DB_PATH = os.path.join(DB_DIR, 'database.db')
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Create necessary directories
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

def get_db_connection():
    """Establishes a high-performance SQLite database connection in WAL mode."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    
    # --- HIGH-PERFORMANCE PRAGMA OPTIMIZATIONS ---
    # WAL mode allows concurrent reads while writing is active
    conn.execute("PRAGMA journal_mode=WAL")
    # Synchronous NORMAL speeds up writes significantly without data risk in WAL mode
    conn.execute("PRAGMA synchronous=NORMAL")
    # Memory storage for temp tables increases index query speeds
    conn.execute("PRAGMA temp_store=MEMORY")
    # Cache up to 2000 pages (approx 8MB RAM buffering)
    conn.execute("PRAGMA cache_size=-2000")
    
    return conn

def init_db():
    """Initializes the database schema if it doesn't already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create transcripts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            duration REAL NOT NULL,
            created_at TEXT NOT NULL,
            language TEXT NOT NULL,
            summary TEXT,
            action_items TEXT,
            translation TEXT,
            audio_filename TEXT,
            user_id TEXT,
            sentiment_metrics TEXT,
            semantic_tags TEXT
        )
    ''')
    
    # Self-healing migration for existing databases: dynamically add user_id column if missing
    try:
        cursor.execute("ALTER TABLE transcripts ADD COLUMN user_id TEXT")
        print("[Database] Dynamic migration: Added user_id column to transcripts table.")
    except sqlite3.OperationalError:
        pass

    # Self-healing migration: dynamically add sentiment_metrics column if missing
    try:
        cursor.execute("ALTER TABLE transcripts ADD COLUMN sentiment_metrics TEXT")
        print("[Database] Dynamic migration: Added sentiment_metrics column.")
    except sqlite3.OperationalError:
        pass

    # Self-healing migration: dynamically add semantic_tags column if missing
    try:
        cursor.execute("ALTER TABLE transcripts ADD COLUMN semantic_tags TEXT")
        print("[Database] Dynamic migration: Added semantic_tags column.")
    except sqlite3.OperationalError:
        pass
        
    # Create speed indexes for high-volume query vector indexing
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at)')
    
    conn.commit()
    conn.close()
    print("Database initialized and speed-indexed successfully at:", DB_PATH)

def save_transcript(title, text, duration, language, audio_filename=None, summary=None, action_items=None, translation=None, user_id=None, sentiment_metrics=None, semantic_tags=None):
    """Saves a new transcript to the database."""
    transcript_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO transcripts (id, title, text, duration, created_at, language, summary, action_items, translation, audio_filename, user_id, sentiment_metrics, semantic_tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (transcript_id, title, text, duration, created_at, language, summary, action_items, translation, audio_filename, user_id, sentiment_metrics, semantic_tags))
    
    conn.commit()
    conn.close()
    
    return get_transcript(transcript_id)

def get_transcripts(search_query=None, user_id=None):
    """Retrieves all transcripts, optionally filtered by a search query and scoped to a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        # Filter for transcripts matching user_id or public transcripts
        if search_query:
            cursor.execute('''
                SELECT * FROM transcripts 
                WHERE (user_id = ? OR user_id IS NULL) AND (title LIKE ? OR text LIKE ?) 
                ORDER BY created_at DESC
            ''', (user_id, f'%{search_query}%', f'%{search_query}%'))
        else:
            cursor.execute('''
                SELECT * FROM transcripts 
                WHERE user_id = ? OR user_id IS NULL 
                ORDER BY created_at DESC
            ''', (user_id,))
    else:
        if search_query:
            # Simple case-insensitive search in title or text
            cursor.execute('''
                SELECT * FROM transcripts 
                WHERE title LIKE ? OR text LIKE ? 
                ORDER BY created_at DESC
            ''', (f'%{search_query}%', f'%{search_query}%'))
        else:
            cursor.execute('SELECT * FROM transcripts ORDER BY created_at DESC')
        
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_transcript(transcript_id):
    """Retrieves a single transcript by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM transcripts WHERE id = ?', (transcript_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def update_transcript(transcript_id, title=None, text=None, summary=None, action_items=None, translation=None, sentiment_metrics=None, semantic_tags=None):
    """Updates an existing transcript with new title, text, or AI attributes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fields = []
    values = []
    
    if title is not None:
        fields.append("title = ?")
        values.append(title)
    if text is not None:
        fields.append("text = ?")
        values.append(text)
    if summary is not None:
        fields.append("summary = ?")
        values.append(summary)
    if action_items is not None:
        fields.append("action_items = ?")
        values.append(action_items)
    if translation is not None:
        fields.append("translation = ?")
        values.append(translation)
    if sentiment_metrics is not None:
        fields.append("sentiment_metrics = ?")
        values.append(sentiment_metrics)
    if semantic_tags is not None:
        fields.append("semantic_tags = ?")
        values.append(semantic_tags)
        
    if not fields:
        conn.close()
        return get_transcript(transcript_id)
        
    values.append(transcript_id)
    query = f"UPDATE transcripts SET {', '.join(fields)} WHERE id = ?"
    
    cursor.execute(query, tuple(values))
    conn.commit()
    conn.close()
    
    return get_transcript(transcript_id)

def clear_transcript_audio(transcript_id):
    """Sets the audio_filename of a transcript to NULL, indicating it has been pruned."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE transcripts SET audio_filename = NULL WHERE id = ?', (transcript_id,))
    conn.commit()
    conn.close()
    return get_transcript(transcript_id)

def delete_transcript(transcript_id):
    """Deletes a transcript by ID and returns its audio filename if present."""
    transcript = get_transcript(transcript_id)
    if not transcript:
        return False, None
        
    audio_filename = transcript.get('audio_filename')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transcripts WHERE id = ?', (transcript_id,))
    conn.commit()
    conn.close()
    
    return True, audio_filename
