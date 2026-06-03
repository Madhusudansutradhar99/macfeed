import asyncio
import json
import os
import uuid
import torch
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import speech_recognition as sr
from googletrans import Translator
from pydub import AudioSegment
from TTS.api import TTS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translator = Translator()
recognizer = sr.Recognizer()

# Initialize Coqui XTTS-v2
print("Loading Coqui XTTS-v2 Model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
# xtts_v2 supports many languages including en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh, hu, ko, ja, hi
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
print(f"Model loaded on {device}")

LANG_CODES = {
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "Japanese": "ja",
    "German": "de"
}

@app.websocket("/ws/dub")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected for AI Voice Cloning stream.")
    
    try:
        config_data = await websocket.receive_text()
        config = json.loads(config_data)
        target_language = config.get("language", "Hindi")
        lang_code = LANG_CODES.get(target_language, "hi")
        
        await websocket.send_text(json.dumps({"status": "CONNECTED", "message": f"XTTS-v2 ready for {target_language} dubbing."}))

        while True:
            data = await websocket.receive_bytes()
            if len(data) < 1000:
                continue 
                
            chunk_id = str(uuid.uuid4())
            webm_path = f"temp_{chunk_id}.webm"
            wav_path = f"temp_{chunk_id}.wav"
            out_wav_path = f"out_{chunk_id}.wav"
            
            try:
                with open(webm_path, "wb") as f:
                    f.write(data)
                
                audio = AudioSegment.from_file(webm_path, format="webm")
                audio.export(wav_path, format="wav")
                
                text = ""
                with sr.AudioFile(wav_path) as source:
                    audio_data = recognizer.record(source)
                    try:
                        text = recognizer.recognize_google(audio_data, language="en-US")
                        print(f"Transcribed: {text}")
                    except sr.UnknownValueError:
                        print("Google STT could not understand audio")
                
                if text.strip():
                    translated = translator.translate(text, dest=lang_code)
                    trans_text = translated.text
                    print(f"Translated to {target_language}: {trans_text}")
                    
                    # XTTS-v2 Voice Cloning Generation
                    # We use the original incoming audio (wav_path) as the speaker reference!
                    tts.tts_to_file(
                        text=trans_text, 
                        speaker_wav=wav_path, 
                        language=lang_code, 
                        file_path=out_wav_path
                    )
                    
                    with open(out_wav_path, "rb") as f:
                        dubbed_audio = f.read()
                    
                    await websocket.send_bytes(dubbed_audio)
                    print(f"Sent {len(dubbed_audio)} bytes of Cloned audio.")
                else:
                    await websocket.send_text(json.dumps({"status": "SILENCE"}))
                    
            except Exception as e:
                print(f"Error processing chunk: {e}")
            finally:
                for file_path in [webm_path, wav_path, out_wav_path]:
                    if os.path.exists(file_path):
                        try:
                            os.remove(file_path)
                        except:
                            pass

    except WebSocketDisconnect:
        print("Frontend disconnected.")

if __name__ == "__main__":
    print("Starting AI Voice Cloning Server on ws://localhost:8000/ws/dub")
    uvicorn.run(app, host="0.0.0.0", port=8000)
