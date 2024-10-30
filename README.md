# AI-Powered DCA Bot with Crypto News Integration

<style>
.spoiler {
    background: #000;
    color: #000;
    padding: 5px;
}
.spoiler:hover {
    color: #fff;
}
.spoiler a {
    color: #000;
}
.spoiler:hover a {
    color: #0366d6;
}
.spoiler code,
.spoiler .bash,
.spoiler .env,
.spoiler .language-bash,
.spoiler .language-env,
.spoiler .cd,
.spoiler .test,
.spoiler .cp {
    color: #000 !important;
    background: #000 !important;
}
.spoiler:hover code,
.spoiler:hover .bash,
.spoiler:hover .env,
.spoiler:hover .language-bash,
.spoiler:hover .language-env,
.spoiler:hover .cd,
.spoiler:hover .test,
.spoiler:hover .cp {
    color: #24292e !important;
    background: #f6f8fa !important;
}
.spoiler pre {
    background: #000 !important;
}
.spoiler:hover pre {
    background: #f6f8fa !important;
}
.spoiler pre code {
    color: #000 !important;
    background: #000 !important;
}
.spoiler:hover pre code {
    color: #24292e !important;
    background: #f6f8fa !important;
}
.spoiler .hljs,
.spoiler .hljs-keyword,
.spoiler .hljs-selector-tag,
.spoiler .hljs-subst,
.spoiler .hljs-number,
.spoiler .hljs-literal,
.spoiler .hljs-variable,
.spoiler .hljs-template-variable,
.spoiler .hljs-tag .hljs-attr,
.spoiler .hljs-string,
.spoiler .hljs-doctag,
.spoiler .hljs-title,
.spoiler .hljs-section,
.spoiler .hljs-selector-id,
.spoiler .hljs-type,
.spoiler .hljs-class .hljs-title,
.spoiler .hljs-symbol,
.spoiler .hljs-bullet,
.spoiler .hljs-built_in,
.spoiler .hljs-builtin-name,
.spoiler .hljs-attr,
.spoiler .hljs-link,
.spoiler .hljs-params,
.spoiler .hljs-attribute,
.spoiler .hljs-regexp,
.spoiler .hljs-meta,
.spoiler .hljs-selector-class,
.spoiler .hljs-selector-attr,
.spoiler .hljs-selector-pseudo,
.spoiler .hljs-template-tag,
.spoiler .hljs-quote,
.spoiler .hljs-deletion,
.spoiler .hljs-addition,
.spoiler .hljs-emphasis,
.spoiler .hljs-strong,
.spoiler .hljs-comment {
    color: #000 !important;
    background: #000 !important;
}
.spoiler:hover .hljs,
.spoiler:hover .hljs-keyword,
.spoiler:hover .hljs-selector-tag,
.spoiler:hover .hljs-subst,
.spoiler:hover .hljs-number,
.spoiler:hover .hljs-literal,
.spoiler:hover .hljs-variable,
.spoiler:hover .hljs-template-variable,
.spoiler:hover .hljs-tag .hljs-attr,
.spoiler:hover .hljs-string,
.spoiler:hover .hljs-doctag,
.spoiler:hover .hljs-title,
.spoiler:hover .hljs-section,
.spoiler:hover .hljs-selector-id,
.spoiler:hover .hljs-type,
.spoiler:hover .hljs-class .hljs-title,
.spoiler:hover .hljs-symbol,
.spoiler:hover .hljs-bullet,
.spoiler:hover .hljs-built_in,
.spoiler:hover .hljs-builtin-name,
.spoiler:hover .hljs-attr,
.spoiler:hover .hljs-link,
.spoiler:hover .hljs-params,
.spoiler:hover .hljs-attribute,
.spoiler:hover .hljs-regexp,
.spoiler:hover .hljs-meta,
.spoiler:hover .hljs-selector-class,
.spoiler:hover .hljs-selector-attr,
.spoiler:hover .hljs-selector-pseudo,
.spoiler:hover .hljs-template-tag,
.spoiler:hover .hljs-quote,
.spoiler:hover .hljs-deletion,
.spoiler:hover .hljs-addition,
.spoiler:hover .hljs-emphasis,
.spoiler:hover .hljs-strong,
.spoiler:hover .hljs-comment {
    color: inherit !important;
    background: transparent !important;
}
</style>

## Overview
### [REDACTED]
<div class="spoiler">
This project combines automated Dollar Cost Averaging (DCA) on the NEAR blockchain with AI-powered crypto news delivery. It features:

- Smart contract-based DCA execution
- AI-driven news aggregation and summarization
- Professional-quality audio news broadcasts
- Telegram bot integration for updates and control
- Real-time portfolio monitoring
</div>

## Project Structure
### [REDACTED]
<div class="spoiler">
 ├── contracts/ # NEAR smart contracts 
 
 ├── routes/ # Flask route handlers 

 ├── scrape/ # News scraping and AI processing 

 ├── static/ # Frontend assets

 ├── telegram-bot/ # Telegram bot integration 
 
 ├── templates/ # Flask HTML templates 

 └── data/ # Generated content storage
</div>

## Prerequisites
### [REDACTED]
<div class="spoiler">
- Python 3.8+
- Node.js 14+
- Rust (for NEAR contracts)
- NEAR CLI
- Telegram Bot Token
- OpenAI API Key
- ... (other dependencies)
</div>

## Installation
### [REDACTED]
<div class="spoiler">
1. Clone the repository:
```bash
git clone [repository-url]
cd ai_crypto_dca_bot
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
cd telegram-bot
npm install
```

4. Build NEAR contracts:
```bash
cd contracts/near-dca
./build.sh
```
</div>

## Configuration
### [REDACTED]
<div class="spoiler">
1. Create a `.env` file based on `example.env.txt`:
```env
NEAR_NETWORK=testnet
NEAR_CONTRACT_ID=your-contract.testnet
TELEGRAM_BOT_TOKEN=your-telegram-token
OPENAI_API_KEY=your-openai-key
... (add other keys as needed)
```

2. Configure the Telegram bot:
```bash
cd telegram-bot
cp .env_example .env
# Edit .env with your bot token
```
</div>

## Smart Contract Deployment
### [REDACTED]
<div class="spoiler">
1. Login to NEAR CLI:
```bash
near login
```

2. Deploy the contract:
```bash
cd contracts/near-dca
near deploy --accountId your-contract.testnet --wasmFile res/near_dca.wasm
```
</div>

## Running the Application
### [REDACTED]
<div class="spoiler">
1. Start the Flask server:
```bash
python app.py
```

2. Start the Telegram bot:
```bash
cd telegram-bot
npm start
```

3. Launch the news processing service:
```bash
python main.py
```
</div>

## Features

### DCA Functionality
### [REDACTED]
<div class="spoiler">
- Configure investment amount and intervals
- Automated NEAR to USDT swaps
- Real-time balance tracking
- Portfolio performance monitoring
</div>

### AI News Integration
### [REDACTED]
<div class="spoiler">
- Automated news aggregation
- AI-powered summarization
- Text-to-speech conversion
- Professional audio delivery
</div>

### Telegram Bot Commands
### [REDACTED]
<div class="spoiler">
```
/start - Initialize the bot
/dca - View DCA settings
/balance - Check portfolio balance
/news - Get latest crypto news
/help - Display command list
```
</div>

## Development

### Local Testing
### [REDACTED]
<div class="spoiler">
1. Run tests:
```bash
python test_app.py
```

2. Test smart contracts:
```bash
cd contracts/near-dca
cargo test
```
</div>

### Adding New Features
### [REDACTED]
<div class="spoiler">
1. Create a new branch:
```bash
git checkout -b feature/your-feature
```

2. Implement your changes
3. Run tests
4. Submit a pull request
</div>

## Architecture

### Backend Components
### [REDACTED]
<div class="spoiler">
- Flask server for API endpoints

- NEAR smart contracts for DCA execution

- AI pipeline for news processing

- Audio processing for news delivery
</div>

### Frontend Structure
### [REDACTED]
<div class="spoiler">
- Responsive web interface

- Real-time updates via WebSocket

- Interactive portfolio dashboard

- News player integration
</div>

## Security Considerations
### [REDACTED]
<div class="spoiler">
- Smart contract auditing required before mainnet deployment

- API key management through environment variables

- Rate limiting on API endpoints

- Input validation for all user data
</div>

## Contributing
### [REDACTED]
<div class="spoiler">
1. Fork the repository

2. Create your feature branch

3. Commit your changes

4. Push to the branch

5. Create a Pull Request
</div>

## License
### [REDACTED]
<div class="spoiler">
MIT License - see LICENSE file for details
</div>

## Support
### [REDACTED]
<div class="spoiler">
For support and questions:

- Create an issue in the repository

- Contact via Telegram: https://t.me/neardcabot
- Email: support@nearhub.online
</div>
