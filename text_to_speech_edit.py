import requests
import os
import json
import logging
import random
from pydub import AudioSegment
from pydub.effects import high_pass_filter, low_pass_filter
from io import BytesIO
from config import Config
from dotenv import load_dotenv
from audio_normalizer import normalize_audio  # For normalizing the final audio

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

# Adjustable parameters for voice processing
VOICE_PROCESSING_SETTINGS = {
    'man1': {
        'gain_adjustment_db': 4.20,  # Adjust gain in dB
        'high_pass_cutoff_freq': None,  # Set to a frequency in Hz to apply high-pass filter
        'low_pass_cutoff_freq': None,   # Set to a frequency in Hz to apply low-pass filter
    },
    'man2': {
        'gain_adjustment_db': -0.420,
        'high_pass_cutoff_freq': 115,  # Apply high-pass filter at 200 Hz to reduce bass
        'low_pass_cutoff_freq': None,
    },
    'woman1': {
        'gain_adjustment_db': 2.5,  # Increase volume by 1 dB (~5% increase)
        'high_pass_cutoff_freq': None,
        'low_pass_cutoff_freq': 19000,
    },
    'woman2': {
        'gain_adjustment_db': 7,
        'high_pass_cutoff_freq': None,
        'low_pass_cutoff_freq': None,  # Apply low-pass filter at 5000 Hz to soften high frequencies
    },
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
            "stability": 0.3,
            "similarity_boost": 0.3,
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

def normalize_audio_segment(audio_segment, target_dBFS=-3.0):
    """
    Normalizes an AudioSegment to the target dBFS.
    """
    change_in_dBFS = target_dBFS - audio_segment.max_dBFS
    return audio_segment.apply_gain(change_in_dBFS)

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

                # Apply voice-specific processing
                settings = VOICE_PROCESSING_SETTINGS.get(voice_id, {})
                gain_adjustment_db = settings.get('gain_adjustment_db')
                high_pass_cutoff_freq = settings.get('high_pass_cutoff_freq')
                low_pass_cutoff_freq = settings.get('low_pass_cutoff_freq')

                # Apply gain adjustment
                if gain_adjustment_db != 0.0:
                    logging.debug(f"Adjusting gain for '{voice_id}' by {gain_adjustment_db} dB")
                    audio_segment += gain_adjustment_db

                # Apply high-pass filter
                if high_pass_cutoff_freq:
                    logging.debug(f"Applying high-pass filter to '{voice_id}' at {high_pass_cutoff_freq} Hz")
                    audio_segment = audio_segment.high_pass_filter(high_pass_cutoff_freq)

                # Apply low-pass filter
                if low_pass_cutoff_freq:
                    logging.debug(f"Applying low-pass filter to '{voice_id}' at {low_pass_cutoff_freq} Hz")
                    audio_segment = audio_segment.low_pass_filter(low_pass_cutoff_freq)

                # Decide whether to normalize individually
                # if voice_id != 'woman2':
                    # Normalize the audio segment to -6.0 dBFS
                    # audio_segment = normalize_audio_segment(audio_segment, target_dBFS=-6.0)
                else:
                    logging.debug("Skipping individual normalization for 'woman2'")

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
        start_silence = add_silence(random.randint(15, 270))
        end_silence = add_silence(random.randint(33, 250))
        final_audio = start_silence + final_audio + end_silence

        # Normalize the final combined audio to -3.0 dBFS
        logging.info("Normalizing the final combined audio")
        final_audio = normalize_audio_segment(final_audio, target_dBFS=-3.0)

        # Export the final audio to the output path
        logging.info(f"Exporting final audio to {output_path}")
        final_audio.export(output_path, format="mp3")

        logging.info(f"Final audio file is ready at {output_path}")
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

if __name__ == "__main__":
    # Example usage
    input_script_path = "path/to/input_script.json"
    output_audio_path = "path/to/output_audio.mp3"
    success = text_to_speech(input_script_path, output_audio_path)
    if success:
        print("Text-to-speech conversion and normalization completed successfully.")
    else:
        print("Text-to-speech conversion failed.")
