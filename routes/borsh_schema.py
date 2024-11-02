from borsh_construct import (
    CStruct, 
    String, 
    U8, 
    U64, 
    U128, 
    Bool
)
import traceback

# Schema for U128 values (used for balances, amounts, etc.)
u128_schema = U128

# Schema for the User struct from the contract
user_schema = CStruct(
    "wallet" / String,
    "amount_per_swap" / U128,
    "swap_interval" / U64,
    "last_swap_timestamp" / U64,
    "total_swapped" / U128,
    "amount" / U128,
    "pause" / Bool,
    "reverse" / Bool
)

# Schema for storage balance responses
storage_balance_schema = CStruct(
    "total" / U128,
    "available" / U128
)

def deserialize_user(data: bytes) -> dict:
    """
    Deserialize user data from bytes into a dictionary.
    Handles the conversion of U128 values to strings for JSON serialization.
    """
    try:
        print(f"Attempting to deserialize user data. Raw bytes: {list(data)}")
        user = user_schema.parse(data)
        result = {
            "wallet": user.wallet,
            "amount_per_swap": str(user.amount_per_swap),
            "swap_interval": user.swap_interval,
            "last_swap_timestamp": user.last_swap_timestamp,
            "total_swapped": str(user.total_swapped),
            "amount": str(user.amount),
            "pause": user.pause,
            "reverse": user.reverse
        }
        print(f"Successfully deserialized user data: {result}")
        return result
    except Exception as e:
        print(f"Error deserializing user data: {e}")
        print(f"Raw bytes that failed: {list(data)}")
        print(traceback.format_exc())
        raise

def deserialize_balance(data: bytes) -> str:
    """
    Deserialize a U128 balance from bytes into a string.
    Used for FT balances like ft_balance_of responses.
    """
    try:
        print(f"Attempting to deserialize balance. Raw bytes: {list(data)}")
        if not data:
            print("Warning: Empty data received")
            return "0"
            
        # Try to parse as U128
        try:
            balance = u128_schema.parse(data)
            result = str(balance)
            print(f"Successfully deserialized balance: {result}")
            return result
        except Exception as e:
            print(f"U128 parse failed: {e}")
            print(traceback.format_exc())
            
            # If parsing fails, try interpreting as little-endian bytes
            try:
                # Convert bytes to integer (little-endian)
                value = int.from_bytes(data, byteorder='little', signed=False)
                result = str(value)
                print(f"Successfully converted bytes to integer: {result}")
                return result
            except Exception as e:
                print(f"Bytes to integer conversion failed: {e}")
                print(traceback.format_exc())
                
                # If that fails too, try interpreting as JSON-encoded string
                try:
                    # Try decoding as UTF-8 string
                    json_str = data.decode('utf-8')
                    # Try parsing as JSON number
                    import json
                    value = json.loads(json_str)
                    if isinstance(value, (int, str)):
                        result = str(value)
                        print(f"Successfully parsed JSON number: {result}")
                        return result
                    raise ValueError("JSON value is not a number")
                except Exception as e:
                    print(f"JSON number parsing failed: {e}")
                    print(traceback.format_exc())
                    raise
            
    except Exception as e:
        print(f"Error deserializing balance: {e}")
        print(f"Raw bytes that failed: {list(data)}")
        print(traceback.format_exc())
        raise

def deserialize_storage_balance(data: bytes) -> dict:
    """
    Deserialize storage balance data from bytes into a dictionary.
    Used for storage_balance_of responses.
    """
    try:
        print(f"Attempting to deserialize storage balance. Raw bytes: {list(data)}")
        balance = storage_balance_schema.parse(data)
        result = {
            "total": str(balance.total),
            "available": str(balance.available)
        }
        print(f"Successfully deserialized storage balance: {result}")
        return result
    except Exception as e:
        print(f"Error deserializing storage balance: {e}")
        print(f"Raw bytes that failed: {list(data)}")
        print(traceback.format_exc())
        raise

def debug_bytes(data: bytes) -> str:
    """
    Helper function to create a debug string representation of bytes.
    """
    try:
        return (f"Bytes (len={len(data)}): {list(data)}\n"
                f"As hex: {data.hex()}\n"
                f"As utf-8 (if possible): {data.decode('utf-8', errors='replace')}")
    except Exception as e:
        return f"Error creating debug string: {e}"
