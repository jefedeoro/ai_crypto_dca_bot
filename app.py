from flask import Flask, render_template, jsonify, request, send_from_directory
import os
import main
import json
from routes.podcast_api import podcast_api
from routes.sidebar import sidebar_api
from routes.dca_routes import dca_bp
from routes.near import near_bp
from routes.base64Converter import base64_bp
from routes.admin_routes import admin_bp, init_admin_bp

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')

def get_latest_result_folder():
    data_dir = 'data'
    result_folders = [f for f in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, f))]
    if not result_folders:
        return None
    return os.path.join(data_dir, max(result_folders))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mockData/<path:filename>')
def serve_mock_data(filename):
    return send_from_directory('mockData', filename)

@app.route('/podcasts')
def podcasts():
    return render_template('podcasts.html')

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

# Initialize admin blueprint
init_admin_bp(app)

# Register the blueprints
app.register_blueprint(podcast_api)
app.register_blueprint(sidebar_api)
app.register_blueprint(dca_bp)
app.register_blueprint(near_bp)
app.register_blueprint(base64_bp)
app.register_blueprint(admin_bp)

if __name__ == '__main__':
    app.run(debug=True)
