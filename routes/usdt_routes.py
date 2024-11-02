from flask import Blueprint, jsonify, request
import base64
import json
import requests
import traceback
from config import CONTRACT_ID, NEAR_RPC_ENDPOINT
from .borsh_schema import deserialize_balance, u128_schema
from .utils import generate_nonce

# Create blueprint without url_prefix to match the route exactly
usdt_bp = Blueprint('usdt', __name__)

@usdt_bp.route('/api/usdt/storage-balance', methods=['GET'])
def get_storage_balance():
    """Get USDT storage balance for an account using the FT contract's storage_balance_of method"""
    try:
        account_id = request.args.get('account_id')
        if not account_id:
            return jsonify({'success': False, 'error': 'Missing account_id parameter'}), 400

        print(f"Checking storage balance for account: {account_id}")

        # Get token address from contract
        token_response = requests.post(
            NEAR_RPC_ENDPOINT or "https://rpc.testnet.near.org",
            json={
                "jsonrpc": "2.0",
                "id": generate_nonce(),
                "method": "query",
                "params": {
                    "request_type": "call_function",
                    "finality": "final",
                    "account_id": CONTRACT_ID,
                    "method_name": "get_token_address",
                    "args_base64": base64.b64encode(b"{}").decode()
                }
            }
        )
        
        token_result = token_response.json()
        if 'error' in token_result:
            print(f"RPC error getting token address: {token_result['error']}")
            return jsonify({'success': False, 'error': 'Failed to get token address'}), 500

        # Decode token address from result
        token_bytes = base64.b64decode(token_result['result']['result'])
        token_address = token_bytes.decode('utf-8').strip('"')
        print(f"Got token address: {token_address}")

        # Prepare args for storage_balance_of call
        args = {"account_id": account_id}
        args_base64 = base64.b64encode(json.dumps(args).encode()).decode()

        # Call the token contract
        response = requests.post(
            NEAR_RPC_ENDPOINT or "https://rpc.testnet.near.org",
            json={
                "jsonrpc": "2.0",
                "id": generate_nonce(),
                "method": "query",
                "params": {
                    "request_type": "call_function",
                    "finality": "final",
                    "account_id": token_address,
                    "method_name": "storage_balance_of",
                    "args_base64": args_base64
                }
            }
        )
        
        result = response.json()
        if 'error' in result:
            print(f"RPC error: {result['error']}")
            return jsonify({'success': False, 'error': 'Failed to fetch storage balance'}), 500

        try:
            # Get the result array
            result_data = result['result']['result']
            if not result_data:  # If null/empty response
                print("No storage balance found")
                return jsonify({'success': True, 'balance': None})

            # Convert array to bytes
            if isinstance(result_data, list):
                print(f"Converting list to bytes: {result_data}")
                result_bytes = bytes(result_data)
            else:
                print(f"Base64 decoding result: {result_data}")
                result_bytes = base64.b64decode(result_data)

            print(f"Bytes for deserialization: {list(result_bytes)}")
            
            # First try parsing as U128
            try:
                balance = u128_schema.parse(result_bytes)
                print(f"Successfully parsed with U128 schema: {balance}")
                return jsonify({'success': True, 'balance': str(balance)})
            except Exception as e:
                print(f"U128 parse failed: {e}")
                # Fall back to deserialize_balance
                balance = deserialize_balance(result_bytes)
                print(f"Successfully parsed with deserialize_balance: {balance}")
                return jsonify({'success': True, 'balance': balance})

        except Exception as e:
            print(f"Deserialization error: {e}")
            print(f"Raw result: {result['result']['result']}")
            print(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500

    except Exception as e:
        print(f"Storage balance error: {e}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
