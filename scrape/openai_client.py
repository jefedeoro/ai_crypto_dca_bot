# openai_client.py

from openai import OpenAI
from .config import OPENAI_API_KEY

# Initialize the OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)
