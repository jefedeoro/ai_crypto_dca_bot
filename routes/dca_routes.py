# routes/dca_routes.py
import base64
import requests
from flask import Blueprint, render_template, request, jsonify
import json
import os
from config import CONTRACT_ID

# Blueprint named 'dca' for cleaner endpoint naming
dca_bp = Blueprint('dca', __name__)
NEAR_NETWORK = os.getenv('NEAR_NETWORK', 'testnet') 
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
    Simulating fetching data from the NEAR contract.
    """
    try:
        # Example of fetching investment data (replace with actual NEAR contract query)
        # This function should interact with the contract to fetch real data
        response = fetch_contract_data(CONTRACT_ID, account_id)
        if response:
            # Parse response into expected format (adjust according to actual data structure)
            investment_data = []
            for investment in response:
                # Adding 'amount' to each investment entry
                investment_data.append({
                    "amount_per_swap": investment.get("amount_per_swap"),
                    "swap_interval": investment.get("swap_interval"),
                    "last_swap_timestamp": investment.get("last_swap_timestamp"),
                    "pause": investment.get("pause"),
                    "amount": investment.get("amount")  # Include the amount from the smart contract
                })
            return investment_data
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
    """
    try:
        # Define the request payload for the RPC view call
        payload = {
            "jsonrpc": "2.0",
            "id": "dontcare",
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

        # Decode the result
        if 'result' in result and 'result' in result['result']:
            encoded_result = result['result']['result']
            decoded_data = base64.b64decode(encoded_result).decode('utf-8')
            user_data = json.loads(decoded_data)

            # Return user investment data in expected format
            return [
                {
                    "amount_per_swap": user_data.get("amount_per_swap"),
                    "swap_interval": user_data.get("swap_interval"),
                    "last_swap_timestamp": user_data.get("last_swap_timestamp"),
                    "pause": user_data.get("pause"),
                    "amount": user_data.get("amount")
                }
            ]
        else:
            return None
    except Exception as e:
        print(f"Error fetching contract data: {e}")
        return None