# config.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Trusted crypto news websites
NEWS_SOURCES = [
    {'url': 'https://www.newsbtc.com', 'name': 'NewsBTC'},
    {'url': 'https://cryptonews.com', 'name': 'CryptoNews'},
    {'url': 'https://www.theblockcrypto.com/?modal=newsletter', 'name': 'TheBlock'},
]

# Relevant keywords for filtering
KEYWORDS = [
    'NEAR', 'NEAR Protocol', 'bitcoin', 'ethereum', 'crypto', 'blockchain', 'decentralized', 'cryptocurrency', 'defi', 'nft', 'token', 'altcoin', 'mining', 'wallet', 'exchange', 'chain abstraction', 'zk-rollups', 'web3', 'dapp', 'staking', 'yield farming', 'cross-chain', 'layer 2', 'smart contract', 'DAO', 'consensus', 'scalability', 'privacy', 'security', 'interoperability', 'oracles', 'bridges', 'cross-chain', 'sharding', 'plasma', 'sidechain', 'rollup', 'zk-snarks', 'zk-starks', 'zk-proof', 'zk-circuit', 'zk-verification', 'zk-privacy', 'zk-scalability', 'zk-security', 'zk-interoperability', 'zk-oracles', 'zk-bridges', 'zk-cross-chain', 'zk-sharding', 'zk-plasma', 'zk-sidechain', 'zk-rollup', 'zk-zk-snarks', 'zk-zk-starks', 'zk-zk-proof', 'zk-zk-circuit', 'zk-zk-verification', 'zk-zk-privacy', 'zk-zk-scalability', 'zk-zk-security', 'zk-zk-interoperability', 'zk-zk-oracles', 'zk-zk-bridges', 'zk-zk-cross-chain', 'zk-zk-sharding', 'zk-zk-plasma', 'zk-zk-sidechain', 'zk-zk-rollup', 'zk-zk-snarks', 'zk-zk-starks', 'zk-zk-proof', 'zk-zk-circuit', 'zk-zk-verification', 'zk-zk-privacy', 'zk-zk-scalability', 'zk-zk-security', 'zk-zk-interoperability', 'zk-zk-oracles', 'zk-zk-bridges', 'zk-zk-cross-chain', 'zk-zk-sharding', 'zk-zk-plasma', 'zk-zk-sidechain', 'zk-zk-rollup', 'zk-zk-snarks', 'zk-zk-starks', 'zk-zk-proof', 'zk-zk-circuit', 'zk-zk-verification', 'zk-zk-privacy', 'zk-zk-scalability', 'zk-zk-security', 'zk-zk-interoperability', 'zk-zk-oracles', 'zk-zk-bridges', 'zk-zk-cross-chain', 'zk-zk-sharding', 'zk-zk-plasma', 'zk-zk-sidechain', 'zk-zk-rollup', 'zk-zk-snarks'
]

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Result folder
RESULT_FOLDER = os.getenv('TG_NEWS_RESULT_FOLDER', 'data')

# Maximum number of stories to scrape
MAX_STORIES = int(os.getenv('MAX_STORIES', 2))  # Default to 20 if not set in .env
