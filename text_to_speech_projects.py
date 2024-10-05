# text_to_speech.py

import requests
import os
import logging
import json
from datetime import datetime
import sys

# Add the root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from config import Config
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

API_KEY = Config.ELEVENLABS_API_KEY
VOICE_IDS = {
    'man': Config.ELEVENLABS_VOICE_ID_MAN,
    'woman1': Config.ELEVENLABS_VOICE_ID_WOMAN1,
    'woman2': Config.ELEVENLABS_VOICE_ID_WOMAN2
}
CHUNK_SIZE = 1024

# Debug logging for API key
if API_KEY:
    logging.debug(f"ELEVENLABS_API_KEY is set. First 4 characters: {API_KEY[:4]}")
else:
    logging.error("ELEVENLABS_API_KEY is not set.")

# Debug logging for voice IDs
for voice, voice_id in VOICE_IDS.items():
    if voice_id:
        logging.debug(f"{voice.upper()}_VOICE_ID is set. First 4 characters: {voice_id[:4]}")
    else:
        logging.error(f"{voice.upper()}_VOICE_ID is not set.")

def create_project(name):
    logging.info(f"Creating project: {name}")
    url = "https://api.elevenlabs.io/v1/projects/add"
    headers = {
        "Accept": "application/json",
        "xi-api-key": API_KEY
    }
    
    data = {
        "name": name,
        "default_title_voice_id": VOICE_IDS['man'],
        "default_paragraph_voice_id": VOICE_IDS['woman1'],
        "default_model_id": "eleven_multilingual_v2",
        "title": name,
        "author": "AI News Bot",
        "isbn_number": "",
        "content_type": "podcast",
        "description": "AI-generated news podcast",
        "language": "en",
        "target_audience": "all ages",
        "genres": json.dumps(["news", "technology"]),
        "quality_preset": "standard"
    }

    logging.debug(f"Request URL: {url}")
    logging.debug(f"Request Data: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(url, headers=headers, data=data)
        logging.debug(f"Response Status Code: {response.status_code}")
        logging.debug(f"Response Content: {response.text}")
        response.raise_for_status()
        project_id = response.json()['project']['project_id']
        logging.info(f"Project created successfully. Project ID: {project_id}")
        return project_id
    except requests.exceptions.RequestException as e:
        logging.error(f"Error creating project: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"Response content: {e.response.text}")
        raise

def add_chapter(project_id, name, content):
    logging.info(f"Adding chapter: {name} to project: {project_id}")
    url = f"https://api.elevenlabs.io/v1/projects/{project_id}/chapters/add"
    headers = {
        "Accept": "application/json",
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "name": name,
        "content": content
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        logging.debug(f"Add Chapter Response Status Code: {response.status_code}")
        logging.debug(f"Add Chapter Response Content: {response.text}")
        response.raise_for_status()
        chapter_id = response.json()['chapter_id']
        logging.info(f"Chapter added successfully. Chapter ID: {chapter_id}")
        return chapter_id
    except requests.exceptions.RequestException as e:
        logging.error(f"Error adding chapter: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"Response content: {e.response.text}")
        raise

def convert_project(project_id):
    logging.info(f"Converting project: {project_id}")
    url = f"https://api.elevenlabs.io/v1/projects/{project_id}/convert"
    headers = {
        "Accept": "application/json",
        "xi-api-key": API_KEY
    }

    try:
        response = requests.post(url, headers=headers)
        logging.debug(f"Convert Project Response Status Code: {response.status_code}")
        logging.debug(f"Convert Project Response Content: {response.text}")
        response.raise_for_status()
        logging.info("Project converted successfully")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error converting project: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"Response content: {e.response.text}")
        raise

def get_project_audio(project_id):
    logging.info(f"Getting audio for project: {project_id}")
    url = f"https://api.elevenlabs.io/v1/projects/{project_id}/stream"
    headers = {
        "Accept": "audio/mpeg",
        "xi-api-key": API_KEY
    }

    try:
        response = requests.get(url, headers=headers, stream=True)
        logging.debug(f"Get Project Audio Response Status Code: {response.status_code}")
        response.raise_for_status()
        logging.info("Audio stream retrieved successfully")
        return response.iter_content(chunk_size=CHUNK_SIZE)
    except requests.exceptions.RequestException as e:
        logging.error(f"Error getting project audio: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"Response content: {e.response.text}")
        raise

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
        logging.info(f"Script loaded successfully from {input_path}")

        project_name = f"News_Podcast_{datetime.now().strftime('%Y%m%d')}"
        project_id = create_project(project_name)

        for chapter in script:
            chapter_name = chapter['title']
            chapter_content = ""
            for segment in chapter['content']:
                voice_id = VOICE_IDS[segment['speaker']]
                chapter_content += f'<voice_id="{voice_id}">{segment["text"]}</voice_id>\n'
            
            add_chapter(project_id, chapter_name, chapter_content)

        convert_project(project_id)

        with open(output_path, 'wb') as f:
            for chunk in get_project_audio(project_id):
                if chunk:
                    f.write(chunk)

        logging.info(f"Audio file saved as {output_path}")
        return True

    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON from input file: {str(e)}")
        return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Error in API request: {str(e)}")
        return False
    except IOError as e:
        logging.error(f"Error reading input file or writing output file: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error in text-to-speech conversion: {str(e)}")
        return False

if __name__ == '__main__':
    result_folder = os.getenv('TG_NEWS_RESULT_FOLDER')
    if result_folder is None:
        logging.warning("TG_NEWS_RESULT_FOLDER environment variable not set. Using default path.")
        result_folder = 'data'
    
    input_path = os.path.join(result_folder, "script.json")
    output_path = os.path.join(result_folder, "output_audio.mp3")
    
    success = text_to_speech(input_path, output_path)
    if success:
        logging.info("Text-to-speech conversion completed successfully")
    else:
        logging.error("Text-to-speech conversion failed")
