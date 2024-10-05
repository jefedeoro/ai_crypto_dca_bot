import requests
import os
import json
import logging
import random
from pydub import AudioSegment
from io import BytesIO
from config import Config
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

API_KEY = Config.ELEVENLABS_API_KEY
VOICE_IDS = {
    'man1': Config.ELEVENLABS_VOICE_ID_MAN1,
    'man2': Config.ELEVENLABS_VOICE_ID_MAN2,
    'woman1': Config.ELEVENLABS_VOICE_ID_WOMAN1,
    'woman2': Config.ELEVENLABS_VOICE_ID_WOMAN2
}

def generate_audio(text, voice_id, use_speaker_boost=True):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.25,
            "similarity_boost": 0.25,
            "use_speaker_boost": use_speaker_boost
        }
    }

    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        return BytesIO(response.content)
    else:
        logging.error(f"Error generating audio: {response.status_code} - {response.text}")
        return None

def add_silence(duration_ms):
    return AudioSegment.silent(duration=duration_ms)

def text_to_speech(input_path, output_path):
    logging.info(f"Starting text-to-speech conversion. Input: {input_path}, Output: {output_path}")

    if not API_KEY:
        logging.error("ELEVENLABS_API_KEY is not set. Skipping text-to-speech conversion.")
        return False

    missing_voices = [k for k, v in VOICE_IDS.items() if not v]
    if missing_voices:
        logging.error(f"Missing voice IDs for: {', '.join(missing_voices)}. Skipping text-to-speech conversion.")
        return False

    try:
        with open(input_path, 'r') as f:
            script = json.load(f)

        logging.info(f"Loaded script with {len(script)} segments")

        audio_segments = []

        for i, segment in enumerate(script):
            logging.debug(f"Processing segment {i+1}/{len(script)}")
            if 'voice_id' not in segment:
                logging.error(f"Segment {i+1} is missing 'voice_id' field. Skipping this segment.")
                continue
            
            voice_id = segment['voice_id']
            logging.debug(f"Segment {i+1} voice_id: {voice_id}")
            
            if voice_id not in VOICE_IDS:
                logging.error(f"Invalid voice_id: {voice_id} in segment {i+1}. Skipping this segment.")
                continue
            
            elevenlabs_voice_id = VOICE_IDS[voice_id]
            if not elevenlabs_voice_id:
                logging.error(f"ElevenLabs voice ID not set for {voice_id}. Skipping this segment.")
                continue
            
            text = segment['text']
            logging.debug(f"Generating audio for segment {i+1} with text: {text[:50]}...")
            
            audio_data = generate_audio(text, elevenlabs_voice_id, use_speaker_boost=True)
            if audio_data:
                audio_segment = AudioSegment.from_mp3(audio_data)
                audio_segments.append(audio_segment)
                
                # Add random silence between 50ms and 300ms
                silence_duration = random.randint(50, 300)
                audio_segments.append(add_silence(silence_duration))
            else:
                logging.error(f"Failed to generate audio for segment {i+1}. Skipping this segment.")

        if not audio_segments:
            logging.error("No audio segments were generated. Aborting text-to-speech conversion.")
            return False

        # Combine all audio segments
        logging.info("Combining audio segments")
        final_audio = sum(audio_segments)

        # Add silence at the start and end
        start_silence = add_silence(random.randint(50, 300))
        end_silence = add_silence(random.randint(50, 300))
        final_audio = start_silence + final_audio + end_silence

        # Export the final audio
        logging.info(f"Exporting final audio to {output_path}")
        final_audio.export(output_path, format="mp3")

        logging.info(f"Audio file saved as {output_path}")
        return True

    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON from input file: {str(e)}")
        return False
    except IOError as e:
        logging.error(f"Error reading input file or writing output file: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error in text-to-speech conversion: {str(e)}")
        return False