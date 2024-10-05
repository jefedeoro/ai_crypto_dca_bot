#!/bin/bash

# Create directories
mkdir -p data smart_contracts/build

# Create .env file with placeholders
cat << EOF > .env
TELEGRAM_TOKEN=your_telegram_token
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEAR_NETWORK=testnet
NEAR_CONTRACT_ID=your_contract_id.testnet
DCA_SERVER_URL=http://localhost:5000
EOF

echo "Project directories have been set up."
echo "Please update the .env file with your actual API keys and settings."

# Install Python dependencies
pip install -r requirements.txt

# Install NEAR CLI
npm install -g near-cli

echo "NEAR CLI installed. Please run 'near login' to set up your NEAR account."
echo "After logging in, deploy your smart contract using the instructions in the README.md file."

# Create a default result folder
default_folder="data/default_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$default_folder"
echo "Created default result folder: $default_folder"

# Export the default folder as an environment variable
echo "export TG_NEWS_RESULT_FOLDER=$default_folder" >> ~/.bashrc
echo "export TG_NEWS_RESULT_FOLDER=$default_folder" >> ~/.zshrc

echo "Default result folder has been set and exported as TG_NEWS_RESULT_FOLDER."
echo "Please restart your terminal or run 'source ~/.bashrc' (or 'source ~/.zshrc') to apply the changes."