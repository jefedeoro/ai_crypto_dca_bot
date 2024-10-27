# routes/dca_routes.py
from flask import Blueprint, render_template, request, jsonify
import json
import os
from near_integration import (
    run_near_cli_command,
    NEAR_NETWORK,
    NEAR_CONTRACT_ID
)

# Blueprint named 'dca' for cleaner endpoint naming
dca_bp = Blueprint('dca', __name__)

@dca_bp.route('/dca')
def dca():
    return render_template('dca.html')

@dca_bp.route('/api/dca/register', methods=['POST'])
def register_user():
    """Register a new DCA user with specified amount and interval"""
    try:
        data = request.json
        amount_per_swap = data.get('amount_per_swap')
        swap_interval = data.get('swap_interval')
        
        if not amount_per_swap or not swap_interval:
            return jsonify({'status': 'error', 'message': 'Missing required parameters'}), 400

        command = f"near call {NEAR_CONTRACT_ID} register_user '{{\
            \"amount_per_swap\": \"{amount_per_swap}\", \
            \"swap_interval\": {swap_interval}}}' \
            --accountId {request.headers.get('X-Near-Account-Id')} \
            --network {NEAR_NETWORK}"

        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to register user'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/topup', methods=['POST'])
def topup():
    """Add funds to DCA contract"""
    try:
        command = f"near call {NEAR_CONTRACT_ID} topup --accountId {request.headers.get('X-Near-Account-Id')} --network {NEAR_NETWORK}"
        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to topup'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/withdraw-near', methods=['POST'])
def withdraw_near():
    """Withdraw NEAR from DCA contract"""
    try:
        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'status': 'error', 'message': 'Missing amount parameter'}), 400

        command = f"near call {NEAR_CONTRACT_ID} withdraw_near '{{\
            \"amount\": \"{amount}\"}}' \
            --accountId {request.headers.get('X-Near-Account-Id')} \
            --network {NEAR_NETWORK}"

        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to withdraw NEAR'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/withdraw-ft', methods=['POST'])
def withdraw_ft():
    """Withdraw fungible tokens from DCA contract"""
    try:
        data = request.json
        amount = data.get('amount')
        
        if not amount:
            return jsonify({'status': 'error', 'message': 'Missing amount parameter'}), 400

        command = f"near call {NEAR_CONTRACT_ID} withdraw_ft '{{\
            \"amount\": \"{amount}\"}}' \
            --accountId {request.headers.get('X-Near-Account-Id')} \
            --network {NEAR_NETWORK}"

        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to withdraw tokens'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/pause', methods=['POST'])
def pause():
    """Pause DCA swaps"""
    try:
        command = f"near call {NEAR_CONTRACT_ID} pause --accountId {request.headers.get('X-Near-Account-Id')} --network {NEAR_NETWORK}"
        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to pause DCA'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/resume', methods=['POST'])
def resume():
    """Resume DCA swaps"""
    try:
        command = f"near call {NEAR_CONTRACT_ID} resume --accountId {request.headers.get('X-Near-Account-Id')} --network {NEAR_NETWORK}"
        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to resume DCA'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/remove-user', methods=['POST'])
def remove_user():
    """Remove user from DCA contract and withdraw all tokens"""
    try:
        command = f"near call {NEAR_CONTRACT_ID} remove_user --accountId {request.headers.get('X-Near-Account-Id')} --network {NEAR_NETWORK}"
        result = run_near_cli_command(command)
        if result:
            return jsonify({'status': 'success', 'result': result})
        return jsonify({'status': 'error', 'message': 'Failed to remove user'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dca_bp.route('/api/dca/status', methods=['GET'])
def get_status():
    """Get user's DCA status and investment details"""
    try:
        command = f"near view {NEAR_CONTRACT_ID} get_user_info '{{\
            \"account_id\": \"{request.headers.get('X-Near-Account-Id')}\"}}' \
            --network {NEAR_NETWORK}"
            
        result = run_near_cli_command(command)
        if result:
            try:
                investment_data = json.loads(result)
                return jsonify({
                    'status': 'success',
                    'investments': [{
                        'id': investment_data.get('id', 'N/A'),
                        'amount': investment_data.get('amount_per_swap', '0'),
                        'interval': investment_data.get('swap_interval', '0'),
                        'nextSwap': investment_data.get('next_swap_time', '0'),
                        'status': 'paused' if investment_data.get('is_paused', False) else 'active'
                    }] if investment_data else []
                })
            except json.JSONDecodeError:
                return jsonify({'status': 'error', 'message': 'Failed to parse investment data'}), 500
        return jsonify({'status': 'error', 'message': 'Failed to get status'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
