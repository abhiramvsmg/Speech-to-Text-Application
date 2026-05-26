import os
import requests
import speech_recognition as sr

class STTService:
    @staticmethod
    def transcribe(audio_path, engine="local", api_key=None, language="en-US"):
        """
        Transcribes an audio file at audio_path using the selected engine.
        Engines: 
          - "local": Free Google Web API (no keys needed, perfect fallback).
          - "deepgram": Deepgram Nova-2 high-speed STT.
          - "deepinfra": DeepInfra Whisper-large model.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at {audio_path}")
            
        print(f"[STTService] Transcribing {audio_path} using engine={engine}, language={language}")
        
        # 1. DEEPGRAM ENGINE
        if engine == "deepgram":
            key = api_key or os.getenv("DEEPGRAM_API_KEY")
            if not key:
                raise ValueError("Deepgram API Key is required but was not provided.")
                
            url = f"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language={language.split('-')[0]}"
            headers = {
                "Authorization": f"Token {key}",
                "Content-Type": "audio/wav"
            }
            
            with open(audio_path, 'rb') as audio_file:
                response = requests.post(url, headers=headers, data=audio_file)
                
            if response.status_code != 200:
                raise Exception(f"Deepgram STT API returned error {response.status_code}: {response.text}")
                
            res_data = response.json()
            try:
                transcript = res_data['results']['channels'][0]['alternatives'][0]['transcript']
                # Try to extract confidence
                confidence = res_data['results']['channels'][0]['alternatives'][0].get('confidence', 1.0)
                print(f"[STTService] Deepgram transcript successfully generated (len: {len(transcript)}).")
                return {
                    "text": transcript,
                    "confidence": confidence,
                    "engine": "deepgram"
                }
            except KeyError:
                raise Exception("Failed to parse Deepgram API response: structure mismatched.")

        # 2. DEEPINFRA ENGINE
        elif engine == "deepinfra":
            key = api_key or os.getenv("DEEPINFRA_API_KEY")
            if not key:
                raise ValueError("DeepInfra API Key is required but was not provided.")
                
            url = "https://api.deepinfra.com/v1/inference/openai/whisper-large"
            headers = {
                "Authorization": f"Bearer {key}"
            }
            files = {
                "audio": ("audio.wav", open(audio_path, "rb"), "audio/wav")
            }
            # Optional parameters can be supplied in data
            data = {
                "language": language.split('-')[0]
            }
            
            response = requests.post(url, headers=headers, files=files, data=data)
            
            if response.status_code != 200:
                raise Exception(f"DeepInfra Whisper API returned error {response.status_code}: {response.text}")
                
            res_data = response.json()
            transcript = res_data.get("text", "")
            print(f"[STTService] DeepInfra Whisper transcript successfully generated (len: {len(transcript)}).")
            return {
                "text": transcript.strip(),
                "confidence": 1.0,
                "engine": "deepinfra"
            }

        # 3. LOCAL FREE FALLBACK ENGINE (speech_recognition via Google Web Speech API)
        else:
            r = sr.Recognizer()
            with sr.AudioFile(audio_path) as source:
                audio_data = r.record(source)
                
            try:
                # Recognize speech using Google Speech Recognition (free, no key required)
                # Note: This is rate-limited by Google, but perfect for demo/personal/local use!
                text = r.recognize_google(audio_data, language=language)
                print(f"[STTService] Google Web STT transcript successfully generated (len: {len(text)}).")
                return {
                    "text": text,
                    "confidence": 0.9,
                    "engine": "local"
                }
            except sr.UnknownValueError:
                print("[STTService] Google Web STT could not understand audio.")
                return {
                    "text": "",
                    "confidence": 0.0,
                    "engine": "local",
                    "error": "Speech was unintelligible or empty."
                }
            except sr.RequestError as e:
                print(f"[STTService] Google Web STT requests failed: {e}")
                raise Exception(f"Google Speech Recognition service error: {e}")
            except Exception as e:
                print(f"[STTService] Local STT generic error: {e}")
                raise e
        
        # Default fallback
        raise ValueError(f"Unknown transcription engine requested: {engine}")
