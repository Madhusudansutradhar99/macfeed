import asyncio
import json
import io
import torch
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from googletrans import Translator
from pydub import AudioSegment
from TTS.api import TTS
from faster_whisper import WhisperModel
import numpy as np
import scipy.io.wavfile as wavfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translator = Translator()

device = "cuda" if torch.cuda.is_available() else "cpu"

print("Loading Faster-Whisper Model...")
whisper_model = WhisperModel("base", device=device, compute_type="float16" if device=="cuda" else "int8")
print("Faster-Whisper Loaded.")

print("Loading Coqui XTTS-v2 Model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
print(f"XTTS-v2 Loaded on {device}")

LANG_CODES = {
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "Japanese": "ja",
    "German": "de",
    "Telugu": "te",
    "Tamil": "ta"
}

def pydub_to_np(audio_segment: AudioSegment):
    """Converts pydub audio segment to numpy array for faster-whisper"""
    # Normalize to 16kHz mono
    audio = audio_segment.set_frame_rate(16000).set_channels(1)
    samples = np.array(audio.get_array_of_samples())
    if audio.sample_width == 2:
        samples = samples.astype(np.float32) / 32768.0
    return samples

@app.websocket("/ws/dub")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected for Ultra-Fast Dubbing stream.")
    
    try:
        config_data = await websocket.receive_text()
        config = json.loads(config_data)
        target_language = config.get("language", "Hindi")
        lang_code = LANG_CODES.get(target_language, "hi")
        
        await websocket.send_text(json.dumps({"status": "CONNECTED", "message": f"XTTS-v2 & FasterWhisper ready for {target_language} dubbing."}))

        while True:
            data = await websocket.receive_bytes()
            if len(data) < 1000:
                continue 
            
            try:
                # 1. In-Memory WebM to WAV Conversion
                webm_io = io.BytesIO(data)
                audio_segment = AudioSegment.from_file(webm_io, format="webm")
                
                # 2. Faster-Whisper Transcription
                audio_np = pydub_to_np(audio_segment)
                segments, info = whisper_model.transcribe(audio_np, beam_size=1)
                text = " ".join([segment.text for segment in segments])
                
                print(f"Transcribed: {text}")
                
                if text.strip():
                    # 3. Translation
                    translated = translator.translate(text, dest=lang_code)
                    trans_text = translated.text
                    print(f"Translated to {target_language}: {trans_text}")
                    
                    # 4. In-Memory XTTS Voice Cloning
                    # XTTS requires a wav file for speaker reference, we can use an in-memory BytesIO for speaker_wav?
                    # Unfortunately, TTS API expects a file path for `speaker_wav`. We must save just the reference chunk.
                    ref_wav_path = "temp_ref.wav"
                    audio_segment.export(ref_wav_path, format="wav")
                    
                    out_wav_path = "temp_out.wav"
                    
                    tts.tts_to_file(
                        text=trans_text, 
                        speaker_wav=ref_wav_path, 
                        language=lang_code, 
                        file_path=out_wav_path
                    )
                    
                    # Read generated audio
                    with open(out_wav_path, "rb") as f:
                        dubbed_audio = f.read()
                    
                    await websocket.send_bytes(dubbed_audio)
                    print(f"Sent {len(dubbed_audio)} bytes of Cloned audio.")
                else:
                    await websocket.send_text(json.dumps({"status": "SILENCE"}))
                    
            except Exception as e:
                print(f"Error processing chunk: {e}")

    except WebSocketDisconnect:
        print("Frontend disconnected.")

if __name__ == "__main__":
    print("Starting Ultra-Fast AI Dub Server on ws://localhost:8000/ws/dub")
    uvicorn.run(app, host="0.0.0.0", port=8000)
