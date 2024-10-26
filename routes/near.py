from flask import Blueprint, request, jsonify, session
from pynear import Near
import os

# Initialize NEAR connection using environment variables
near = Near(rpc_url=os.getenv("NEAR_RPC_URL"), network_id=os.getenv("NETWORK_ID"))

# Initialize blueprint
near_bp = Blueprint("near", __name__)

@near_bp.route("/balance/<account_id>", methods=["GET"])
def get_balance(account_id):
    try:
        account = near.get_account(account_id)
        balance = account.get_balance()
        return jsonify({"account_id": account_id, "balance": balance}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/transfer", methods=["POST"])
def transfer_tokens():
    data = request.get_json()
    recipient = data.get("recipient")
    amount = data.get("amount")

    try:
        sender = near.get_account(os.getenv("ACCOUNT_ID"))
        tx_hash = sender.send_tokens(recipient, amount, private_key=os.getenv("PRIVATE_KEY"))
        return jsonify({"transaction_hash": tx_hash}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/call_chain_function", methods=["POST"])
def call_chain_function():
    data = request.get_json()
    account_id = data.get("account_id")
    method_name = data.get("method_name")
    params = data.get("params", {})
    gas = data.get("gas", 30000000000000)  # Default gas
    deposit = data.get("deposit", 0)  # Default deposit

    try:
        account = near.get_account(account_id)
        result = account.function_call(
            method_name=method_name,
            params=params,
            gas=gas,
            deposit=deposit,
            private_key=os.getenv("PRIVATE_KEY")
        )
        return jsonify({"transaction_hash": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/view_chain_function", methods=["POST"])
def view_chain_function():
    data = request.get_json()
    account_id = data.get("account_id")
    method_name = data.get("method_name")
    params = data.get("params", {})

    try:
        account = near.get_account(account_id)
        result = account.view_function(method_name=method_name, params=params)
        return jsonify({"result": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    account_id = data.get("account_id")
    public_key = data.get("public_key")
    
    try:
        # Store wallet connection info in session
        session['near_wallet'] = {
            'account_id': account_id,
            'public_key': public_key,
            'is_connected': True
        }
        return jsonify({
            "success": True,
            "account_id": account_id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/logout", methods=["POST"])
def logout():
    try:
        # Clear NEAR wallet session data
        if 'near_wallet' in session:
            session.pop('near_wallet')
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/wallet_status", methods=["GET"])
def wallet_status():
    wallet_data = session.get('near_wallet', {})
    return jsonify({
        "is_connected": wallet_data.get('is_connected', False),
        "account_id": wallet_data.get('account_id', None)
    }), 200
