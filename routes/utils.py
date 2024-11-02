import time
import random
import string

def generate_nonce():
    """
    Generate a unique nonce matching the frontend implementation:
    timestamp_randomstring
    """
    timestamp = int(time.time() * 1000)
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{timestamp}_{random_str}"
