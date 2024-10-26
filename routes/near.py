from flask import Blueprint, request, jsonify, session
import sys
import os
from pathlib import Path
from functools import wraps

# Add local py-near package to Python path
py_near_path = str(Path(__file__).parent.parent / 'py-near' / 'src')
if py_near_path not in sys.path:
    sys.path.insert(0, py_near_path)

from py_near.account import Account
from py_near.dapps.core import NEAR
import asyncio

# Initialize blueprint
near_bp = Blueprint("near", __name__)

def async_route(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapped

# Initialize NEAR account using environment variables
def get_near_account():
    return Account(
        account_id=os.getenv("ACCOUNT_ID"),
        private_key=os.getenv("PRIVATE_KEY"),
        rpc_addr=os.getenv("NEAR_RPC_URL", "https://rpc.mainnet.near.org")
    )

@near_bp.route("/balance/<account_id>", methods=["GET"])
@async_route
async def get_balance(account_id):
    try:
        acc = get_near_account()
        await acc.startup()
        balance = await acc.get_balance(account_id)
        return jsonify({"account_id": account_id, "balance": balance / NEAR}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/transfer", methods=["POST"])
@async_route
async def transfer_tokens():
    data = request.get_json()
    recipient = data.get("recipient")
    amount = data.get("amount")

    try:
        acc = get_near_account()
        await acc.startup()
        tx = await acc.send_money(recipient, int(float(amount) * NEAR))
        return jsonify({"transaction_hash": tx.transaction.hash}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/call_chain_function", methods=["POST"])
@async_route
async def call_chain_function():
    data = request.get_json()
    contract_id = data.get("contract_id")
    method_name = data.get("method_name")
    args = data.get("args", {})
    gas = data.get("gas", 30000000000000)  # Default gas
    amount = data.get("amount", 0)  # Default deposit

    try:
        acc = get_near_account()
        await acc.startup()
        result = await acc.function_call(
            contract_id=contract_id,
            method_name=method_name,
            args=args,
            gas=gas,
            amount=amount
        )
        return jsonify({"transaction_hash": result.transaction.hash}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@near_bp.route("/view_chain_function", methods=["POST"])
@async_route
async def view_chain_function():
    data = request.get_json()
    contract_id = data.get("contract_id")
    method_name = data.get("method_name")
    args = data.get("args", {})

    try:
        acc = get_near_account()
        await acc.startup()
        result = await acc.view_function(
            contract_id=contract_id,
            method_name=method_name,
            args=args
        )
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
