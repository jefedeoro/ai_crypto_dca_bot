# routes/dca_routes.py
import base64
import requests
from flask import Blueprint, render_template, request, jsonify
import json
import os
from config import CONTRACT_ID
from .borsh_schema import deserialize_user, deserialize_balance
from .utils import generate_nonce

# Blueprint named 'dca' for cleaner endpoint naming
dca_bp = Blueprint('dca', __name__)
NEAR_NETWORK = os.getenv('NEAR_NETWORK', 'testnet') 
NEAR_RPC_ENDPOINT = f"https://rpc.{NEAR_NETWORK}.near.org"

@dca_bp.route('/api/usdt/pool-balance')
def get_usdt_pool_balance():
    """Get USDT balance of the pool"""
    try:
        # Encode args for ft_balance_of call
        args = {"account_id": CONTRACT_ID}
        args_base64 = base64.b64encode(json.dumps(args).encode()).decode()

        # Call the USDT contract
        response = requests.post(
            NEAR_RPC_ENDPOINT,
            json={
                "jsonrpc": "2.0",
                "id": generate_nonce(),
                "method": "query",
                "params": {
                    "request_type": "call_function",
                    "finality": "final",
                    "account_id": "usdt.fakes.testnet",
                    "method_name": "ft_balance_of",
                    "args_base64": args_base64
                }
            }
        )
        
        result = response.json()
        if 'error' in result:
            print(f"RPC error: {result['error']}")
            return jsonify({'success': False, 'error': 'Failed to fetch balance'}), 500

        # Decode and deserialize the balance
        try:
            balance_bytes = base64.b64decode(result['result']['result'])
            balance = deserialize_balance(balance_bytes)
            return jsonify({'success': True, 'balance': str(balance)})
        except Exception as e:
            print(f"Deserialization error: {e}")
            return jsonify({'success': False, 'error': 'Failed to decode balance'}), 500

    except Exception as e:
        print(f"Pool balance error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@dca_bp.route('/dca')
def dca():
    return render_template('dca.html')

@dca_bp.route('/api/dca/register', methods=['POST'])
def register_user():
    """Register a new DCA user"""
    try:
        data = request.json
        account_id = data.get('AccountId')  # Updated to AccountId
        gas = data.get('gas', "300000000000000")  # Default 300 TGas if not provided
        
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Logic to register user using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'User registration initiated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/topup', methods=['POST'])
def topup():
    """Add funds to DCA contract"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Logic to top up using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'Topup initiated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/withdraw-near', methods=['POST'])
def withdraw_near():
    """Withdraw NEAR from DCA contract"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'status': 'error', 'message': 'Missing amount parameter'}), 400

        # Logic to withdraw NEAR using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'Withdrawal initiated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/withdraw-ft', methods=['POST'])
def withdraw_ft():
    """Withdraw fungible tokens from DCA contract"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'status': 'error', 'message': 'Missing amount parameter'}), 400

        # Logic to withdraw fungible tokens using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'Token withdrawal initiated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/pause', methods=['POST'])
def pause():
    """Pause DCA swaps"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Logic to pause DCA using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'DCA paused'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/resume', methods=['POST'])
def resume():
    """Resume DCA swaps"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Logic to resume DCA using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'DCA resumed'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/remove-user', methods=['POST'])
def remove_user():
    """Remove user from DCA contract and withdraw all tokens"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Logic to remove user using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'User removed'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/status', methods=['GET']) 
def get_status():
    """Get user's DCA status and investment details"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        # Retrieve the investment data for the account ID
        investment_data = get_investments(account_id)

        if investment_data:
            return jsonify({'status': 'success', 'investments': investment_data}), 200
        else:
            return jsonify({'status': 'error', 'message': 'No investments found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def get_investments(account_id):
    """
    Fetch investment data for a given account_id from the smart contract.
    """
    try:
        response = fetch_contract_data(CONTRACT_ID, account_id)
        if response:
            return response
        else:
            return None
    except Exception as e:
        print(f"Error fetching investments: {e}")
        return None

@dca_bp.route('/api/dca/change-interval', methods=['POST'])
def change_interval():
    """Change DCA swap interval"""
    try:
        account_id = request.headers.get('X-Near-Account-Id')  # Assuming account_id is passed in the headers
        if not account_id:
            return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

        data = request.json
        swap_interval = data.get('swap_interval')
        
        if not swap_interval:
            return jsonify({'status': 'error', 'message': 'Missing swap_interval parameter'}), 400

        # Logic to change interval using near-api-js will be handled in the frontend
        return jsonify({'status': 'success', 'message': 'Interval change initiated'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
def fetch_contract_data(contract_id, account_id):
    """
    Function to fetch actual data from the NEAR contract using NEAR RPC API.
    Now uses borsh deserialization for the response.
    """
    try:
        # Define the request payload for the RPC view call
        payload = {
            "jsonrpc": "2.0",
            "id": generate_nonce(),
            "method": "query",
            "params": {
                "request_type": "call_function",
                "account_id": contract_id,
                "method_name": "get_user",
                "args_base64": base64.b64encode(json.dumps({"user": account_id}).encode("utf-8")).decode("utf-8"),
                "finality": "final"
            }
        }

        # Make a POST request to NEAR RPC endpoint
        response = requests.post(NEAR_RPC_ENDPOINT, json=payload)
        response.raise_for_status()

        # Parse the response
        result = response.json()
        if 'error' in result:
            raise Exception(result['error']['message'])

        # Decode and deserialize the result using borsh
        if 'result' in result and 'result' in result['result']:
            encoded_result = result['result']['result']
            decoded_bytes = base64.b64decode(encoded_result)
            
            # Use borsh to deserialize the bytes into a User struct
            user_data = deserialize_user(decoded_bytes)

            # Return as a list to maintain compatibility with existing code
            return [user_data]
        else:
            return None
    except Exception as e:
        print(f"Error fetching contract data: {e}")
        return None
