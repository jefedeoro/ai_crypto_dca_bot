# near_integration.py

import os
import subprocess

NEAR_NETWORK = os.getenv('NEAR_NETWORK', 'testnet')
NEAR_CONTRACT_ID = os.getenv('NEAR_CONTRACT_ID', 'dca_contract.testnet')

def check_near_cli():
    try:
        result = subprocess.run(["near", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception("NEAR CLI is not installed or not in PATH")
        print("NEAR CLI is installed and configured")
    except Exception as e:
        print(f"Error checking NEAR CLI: {e}")
        print("Please make sure NEAR CLI is installed and configured properly")

def run_near_cli_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            raise Exception(f"Command failed with error: {result.stderr}")
        return result.stdout
    except Exception as e:
        print(f"Error executing NEAR CLI command: {e}")
        return None

def set_dca_investment(account_id, crypto, amount, frequency):
    args = {
        'account_id': account_id,
        'crypto': crypto,
        'amount': amount,
        'frequency': frequency
    }
    command = f"near call {NEAR_CONTRACT_ID} set_investment '{args}' --accountId {account_id} --network {NEAR_NETWORK}"
    return run_near_cli_command(command)

def get_dca_investment(account_id):
    command = f"near view {NEAR_CONTRACT_ID} get_investment '{{'account_id': '{account_id}'}}' --network {NEAR_NETWORK}"
    return run_near_cli_command(command)

# This function can be called to initialize NEAR integration
def initialize_near():
    check_near_cli()
    # Add any other initialization steps here