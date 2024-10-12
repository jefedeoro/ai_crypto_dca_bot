# config.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Trusted crypto news websites
NEWS_SOURCES = [
    {'url': 'https://us1.campaign-archive.com/feed?u=ed13caf5cf7d37689d81ef60b&id=86d4e11a12', 'name': 'NEARWeek'},
    {'url': 'https://www.newsbtc.com', 'name': 'NewsBTC'},
    {'url': 'https://cryptonews.com', 'name': 'CryptoNews'},
    {'url': 'https://www.theblockcrypto.com/?modal=newsletter', 'name': 'TheBlock'},
]

# Relevant keywords for filtering
KEYWORDS = [
    'NEAR', 'NEAR Protocol', 'NEAR blockchain', 'NEAR token', 'NEARcoin', 'NEAR.org', 'NEAR Core', 'NEAR Wallet', 'NEAR Studio', 'NEAR Dev', 'NEAR Guild', 'NEAR Community', 'NEAR Ecosystem', 'NEAR Foundation', 'NEAR Grants', 'NEAR Hackathon', 'NEAR Con', 'NEAR Summit', 'NEAR Collective', 'NEAR Guilds', 'NEAR Validators', 'NEAR Staking', 'NEAR Tokenomics', 'NEAR Economics', 'NEAR Roadmap', 'NEAR Whitepaper', 'NEAR Docs', 'NEAR Blog', 'NEAR Twitter', 'NEAR Discord', 'NEAR Telegram', 'NEAR Reddit', 'NEAR YouTube', 'NEAR Medium', 'NEAR LinkedIn', 'NEAR GitHub', 'NEAR Gitcoin', 'NEAR Open Web Collective', 'NEAR Rainbow Bridge', 'NEAR Aurora', 'NEAR Nightshade', 'NEAR Sharding', 'NEAR Rainbow', 'NEAR WalletConnect', 'NEAR WalletLink', 'NEAR Wallet', 'NEAR Wallets', 'NEAR DApps', 'NEAR Apps', 'NEAR DeFi', 'NEAR NFT', 'NEAR DAO', 'NEAR Smart Contracts', 'NEAR Contracts', 'NEAR Rust', 'NEAR AssemblyScript', 'NEAR Assembly'
    #  'bitcoin', 'ethereum', 'defi', 'nft','chain abstraction', 'web3', 'web4', 'dapp', 'staking', 'cross-chain', 'smart contract', 'DAO', 'scalability', 'privacy', 'sharded network', 'interoperability', 'oracles', 'bridges', 'cross-chain', 'sharding'
]

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Result folder
RESULT_FOLDER = os.getenv('TG_NEWS_RESULT_FOLDER', 'data')

# Maximum number of stories to scrape
MAX_STORIES = int(os.getenv('MAX_STORIES', 2))  # Default to 20 if not set in .env
