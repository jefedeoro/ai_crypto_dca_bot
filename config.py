# config.py

import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Contract configuration
CONTRACT_ID = 'test2.dca-near.testnet'
CONTRACT_ID2 = 'test2.dca-near.testnet'
NEAR_RPC_ENDPOINT = os.getenv('NEAR_RPC_URL')  # Use NEAR_RPC_URL from .env

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class Config:
    TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
    ELEVENLABS_VOICE_ID_MAN1 = os.getenv('ELEVENLABS_VOICE_ID_MAN1')
    ELEVENLABS_VOICE_ID_WOMAN1 = os.getenv('ELEVENLABS_VOICE_ID_WOMAN1')
    ELEVENLABS_VOICE_ID_MAN2 = os.getenv('ELEVENLABS_VOICE_ID_MAN2')
    ELEVENLABS_VOICE_ID_WOMAN2 = os.getenv('ELEVENLABS_VOICE_ID_WOMAN2')

    @classmethod
    def log_config(cls):
        logging.debug(f"TELEGRAM_TOKEN: {'Set' if cls.TELEGRAM_TOKEN else 'Not set'}")
        logging.debug(f"OPENAI_API_KEY: {'Set' if cls.OPENAI_API_KEY else 'Not set'}")
        logging.debug(f"ELEVENLABS_API_KEY: {'Set' if cls.ELEVENLABS_API_KEY else 'Not set'}")
        logging.debug(f"ELEVENLABS_VOICE_ID_MAN1: {'Set' if cls.ELEVENLABS_VOICE_ID_MAN1 else 'Not set'}")
        logging.debug(f"ELEVENLABS_VOICE_ID_WOMAN1: {'Set' if cls.ELEVENLABS_VOICE_ID_WOMAN1 else 'Not set'}")
        logging.debug(f"ELEVENLABS_VOICE_ID_MAN2: {'Set' if cls.ELEVENLABS_VOICE_ID_MAN2 else 'Not set'}")
        logging.debug(f"ELEVENLABS_VOICE_ID_WOMAN2: {'Set' if cls.ELEVENLABS_VOICE_ID_WOMAN2 else 'Not set'}")

# Log the configuration when the module is imported
Config.log_config()

# Export CONTRACT_ID and NEAR_RPC_ENDPOINT for use in other modules
__all__ = ['CONTRACT_ID', 'NEAR_RPC_ENDPOINT']
