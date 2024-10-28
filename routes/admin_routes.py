from flask import Blueprint, render_template, jsonify, request, Response, session
from functools import wraps
import os
import sys
from io import StringIO
import main
import json
from datetime import datetime, timedelta
import shutil
from scrape.config import RESULT_FOLDER
import logging
import hashlib
import secrets

# Configure logging to exclude sensitive data
class SensitiveFilter(logging.Filter):
    def filter(self, record):
        return True  # Don't log request data at all

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.addFilter(SensitiveFilter())

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def init_admin_bp(app):
    app.permanent_session_lifetime = timedelta(hours=1)
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'

def get_password_hash():
    """Get the hashed version of the admin password"""
    password = os.getenv('ADMIN_PASS', 'This1sThePasswordForTempAdmin')
    salt = os.getenv('PASSWORD_SALT', 'default_salt_change_in_production')
    return hashlib.sha256((password + salt).encode()).hexdigest()

def check_admin_password(password):
    """Verify the provided password against the hashed version"""
    salt = os.getenv('PASSWORD_SALT', 'default_salt_change_in_production')
    hashed_input = hashlib.sha256((password + salt).encode()).hexdigest()
    return secrets.compare_digest(hashed_input, get_password_hash())

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_authenticated'):
            logger.warning('Unauthorized access attempt')
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_podcast_status(folder_path):
    """
    Get detailed status of a podcast:
    - Success: Both news summary and audio are ready
    - Pending: News summary exists but audio is still processing
    - Error: Failed to load or process the news summary
    """
    summarized_news_path = os.path.join(folder_path, 'summarized_news.json')
    audio_path = os.path.join(folder_path, 'output_audio.mp3')
    
    if not os.path.exists(summarized_news_path):
        return {
            'status': 'Error',
            'details': 'News summary file missing'
        }
    
    try:
        with open(summarized_news_path, 'r') as f:
            summarized_news = json.load(f)
            
        if not summarized_news:
            return {
                'status': 'Error',
                'details': 'News summary is empty'
            }
            
        if not os.path.exists(audio_path):
            return {
                'status': 'Pending',
                'details': 'Audio file is being generated'
            }
            
        return {
            'status': 'Success',
            'details': 'Podcast ready'
        }
    except json.JSONDecodeError:
        return {
            'status': 'Error',
            'details': 'Invalid news summary format'
        }
    except Exception as e:
        return {
            'status': 'Error',
            'details': str(e)
        }

@admin_bp.route('/')
def admin():
    return render_template('admin.html')

@admin_bp.route('/verify', methods=['POST'])
def verify_admin():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Invalid request'}), 400

        data = request.get_json()
        if 'password' not in data:
            return jsonify({'success': False, 'message': 'Password required'}), 400

        if check_admin_password(data['password']):
            session.permanent = True
            session['admin_authenticated'] = True
            logger.info('Admin authentication successful')
            return jsonify({'success': True})
        
        logger.warning('Failed admin authentication attempt')
        return jsonify({'success': False, 'message': 'Invalid password'})
    except Exception as e:
        logger.error(f'Error in admin verification: {str(e)}')
        return jsonify({'success': False, 'message': 'Server error'}), 500

@admin_bp.route('/start-main-app', methods=['POST'])
@admin_required
def start_main_app():
    def generate():
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        
        try:
            main.main()
            yield "Main app completed successfully.\n"
        except Exception as e:
            logger.error(f'Error in main app execution: {str(e)}')
            yield f"Error: {str(e)}\n"
        finally:
            sys.stdout = old_stdout
            output = mystdout.getvalue()
            yield output
    
    return Response(generate(), mimetype='text/plain')

@admin_bp.route('/get-podcasts', methods=['GET'])
@admin_required
def get_podcasts():
    try:
        result_folders = sorted([f for f in os.listdir(RESULT_FOLDER) if os.path.isdir(os.path.join(RESULT_FOLDER, f))], reverse=True)
        podcasts = []
        
        for folder in result_folders:
            folder_path = os.path.join(RESULT_FOLDER, folder)
            summarized_news = load_json_file(folder_path, 'summarized_news.json')
            audio_path = os.path.join(folder_path, 'output_audio.mp3')
            hidden_path = os.path.join(folder_path, '.hidden')
            
            # Extract date and time from folder name
            date_parts = folder.split('-')
            if len(date_parts) >= 2:
                date_str = date_parts[0]
                time_str = date_parts[1].split('_')
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]} {time_str[0]}:{time_str[1]}"
            else:
                formatted_date = folder

            # Get first article title and status
            if summarized_news:
                title = summarized_news[0]["title"]
                if len(title) > 100:
                    title = title[:97] + "..."
                status = 'Success' if os.path.exists(audio_path) else 'Pending'
            else:
                title = "Error loading news"
                status = 'Error'

            podcasts.append({
                'id': folder,
                'date': formatted_date,
                'title': title,
                'status': status,
                'hidden': os.path.exists(hidden_path)
            })
        
        return jsonify(podcasts)
    except Exception as e:
        logger.error(f'Error getting podcasts: {str(e)}')
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/toggle-visibility', methods=['POST'])
@admin_required
def toggle_visibility():
    try:
        if not request.is_json or 'id' not in request.json:
            return jsonify({'success': False, 'message': 'Invalid request'}), 400
        
        podcast_id = request.json['id']
        folder_path = os.path.join(RESULT_FOLDER, podcast_id)
        hidden_path = os.path.join(folder_path, '.hidden')
        
        if not os.path.exists(folder_path):
            return jsonify({'success': False, 'message': 'Podcast not found'}), 404
        
        # Toggle hidden state
        if os.path.exists(hidden_path):
            os.remove(hidden_path)
            is_hidden = False
        else:
            with open(hidden_path, 'w') as f:
                f.write('')
            is_hidden = True
        
        return jsonify({
            'success': True,
            'hidden': is_hidden
        })
    except Exception as e:
        logger.error(f'Error toggling visibility: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/delete-podcast', methods=['POST'])
@admin_required
def delete_podcast():
    try:
        if not request.is_json or 'id' not in request.json:
            return jsonify({'success': False, 'message': 'Invalid request'}), 400
        
        podcast_id = request.json['id']
        folder_path = os.path.join(RESULT_FOLDER, podcast_id)
        
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)  # Recursively remove directory and contents
            logger.info('Podcast deletion successful')
            return jsonify({'success': True})
        else:
            logger.warning('Attempted to delete non-existent podcast')
            return jsonify({'success': False, 'message': 'Podcast not found'}), 404
    except Exception as e:
        logger.error(f'Error in podcast deletion: {str(e)}')
        return jsonify({'success': False, 'message': 'Server error'}), 500

def load_json_file(folder_path, filename):
    file_path = os.path.join(folder_path, filename)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error(f'Error decoding JSON file: {file_path}')
            return None
    return None
