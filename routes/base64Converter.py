from flask import Blueprint, request, jsonify
import base64
import json
import traceback

try:
    from .borsh_schema import deserialize_balance, deserialize_storage_balance, deserialize_user
except ImportError as e:
    print(f"Error importing borsh_schema: {e}")
    print(traceback.format_exc())
    raise

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
        print(f"Base64 encode error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@base64_bp.route('/api/base64/decode', methods=['POST'])
def decode():
    """Decode base64 data to JSON or Borsh"""
    try:
        data = request.json
        if not data:
            print("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400

        if 'base64' not in data:
            print("No base64 field in request data:", data)
            return jsonify({'error': 'No base64 data provided'}), 400

        base64_data = data['base64']
        print(f"Received base64 data type: {type(base64_data)}")
        print(f"Received base64 data: {base64_data}")

        # If we received a list of numbers, convert it to bytes
        if isinstance(base64_data, list):
            try:
                decoded = bytes(base64_data)
                print(f"Converted number array to bytes: {list(decoded)}")
            except Exception as e:
                print(f"Error converting number array to bytes: {e}")
                print(traceback.format_exc())
                return jsonify({'error': 'Invalid number array'}), 400
        else:
            # Handle string base64 input
            try:
                # First try standard base64 decoding
                decoded = base64.b64decode(base64_data)
                print(f"Decoded base64 string to bytes: {list(decoded)}")
            except Exception as e:
                print(f"Initial base64 decode failed, trying with padding: {e}")
                try:
                    # If that fails, try with padding
                    padded = base64_data + '=' * (-len(base64_data) % 4)
                    decoded = base64.b64decode(padded)
                    print(f"Decoded padded base64 to bytes: {list(decoded)}")
                except Exception as e:
                    print(f"Padded base64 decode failed: {e}")
                    print(traceback.format_exc())
                    return jsonify({'error': 'Invalid base64 data'}), 400

        # If the decoded data is null, return null
        if not decoded or decoded == b'null':
            return jsonify({'result': None})

        # First try to parse as JSON
        try:
            json_str = decoded.decode('utf-8')
            result = json.loads(json_str)
            print("Successfully parsed as JSON:", result)
            return jsonify({'result': result})
        except json.JSONDecodeError:
            print("JSON decode failed, attempting Borsh decode")
            
            # If JSON parsing fails, try Borsh decoding
            try:
                # Try parsing as a simple U128 (for ft_balance_of)
                result = deserialize_balance(decoded)
                print(f"Successfully deserialized as U128: {result}")
                return jsonify({'result': result})
            except Exception as e:
                print(f"U128 deserialize failed: {e}")
                print(traceback.format_exc())
                
                # Try parsing as StorageBalance
                try:
                    result = deserialize_storage_balance(decoded)
                    print(f"Successfully deserialized as StorageBalance: {result}")
                    return jsonify({'result': result})
                except Exception as e:
                    print(f"StorageBalance deserialize failed: {e}")
                    print(traceback.format_exc())
                    
                    # Try parsing as User
                    try:
                        result = deserialize_user(decoded)
                        print(f"Successfully deserialized as User: {result}")
                        return jsonify({'result': result})
                    except Exception as e:
                        print(f"User deserialize failed: {e}")
                        print(traceback.format_exc())
                        
                        # If all parsing attempts fail, try interpreting as raw number
                        try:
                            # Try interpreting as little-endian u128
                            value = int.from_bytes(decoded, byteorder='little', signed=False)
                            print(f"Successfully interpreted as raw number: {value}")
                            return jsonify({'result': str(value)})
                        except Exception as e:
                            print(f"Raw number interpretation failed: {e}")
                            print(traceback.format_exc())
                            
                            # If everything fails, return the raw bytes as a list
                            print("All parsing attempts failed, returning raw bytes")
                            return jsonify({'result': list(decoded)})
            
    except Exception as e:
        print(f"Base64 decode error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
