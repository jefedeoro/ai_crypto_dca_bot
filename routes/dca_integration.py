# dca_integration.py

from flask import Blueprint, request, jsonify
import subprocess
import json
import os
from config import CONTRACT_ID

dca_bp = Blueprint('dca', __name__)

NEAR_NETWORK = os.getenv('NEAR_NETWORK', 'testnet')

def run_near_cli_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing NEAR CLI command: {e.stderr}")
        return None

@dca_bp.route('/setdca', methods=['POST'])
def set_dca():
    data = request.json
    account_id = data.get('AccountId')  # Updated to AccountId
    crypto = data.get('crypto')
    amount = data.get('amount')
    frequency = data.get('frequency')
    endDate = data.get('endDate')

    if not account_id:
        return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

    # Construct the arguments for the smart contract call
    args = json.dumps({
        'account_id': account_id,
        'crypto': crypto,
        'amount': amount,
        'frequency': frequency
    })

    # Construct the NEAR CLI command
    command = [
        "near",
        "call",
        CONTRACT_ID,
        "set_investment",
        args,
        "--accountId",
        account_id,
        "--networkId",
        NEAR_NETWORK
    ]

    # Execute the command
    result = run_near_cli_command(command)

    if result:
        return jsonify({'status': 'success', 'result': result})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to set DCA investment'}), 500

@dca_bp.route('/getdca', methods=['GET'])
def get_dca():
    account_id = request.args.get('AccountId')  # Updated to AccountId

    if not account_id:
        return jsonify({'status': 'error', 'message': 'Missing account ID'}), 400

    # Construct the NEAR CLI command
    command = [
        "near",
        "view",
        CONTRACT_ID,
        "get_investment",
        f'{{"account_id": "{account_id}"}}',
        "--networkId",
        NEAR_NETWORK
    ]

    # Execute the command
    result = run_near_cli_command(command)

    if result:
        try:
            investment = json.loads(result)
            return jsonify({'status': 'success', 'investment': investment})
        except json.JSONDecodeError:
            return jsonify({'status': 'error', 'message': 'Failed to parse investment data'}), 500
    else:
        return jsonify({'status': 'error', 'message': 'Failed to get DCA investment'}), 500
