import os
import logging
import json
from flask import Blueprint, jsonify, send_from_directory, render_template, request
from scrape.config import RESULT_FOLDER

# Create a Flask blueprint for the podcast API
podcast_api = Blueprint('podcast_api', __name__, static_folder='../static')

hidden_recordings = []

def get_latest_result_folder():
    result_folders = [f for f in os.listdir(RESULT_FOLDER) if os.path.isdir(os.path.join(RESULT_FOLDER, f))]
    if not result_folders:
        return None
    return os.path.join(RESULT_FOLDER, max(result_folders))

def load_json_file(folder_path, filename):
    file_path = os.path.join(folder_path, filename)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return None

def get_podcast_data(folder_path):
    """Get podcast data from a specific folder"""
    if not os.path.exists(folder_path):
        return None

    # Load all necessary files
    selected_headlines = load_json_file(folder_path, 'selected_headlines.json')
    summarized_news = load_json_file(folder_path, 'summarized_news.json')
    audio_path = os.path.join(folder_path, 'output_audio.mp3')
    
    if selected_headlines and summarized_news and os.path.exists(audio_path):
        # Format date from folder name (YYYYMMDD-HH_MM_SS_hash)
        folder_name = os.path.basename(folder_path)
        date_parts = folder_name.split('-')
        if len(date_parts) >= 2:
            date_str = date_parts[0]
            time_str = date_parts[1].split('_')
            formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]} {time_str[0]}:{time_str[1]}"
        else:
            formatted_date = folder_name
        
        # Map headlines to their summaries
        articles = []
        for headline in selected_headlines:
            summary = next((item["summary"] for item in summarized_news if item["title"] == headline["title"]), None)
            if summary:
                articles.append({
                    "title": headline["title"],
                    "summary": summary,
                    "link": headline["link"]
                })
        
        return {
            "date": formatted_date,
            "articles": articles,
            "audio_url": f"/recordings/{os.path.basename(folder_path)}/output_audio.mp3"
        }
    
    return None

@podcast_api.route('/api/podcasts/get')
def get_podcast():
    folder = request.args.get('folder', None)
    
    # If no folder specified, get the latest
    if not folder:
        folder_path = get_latest_result_folder()
    else:
        folder_path = os.path.join(RESULT_FOLDER, folder)
    
    if not folder_path:
        return jsonify({"status": "error", "message": "No podcasts available at the moment."})

    podcast_data = get_podcast_data(folder_path)
    if podcast_data:
        return jsonify({
            "status": "success",
            "podcast": podcast_data
        })
    else:
        return jsonify({"status": "error", "message": "Podcast data not available."})

@podcast_api.route('/api/podcasts/past')
def get_past_podcasts():
    result_folders = sorted([f for f in os.listdir(RESULT_FOLDER) if os.path.isdir(os.path.join(RESULT_FOLDER, f))], reverse=True)
    podcasts = []
    
    for folder in result_folders:
        if folder not in hidden_recordings:
            folder_path = os.path.join(RESULT_FOLDER, folder)
            podcast_data = get_podcast_data(folder_path)
            if podcast_data:
                podcasts.append(podcast_data)
    
    # Sort podcasts by date in descending order
    podcasts.sort(key=lambda x: x['date'], reverse=True)
    
    return jsonify({
        "status": "success",
        "podcasts": podcasts
    })

@podcast_api.route('/recordings')
def get_recordings():
    recordings = []
    
    for folder in sorted([f for f in os.listdir(RESULT_FOLDER) if os.path.isdir(os.path.join(RESULT_FOLDER, f))], reverse=True):
        if folder not in hidden_recordings:
            podcast_data = get_podcast_data(os.path.join(RESULT_FOLDER, folder))
            if podcast_data:
                recordings.append({
                    "id": folder,
                    "title": podcast_data["articles"][0]["title"] if podcast_data["articles"] else "Untitled",
                    "date": podcast_data["date"],
                    "original_url": podcast_data["articles"][0]["link"] if podcast_data["articles"] else "#",
                    "url": podcast_data["audio_url"]
                })
    
    return jsonify(recordings)

@podcast_api.route('/recordings/<recording_id>/<filename>')
def serve_recording(recording_id, filename):
    directory = os.path.join(RESULT_FOLDER, recording_id)
    return send_from_directory(directory, filename)

@podcast_api.route('/remove_recording/<recording_id>', methods=['POST'])
def remove_recording(recording_id):
    hidden_recordings.append(recording_id)
    return jsonify({"status": "success"})

@podcast_api.route('/sidebar')
def sidebar():
    return render_template('sidebar.html')
