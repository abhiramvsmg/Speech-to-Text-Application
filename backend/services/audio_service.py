import os
import wave
import subprocess
from pydub import AudioSegment

class AudioService:
    @staticmethod
    def process_audio(input_path, output_path):
        """
        Converts the uploaded audio file to a 16kHz Mono WAV file, 
        which is the golden standard for Speech Recognition APIs.
        Returns the duration of the audio in seconds.
        """
        duration = 0.0
        
        try:
            # 1. Try conversion using pydub (relying on system ffmpeg)
            audio = AudioSegment.from_file(input_path)
            duration = len(audio) / 1000.0  # length is in milliseconds
            
            # Normalize to 16000Hz, 1 channel (mono), 16-bit depth
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            audio.export(output_path, format="wav")
            print(f"[AudioService] Converted successfully using Pydub. Duration: {duration:.2f}s")
            return duration, None
            
        except Exception as pydub_err:
            print(f"[AudioService] Pydub conversion failed (probably ffmpeg not found): {pydub_err}")
            
            # 2. Subprocess FFmpeg Fallback: Try calling ffmpeg directly (just in case the path is defined)
            try:
                # Get duration first using ffprobe or ffmpeg
                cmd_dur = [
                    'ffmpeg', '-i', input_path, 
                    '-f', 'null', '-'
                ]
                # Executing and searching output is standard, but let's try direct conversion
                cmd_conv = [
                    'ffmpeg', '-y', '-i', input_path, 
                    '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 
                    output_path
                ]
                subprocess.run(cmd_conv, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                
                # Retrieve duration from output WAV
                with wave.open(output_path, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    rate = wav_file.getframerate()
                    duration = frames / float(rate)
                    
                print(f"[AudioService] Converted successfully using direct ffmpeg CLI. Duration: {duration:.2f}s")
                return duration, None
                
            except Exception as ffmpeg_err:
                print(f"[AudioService] Direct FFmpeg execution failed: {ffmpeg_err}")
                
                # 3. Direct WAV Fallback: If input is already WAV, read it directly without ffmpeg
                try:
                    if input_path.endswith('.wav') or input_path.endswith('.wave'):
                        with wave.open(input_path, 'rb') as wav_file:
                            frames = wav_file.getnframes()
                            rate = wav_file.getframerate()
                            duration = frames / float(rate)
                        
                        # Copy the file directly
                        with open(input_path, 'rb') as src, open(output_path, 'wb') as dst:
                            dst.write(src.read())
                            
                        print(f"[AudioService] Input is WAV. Loaded directly without conversion. Duration: {duration:.2f}s")
                        return duration, None
                except Exception as wav_err:
                    print(f"[AudioService] Direct WAV read failed: {wav_err}")
                
                # 4. Final Graceful Fallback: If we absolutely can't convert but want a working demo,
                # let's write a dummy WAV and return a clear instruction.
                # In many modern environments, speech_recognition can read simple PCM, but needs WAV structure.
                # If we fail, return the error so we can notify the user.
                err_msg = (
                    "Could not convert audio. Please install FFmpeg on your system to process compressed audio format inputs (WebM/OGG). "
                    "Alternatively, record and send raw WAV files."
                )
                return 0.0, err_msg
