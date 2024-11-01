# config.py

import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Trusted crypto news websites
NEWS_SOURCES = [
    {'url': 'https://news.google.com/search?q=near+protocol+news&sca_esv=04ccc06d6a14a3bd&rlz=1C1ONGR_enMX1063MX1063&biw=1600&bih=1171&dpr=0.8&hl=en-US&gl=US&ceid=US:en', 'name': 'Google News'},
    {'url': 'https://us1.campaign-archive.com/feed?u=ed13caf5cf7d37689d81ef60b&id=86d4e11a12', 'name': 'NEARWeek'},
    {'url': 'https://www.newsbtc.com/?s=NEAR', 'name': 'NewsBTC'},
    # {'url': 'https://www.theblockcrypto.com/?modal=newsletter', 'name': 'TheBlock'},
    
]

# Relevant keywords for filtering
KEYWORDS = [
    'NEAR', 'NEAR Protocol', 'NEAR blockchain', 'NEAR token', 'NEARcoin', 'NEAR.org', 'NEAR Core', 'NEAR Wallet', 'NEAR Studio', 'NEAR Dev', 'NEAR Guild', 'NEAR Community', 'NEAR Ecosystem', 'NEAR Foundation', 'NEAR Grants', 'NEAR Hackathon', 'NEAR Con', 'NEAR Summit', 'NEAR Collective', 'NEAR Guilds', 'NEAR Validators', 'NEAR Staking', 'NEAR Tokenomics', 'NEAR Economics', 'NEAR Roadmap', 'NEAR Whitepaper', 'NEAR Docs', 'NEAR Blog', 'NEAR Twitter', 'NEAR Discord', 'NEAR Telegram', 'NEAR Reddit', 'NEAR YouTube', 'NEAR Medium', 'NEAR LinkedIn', 'NEAR GitHub', 'NEAR Gitcoin', 'NEAR Open Web Collective', 'NEAR Rainbow Bridge', 'NEAR Aurora', 'NEAR Nightshade', 'NEAR Sharding', 'NEAR Rainbow', 'NEAR WalletConnect', 'NEAR WalletLink', 'NEAR Wallet', 'NEAR Wallets', 'NEAR DApps', 'NEAR Apps', 'NEAR DeFi', 'NEAR NFT', 'NEAR DAO', 'NEAR Smart Contracts', 'NEAR Contracts', 'NEAR Rust', 'NEAR AssemblyScript', 'NEAR Assembly'
]

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Result folder
RESULT_FOLDER = os.getenv('TG_NEWS_RESULT_FOLDER', 'data')

# Maximum number of stories to scrape
MAX_STORIES = int(os.getenv('MAX_STORIES', 3))  # Default to 20 if not set in .env

# Blocked sites
BLOCKED_SITES = ["lu.ma", "eventbrite.com"]
