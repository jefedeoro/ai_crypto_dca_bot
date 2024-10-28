from flask import Blueprint, request, jsonify
import base64
import json

base64_bp = Blueprint('base64', __name__)

@base64_bp.route('/api/base64/encode', methods=['POST'])
def encode():
    """Encode JSON data to base64"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Convert to JSON string and encode to base64
        json_str = json.dumps(data)
        base64_str = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
        return jsonify({'result': base64_str})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@base64_bp.route('/api/base64/decode', methods=['POST'])
def decode():
    """Decode base64 data to JSON"""
    try:
        data = request.json
        if not data or 'base64' not in data:
            return jsonify({'error': 'No base64 data provided'}), 400
            
        # Decode base64
        try:
            # First try standard base64 decoding
            decoded = base64.b64decode(data['base64'])
        except Exception:
            # If that fails, try with padding
            padded = data['base64'] + '=' * (-len(data['base64']) % 4)
            decoded = base64.b64decode(padded)

        # Convert array of numbers to string and parse as JSON
        try:
            # Convert bytes to list of integers
            bytes_list = [b for b in decoded]
            # Convert integers to characters and join
            json_str = ''.join(chr(b) for b in bytes_list)
            # Parse JSON
            result = json.loads(json_str)
            return jsonify({'result': result})
        except Exception as e:
            print(f"Error parsing JSON: {e}")
            # If parsing fails, return the raw bytes as a list
            return jsonify({'result': bytes_list})
            
    except Exception as e:
        print(f"Base64 decode error: {e}")
        return jsonify({'error': str(e)}), 500
