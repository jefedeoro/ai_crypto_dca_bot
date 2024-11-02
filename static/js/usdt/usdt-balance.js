// usdt-balance.js - Handles USDT balance checking and formatting functions

const USDT_CONTRACT = "usdt.fakes.testnet"; // USDT contract on NEAR testnet

function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Function to get USDT balance for an account
export async function getUSDTBalance(accountId) {
    try {
        // First encode the args using our base64 converter
        const encodeResponse = await fetch('/api/base64/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ account_id: accountId })
        });
        const encodeResult = await encodeResponse.json();
        if (encodeResult.error) {
            throw new Error(encodeResult.error);
        }

        // Call the USDT contract
        const response = await fetch('https://rpc.testnet.near.org', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: generateNonce(),
                method: 'query',
                params: {
                    request_type: 'call_function',
                    finality: 'final',
                    account_id: USDT_CONTRACT,  // Use USDT contract address
                    method_name: 'ft_balance_of',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        
        // For debugging
        console.log("RPC Response:", result);
        
        if (result.error || (result.result && result.result.error)) {
            console.error("RPC error:", result.error || result.result.error);
            return "0";
        }

        // Check for the correct result structure
        if (!result.result || !result.result.result) {
            console.error("Invalid RPC response format:", result);
            return "0";
        }

        // Log the raw result
        console.log("Raw RPC result:", result.result.result);

        // Decode the result using our base64 converter
        const decodeResponse = await fetch('/api/base64/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                base64: result.result.result,
                method: 'ft_balance_of'  // Hint at what we're decoding
            })
        });

        // Log the decode response status
        console.log("Decode response status:", decodeResponse.status);

        if (!decodeResponse.ok) {
            const errorText = await decodeResponse.text();
            console.error("Decode response error:", decodeResponse.status, errorText);
            return "0";
        }

        const decodeResult = await decodeResponse.json();
        if (decodeResult.error) {
            console.error("Decode error:", decodeResult.error);
            return "0";
        }

        // For debugging
        console.log("Decoded result:", decodeResult);

        return decodeResult.result || "0";
    } catch (error) {
        console.error("Error getting USDT balance:", error);
        return "0";
    }
}

// Helper functions for formatting amounts
export function formatNearAmount(yoctoNear) {
    try {
        const value = BigInt(yoctoNear);
        const nearStr = value.toString().padStart(25, '0'); // Ensure at least 24 decimal places
        const integerPart = nearStr.slice(0, -24) || '0';
        const decimalPart = nearStr.slice(-24);
        
        // Find first non-zero digit in decimal part
        let firstNonZero = 0;
        while (firstNonZero < decimalPart.length && decimalPart[firstNonZero] === '0') {
            firstNonZero++;
        }
        
        if (firstNonZero === decimalPart.length) {
            // All zeros after decimal point
            return integerPart;
        }
        
        // Take the first non-zero digit and next two digits
        const significantDecimals = decimalPart.slice(firstNonZero, firstNonZero + 3);
        
        // Format with proper number of leading zeros
        return `0.${'0'.repeat(firstNonZero)}${significantDecimals}`;
    } catch (error) {
        console.error("Error formatting NEAR amount:", error);
        return "0";
    }
}

export function formatUSDTAmount(amount) {
    try {
        const value = BigInt(amount);
        return (Number(value) / 24).toFixed(2).replace(/\.?0+$/, '');
    } catch (error) {
        console.error("Error formatting USDT amount:", error);
        return "0";
    }
}

export function formatInterval(nanoseconds) {
    const seconds = nanoseconds / 1_000_000_000n;
    if (seconds >= 86400n) return `${Number(seconds / 86400n)} days`;
    if (seconds >= 3600n) return `${Number(seconds / 3600n)} hours`;
    if (seconds >= 60n) return `${Number(seconds / 60n)} minutes`;
    return `${Number(seconds)} seconds`;
}

export function formatTimestamp(nanoseconds) {
    const milliseconds = Math.floor(nanoseconds / 1_000_000);
    return new Date(milliseconds).toLocaleString();
}

async function get_usdt_pool_balance() {
    try {
        // First encode the args using our base64 converter
        const encodeResponse = await fetch('/api/base64/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ account_id: "test2.dca-near.testnet" })
        });
        const encodeResult = await encodeResponse.json();
        if (encodeResult.error) {
            throw new Error(encodeResult.error);
        }

        // Call the USDT contract directly
        const response = await fetch('https://rpc.testnet.near.org', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: generateNonce(),
                method: 'query',
                params: {
                    request_type: 'call_function',
                    finality: 'final',
                    account_id: USDT_CONTRACT,  // Use USDT contract address
                    method_name: 'ft_balance_of',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error) {
            console.error("RPC error:", result.error);
            return;
        }

        // Check for the correct result structure
        if (!result.result || !result.result.result) {
            console.error("Invalid RPC response format:", result);
            return;
        }

        // Decode the result using our base64 converter
        const decodeResponse = await fetch('/api/base64/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                base64: result.result.result,
                method: 'ft_balance_of'
            })
        });

        if (!decodeResponse.ok) {
            console.error("Decode response error:", decodeResponse.status);
            return;
        }

        const decodeResult = await decodeResponse.json();
        if (decodeResult.error) {
            console.error("Decode error:", decodeResult.error);
            return;
        }

        // Check if the element exists before trying to update it
        const balanceElement = document.getElementById('contract-balance-usdt');
        if (!balanceElement) {
            console.log('Balance element not found - this is expected if the element is commented out');
            return;
        }

        balanceElement.textContent = formatUSDTAmount(decodeResult.result || "0");
    } catch (error) {
        console.error('Error loading USDT balance:', error);
        const balanceElement = document.getElementById('contract-balance-usdt');
        if (balanceElement) {
            balanceElement.textContent = '0';
        }
    }
}

// Load USDT balance when the page loads
document.addEventListener('DOMContentLoaded', get_usdt_pool_balance);
