import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Import database and service modules
from database import (
    init_db, save_transcript, get_transcripts, 
    get_transcript, update_transcript, delete_transcript, UPLOADS_DIR
)
from services.audio_service import AudioService
from services.stt_service import STTService
from services.ai_service import AIService

# Load server-side environmental variables
load_dotenv()

app = Flask(__name__)
# Enable CORS globally for all endpoints and origins
CORS(app)

# Initialize database schema
init_db()

@app.route('/api/health', methods=['GET'])
def health():
    """Verify that backend server is alive and responding."""
    return jsonify({"status": "healthy", "service": "Speech-to-Text Backend"}), 200

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """
    Endpoint for uploading audio file.
    Accepts multipart/form-data with a 'file' parameter.
    Headers can contain:
      - 'X-STT-Engine': Engine to use (local, deepgram, deepinfra)
      - 'X-STT-Key': Optional Client API key
      - 'X-Language': Default language code (e.g. en-US)
    """
    # 1. File validation
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
        
    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    # Get request configurations from headers
    stt_engine = request.headers.get('X-STT-Engine', 'local')
    stt_key = request.headers.get('X-STT-Key')
    lang_code = request.headers.get('X-Language', 'en-US')
    user_id = request.headers.get('X-User-ID')
    
    # Generate stable unique identifiers
    file_id = os.urandom(8).hex()
    original_extension = os.path.splitext(uploaded_file.filename)[1] or ".webm"
    temp_filename = f"raw_{file_id}{original_extension}"
    target_filename = f"conv_{file_id}.wav"
    
    temp_path = os.path.join(UPLOADS_DIR, temp_filename)
    target_path = os.path.join(UPLOADS_DIR, target_filename)
    
    try:
        # Save raw browser audio file
        uploaded_file.save(temp_path)
        print(f"[App] Saved raw audio to {temp_path}")
        
        # 2. Format conversion and duration retrieval
        duration, conversion_error = AudioService.process_audio(temp_path, target_path)
        
        # Remove original raw file to conserve storage
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        if conversion_error:
            return jsonify({"error": conversion_error}), 422
            
        # 3. Transcribe audio
        transcription_result = STTService.transcribe(
            audio_path=target_path,
            engine=stt_engine,
            api_key=stt_key,
            language=lang_code
        )
        
        text = transcription_result.get("text", "").strip()
        confidence = transcription_result.get("confidence", 1.0)
        
        # Guard for empty speech
        if not text:
            # We still want to let them save, but notify them
            text = "[No speech detected in audio recording]"
            
        # 4. Save to Database
        # Default title based on time and duration
        from datetime import datetime
        time_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        title = f"Voice Recording {time_str}"
        
        record = save_transcript(
            title=title,
            text=text,
            duration=duration,
            language=lang_code,
            audio_filename=target_filename,
            user_id=user_id
        )
        
        return jsonify({
            "status": "success",
            "transcript": record
        }), 201
        
    except Exception as e:
        print(f"[App] Transcription endpoint error: {e}")
        # Clean up files in case of crash
        if os.path.exists(temp_path): os.remove(temp_path)
        if os.path.exists(target_path): os.remove(target_path)
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai/analyze', methods=['POST'])
def analyze_transcript():
    """
    Endpoint for performing AI operations (Summarize, Translate, etc.)
    Accepts: JSON body with:
      - 'id': ID of the transcript
      - 'action': 'summarize', 'translate', 'action_items', 'fix_grammar'
      - 'target_lang': Language (for 'translate')
      - 'tone': Tone (for 'fix_grammar')
      - 'provider': 'gemini' or 'deepinfra'
      - 'api_key': client-provided API key
    """
    data = request.get_json() or {}
    transcript_id = data.get('id')
    action = data.get('action')
    target_lang = data.get('target_lang')
    tone = data.get('tone', 'professional')
    provider = data.get('provider', 'gemini')
    api_key = data.get('api_key')
    
    if not transcript_id or not action:
        return jsonify({"error": "Missing required fields: id and action"}), 400
        
    record = get_transcript(transcript_id)
    if not record:
        return jsonify({"error": "Transcript record not found"}), 404
        
    try:
        # Run AI analysis
        ai_response = AIService.analyze(
            text=record['text'],
            action=action,
            target_lang=target_lang,
            tone=tone,
            provider=provider,
            api_key=api_key
        )
        
        # Cache results in DB
        update_args = {"transcript_id": transcript_id}
        if action == "summarize":
            update_args["summary"] = ai_response
        elif action == "action_items":
            update_args["action_items"] = ai_response
        elif action == "translate":
            # Store translations as dictionary mapping lang -> translation text
            existing_translations = {}
            if record['translation']:
                try:
                    existing_translations = json.loads(record['translation'])
                except:
                    pass
            existing_translations[target_lang] = ai_response
            update_args["translation"] = json.dumps(existing_translations)
        elif action == "fix_grammar":
            # For grammar fixing, we replace the core text itself, or we can save it as fixed text
            update_args["text"] = ai_response
            
        updated_record = update_transcript(**update_args)
        
        return jsonify({
            "status": "success",
            "result": ai_response,
            "transcript": updated_record
        }), 200
        
    except Exception as e:
        print(f"[App] AI analysis endpoint error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/transcripts', methods=['GET'])
def list_transcripts():
    """Retrieve list of all saved transcriptions, optional search ?q="""
    search_query = request.args.get('q')
    user_id = request.headers.get('X-User-ID')
    records = get_transcripts(search_query, user_id=user_id)
    return jsonify(records), 200

@app.route('/api/transcripts/<id>', methods=['GET'])
def get_single_transcript(id):
    """Retrieve details of a single transcription by ID."""
    record = get_transcript(id)
    if not record:
        return jsonify({"error": "Transcript not found"}), 404
    return jsonify(record), 200

@app.route('/api/transcripts/<id>', methods=['PUT'])
def edit_transcript(id):
    """Update details of a transcription (e.g. edit title or text manually)."""
    data = request.get_json() or {}
    title = data.get('title')
    text = data.get('text')
    
    record = get_transcript(id)
    if not record:
        return jsonify({"error": "Transcript not found"}), 404
        
    updated_record = update_transcript(id, title=title, text=text)
    return jsonify(updated_record), 200

@app.route('/api/transcripts/<id>', methods=['DELETE'])
def delete_single_transcript(id):
    """Delete a transcription by ID, and deletes its audio file."""
    success, audio_filename = delete_transcript(id)
    if not success:
        return jsonify({"error": "Transcript not found or already deleted"}), 404
        
    # Delete associated audio file
    if audio_filename:
        audio_path = os.path.join(UPLOADS_DIR, audio_filename)
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
                print(f"[App] Deleted associated audio file: {audio_filename}")
            except Exception as e:
                print(f"[App] Error deleting audio file {audio_filename}: {e}")
                
    return jsonify({"status": "success", "message": "Transcript deleted successfully"}), 200

@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """Streams/Serves the recorded WAV audio file back to the browser."""
    # Ensure file is clean and safe to download
    return send_from_directory(UPLOADS_DIR, filename)

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
