import os
import json
from flask import Blueprint, jsonify
from scrape.config import RESULT_FOLDER

sidebar_api = Blueprint('sidebar_api', __name__)

def load_json_file(folder_path, filename):
    file_path = os.path.join(folder_path, filename)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return None
    return None

@sidebar_api.route('/api/sidebar/podcasts')
def get_sidebar_podcasts():
    result_folders = sorted([f for f in os.listdir(RESULT_FOLDER) if os.path.isdir(os.path.join(RESULT_FOLDER, f))], reverse=True)
    podcasts = []
    
    for folder in result_folders:
        folder_path = os.path.join(RESULT_FOLDER, folder)
        hidden_path = os.path.join(folder_path, '.hidden')
        
        # Skip hidden podcasts
        if os.path.exists(hidden_path):
            continue
            
        summarized_news = load_json_file(folder_path, 'summarized_news.json')
        if summarized_news and os.path.exists(os.path.join(folder_path, 'output_audio.mp3')):
            # Extract date and time from folder name
            date_parts = folder.split('-')
            if len(date_parts) >= 2:
                date_str = date_parts[0]
                time_str = date_parts[1].split('_')
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]} {time_str[0]}:{time_str[1]}"
            else:
                formatted_date = folder

            # Get first article title
            title = summarized_news[0]["title"] if summarized_news else "Untitled"
            if len(title) > 100:
                title = title[:97] + "..."

            podcasts.append({
                "folder": folder,
                "date": formatted_date,
                "title": title
            })
    
    return jsonify({
        "status": "success",
        "podcasts": podcasts
    })
