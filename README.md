# AI-Powered DCA Bot with Crypto News Integration

## Overview

### [REDACTED]

` DECLASSIFIED `

This project combines automated Dollar Cost Averaging (DCA) on the NEAR blockchain with AI-powered crypto news delivery. It features:

- Smart contract-based DCA execution
- AI-driven news aggregation and summarization
- Professional-quality audio news broadcasts
- Telegram bot integration for updates and control
- Real-time portfolio monitoring


## Project Structure

### [REDACTED]

` DECLASSIFIED `

 ├── contracts/ # NEAR smart contracts 
 
 ├── routes/ # Flask route handlers 

 ├── scrape/ # News scraping and AI processing 

 ├── static/ # Frontend assets

 ├── telegram-bot/ # Telegram bot integration 
 
 ├── templates/ # Flask HTML templates 

 └── data/ # Generated content storage


## Prerequisites

### [REDACTED]

` DECLASSIFIED `

- Python 3.8+
- Node.js 14+
- Rust (for NEAR contracts)
- NEAR CLI
- Telegram Bot Token
- OpenAI API Key
- ... (other dependencies)


## Installation
### [REDACTED]

` DECLASSIFIED `

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


## Configuration

### [REDACTED]

` DECLASSIFIED `

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


## Smart Contract Deployment

### [REDACTED]

` DECLASSIFIED `

1. Login to NEAR CLI:
```bash
near login
```

2. Deploy the contract:
```bash
cd contracts/near-dca
near deploy --accountId your-contract.testnet --wasmFile res/near_dca.wasm
```


## Running the Application
### [REDACTED]

` DECLASSIFIED `

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


## Features

### DCA Functionality
### [REDACTED]

` DECLASSIFIED `

- Configure investment amount and intervals
- Automated NEAR to USDT swaps
- Real-time balance tracking
- Portfolio performance monitoring

### AI News Integration
### [REDACTED]

` DECLASSIFIED `

- Automated news aggregation
- AI-powered summarization
- Text-to-speech conversion
- Professional audio delivery

### Telegram Bot Commands
### [REDACTED]

` DECLASSIFIED `

```
/start - Initialize the bot
/dca - View DCA settings
/balance - Check portfolio balance
/news - Get latest crypto news
/help - Display command list
```

## Development

### Local Testing
### [REDACTED]

` DECLASSIFIED `

1. Run tests:
```bash
python test_app.py
```

2. Test smart contracts:
```bash
cd contracts/near-dca
cargo test
```

### Adding New Features
### [REDACTED]

` DECLASSIFIED `

1. Create a new branch:
```bash
git checkout -b feature/your-feature
```

2. Implement your changes
3. Run tests
4. Submit a pull request

## Architecture

### Backend Components
### [REDACTED]

` DECLASSIFIED `

- Flask server for API endpoints

- NEAR smart contracts for DCA execution

- AI pipeline for news processing

- Audio processing for news delivery

### Frontend Structure
### [REDACTED]

` DECLASSIFIED `

- Responsive web interface

- Real-time updates via WebSocket

- Interactive portfolio dashboard

- News player integration

## Security Considerations
### [REDACTED]

` DECLASSIFIED `

- Smart contract auditing required before mainnet deployment

- API key management through environment variables

- Rate limiting on API endpoints

- Input validation for all user data

## Contributing
### [REDACTED]

` DECLASSIFIED `

1. Fork the repository

2. Create your feature branch

3. Commit your changes

4. Push to the branch

5. Create a Pull Request

## License
### [REDACTED]
<div class="spoiler">
Apache version 2 License - see LICENSE file for details
</div>

## Support
### [REDACTED]

` DECLASSIFIED `

For support and questions:

- Create an issue in the repository

- Contact via Telegram: https://t.me/neardcabot
- Email: support@nearhub.online
