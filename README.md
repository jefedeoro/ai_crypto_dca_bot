# AI-Driven Crypto News & DCA Bot

An application that aggregates crypto news, summarizes it, converts it to audio, and delivers it via a Telegram bot. It also allows users to set up Dollar-Cost Averaging (DCA) investments on the NEAR blockchain.

## Features

- **News Aggregation**: Scrapes news from trusted crypto sources.
- **Summarization**: Uses NLP to summarize articles.
- **Text-to-Speech**: Converts summaries into audio.
- **Telegram Bot**: Delivers news and manages DCA investments. (Currently commented out for testing)
- **DCA Investments**: Users can set up DCA on the NEAR blockchain.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/crypto-dca-bot.git
   cd crypto-dca-bot
   ```

2. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This script will:
   - Create necessary directories
   - Create a .env file with placeholders
   - Install Python dependencies
   - Install NEAR CLI
   - Create a default result folder and export it as an environment variable

3. **Update the `.env` file**:
   Open the `.env` file and replace the placeholders with your actual API keys and settings:
   ```
   TELEGRAM_TOKEN=your_telegram_token
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   NEAR_NETWORK=testnet
   NEAR_CONTRACT_ID=your_contract_id.testnet
   DCA_SERVER_URL=http://localhost:5000
   ```

4. **Set up NEAR account**:
   Log in to your NEAR account:
   ```bash
   near login
   ```

5. **Build and deploy smart contracts**:
   - Navigate to `smart_contracts/`:
     ```bash
     cd smart_contracts
     npm install
     ```
   - Build the contract:
     ```bash
     npm run build
     ```
   - Deploy to NEAR testnet:
     ```bash
     near deploy --accountId your_account.testnet --wasmFile build/contract.ts
     ```

6. **Run the main script to process news**:
   ```bash
   python main.py
   ```
   This script will aggregate news, summarize articles, generate a script, and convert it to audio.

7. **Run the Flask app for the Telegram bot** (Currently commented out for testing):
   ```bash
   # python app.py
   ```

8. **Set up Telegram webhook** (Currently not needed for testing):
   - Use a service like ngrok to expose your local server:
     ```bash
     # ngrok http 5000
     ```
   - Set the webhook URL to `https://your_ngrok_url/webhook` using Telegram's API.

## Usage

Note: The following commands are currently unavailable as the Telegram bot is commented out for testing.

- Start the bot by sending `/start` in Telegram.
- Use `/help` to see available commands.
- Use `/getnews` to receive the latest crypto news.
- Set up DCA investments:
  - Use `/setdca` to initiate the DCA setup process.
  - Follow the prompts to set your crypto, amount, and frequency.
- Check your DCA status with `/status`.

## Project Structure

- `main.py`: Orchestrates the news aggregation, summarization, script writing, and text-to-speech processes.
- `news_aggregator.py`: Scrapes news from crypto sources.
- `news_summarizer.py`: Summarizes articles using OpenAI's GPT-4o-mini model.
- `script_writer.py`: Generates a script from summarized news.
- `text_to_speech.py`: Converts the script to audio.
- `app.py`: Flask application for the Telegram bot. (Currently not in use)
- `dca_integration.py`: Handles DCA investment logic and NEAR blockchain integration.
- `data/`: Contains result folders with processed news data and audio files.

## NEAR Smart Contract Integration

This bot integrates with a NEAR smart contract to manage DCA investments. The smart contract handles setting and retrieving investment details for each user. The integration is done using NEAR CLI, which must be installed and configured on the system running the bot.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT License](LICENSE)

## Troubleshooting

If you encounter any issues:
1. Ensure all environment variables are correctly set in the `.env` file.
2. Check that NEAR CLI is properly installed and you're logged in to your NEAR account.
3. Verify that the smart contract is correctly deployed and the contract ID is set in your environment variables.
4. Make sure you're connected to the correct NEAR network (testnet or mainnet) as specified in your environment variables.
5. Check the console output for any error messages when running the scripts.

If you face any other issues, please open an issue on the GitHub repository.