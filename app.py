# app.py
from flask import Flask, jsonify, render_template
import os
import main
import json

# Flask app setup
app = Flask(__name__)

def get_latest_result_folder():
    data_dir = 'data'
    result_folders = [f for f in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, f))]
    if not result_folders:
        return None
    return os.path.join(data_dir, max(result_folders))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/news', methods=['GET'])
def get_news():
    latest_folder = get_latest_result_folder()
    if not latest_folder:
        return jsonify({"status": "error", "message": "No news available at the moment."})

    script_path = os.path.join(latest_folder, 'script.json')
    audio_path = os.path.join(latest_folder, 'output_audio.mp3')
    
    if os.path.exists(script_path):
        with open(script_path, 'r') as f:
            script = json.load(f)
        
        response = {
            "status": "success",
            "script": script,
            "audio_available": os.path.exists(audio_path)
        }
        return jsonify(response)
    else:
        return jsonify({"status": "error", "message": "News script not available."})

@app.route('/api/fetch-new-stories', methods=['POST'])
def fetch_new_stories():
    try:
        main.main()
        latest_folder = get_latest_result_folder()
        audio_path = os.path.join(latest_folder, 'output_audio.mp3')
        return jsonify({
            "status": "success", 
            "message": "New stories fetched and processed successfully.",
            "audio_available": os.path.exists(audio_path)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error fetching new stories: {str(e)}"})

if __name__ == '__main__':
    # Telegram bot and NEAR integration can be added here in the future
    # import telegram_bot
    # telegram_bot.setup_webhook(app)
    
    # import near_integration
    # near_integration.initialize_near()
    
    app.run(debug=True)
