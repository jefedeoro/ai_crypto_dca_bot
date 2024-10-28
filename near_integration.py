# near_integration.py

import os
import subprocess
import json
import shutil
from config import CONTRACT_ID

NEAR_NETWORK = os.getenv('NEAR_NETWORK', 'testnet')

def is_near_cli_installed():
    """Check if NEAR CLI is installed and in PATH"""
    return shutil.which('near') is not None

def check_near_cli():
    """Check NEAR CLI installation and configuration"""
    if not is_near_cli_installed():
        raise Exception("NEAR CLI is not installed. Please install it using: npm install -g near-cli")
    
    try:
        result = subprocess.run(["near", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception("NEAR CLI is installed but not working properly")
        print("NEAR CLI is installed and configured")
        return True
    except Exception as e:
        print(f"Error checking NEAR CLI: {e}")
        print("Please make sure NEAR CLI is installed and configured properly")
        return False

def run_near_cli_command(command):
    """Execute a NEAR CLI command with proper error handling"""
    try:
        if not is_near_cli_installed():
            raise Exception("NEAR CLI is not installed. Please install it using: npm install -g near-cli")

        print(f"Executing command: {command}")  # Debug log
        
        # Use npm's global bin directory to find near CLI
        npm_path = subprocess.run(['which', 'npm'], capture_output=True, text=True).stdout.strip()
        if npm_path:
            npm_dir = os.path.dirname(npm_path)
            near_path = os.path.join(npm_dir, 'near')
            if os.path.exists(near_path):
                command = command.replace('near', near_path)

        result = subprocess.run(command, capture_output=True, text=True, shell=True)
        print(f"Command output: {result.stdout}")  # Debug log
        print(f"Command error: {result.stderr}")  # Debug log
        
        if result.returncode != 0:
            error_msg = result.stderr or "Unknown error occurred"
            if "near: not found" in error_msg:
                raise Exception("NEAR CLI is not installed. Please install it using: npm install -g near-cli")
            raise Exception(f"Command failed with error: {error_msg}")
        
        # For view commands, try to extract the JSON from the output
        if 'view' in command:
            try:
                # Find the last line that looks like JSON
                output_lines = result.stdout.strip().split('\n')
                json_line = next((line for line in reversed(output_lines) if line.strip().startswith('{')), None)
                if json_line:
                    return json_line
                # If no JSON found, return empty result
                return json.dumps({})
            except Exception as e:
                print(f"Error parsing view command output: {e}")
                return json.dumps({})
        
        return result.stdout
    except Exception as e:
        error_msg = str(e)
        if "near: not found" in error_msg:
            error_msg = "NEAR CLI is not installed. Please install it using: npm install -g near-cli"
        print(f"Error executing NEAR CLI command: {error_msg}")
        raise Exception(error_msg)

def set_dca_investment(account_id, crypto, amount, frequency):
    """Set up a new DCA investment"""
    args = {
        'account_id': account_id,
        'crypto': crypto,
        'amount': amount,
        'frequency': frequency
    }
    command = f"near call {CONTRACT_ID} set_investment '{args}' --accountId {account_id} --network {NEAR_NETWORK}"
    return run_near_cli_command(command)

def get_dca_investment(account_id):
    """Get DCA investment details"""
    command = f"near view {CONTRACT_ID} get_user '{{\"user\": \"{account_id}\"}}' --network {NEAR_NETWORK}"
    return run_near_cli_command(command)

# This function can be called to initialize NEAR integration
def initialize_near():
    """Initialize NEAR integration and check dependencies"""
    if not check_near_cli():
        raise Exception("NEAR CLI setup is required. Please install NEAR CLI using: npm install -g near-cli")
