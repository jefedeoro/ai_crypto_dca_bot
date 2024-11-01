// usdt-balance.js - Handles USDT balance checking and formatting functions

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
                    account_id: 'usdt.fakes.testnet',
                    method_name: 'ft_balance_of',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error) return "0";

        // Decode the result using our base64 converter
        const decodeResponse = await fetch('/api/base64/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64: result.result.result })
        });
        const decodeResult = await decodeResponse.json();
        if (decodeResult.error) return "0";

        return decodeResult.result;
    } catch (error) {
        console.error("Error getting USDT balance:", error);
        return "0";
    }
}

// Helper functions for formatting amounts
export function formatNearAmount(yoctoNear) {
    try {
        const value = BigInt(yoctoNear);
        return (Number(value) / 1e24).toFixed(6).replace(/\.?0+$/, '');
    } catch (error) {
        console.error("Error formatting NEAR amount:", error);
        return "0";
    }
}

export function formatUSDTAmount(amount) {
    try {
        const value = BigInt(amount);
        return (Number(value) / 1e6).toFixed(2).replace(/\.?0+$/, '');
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

async function loadUSDTBalance() {
    try {
        const response = await fetch('/api/usdt/pool-balance');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('contract-balance-usdt').textContent = data.balance;
        } else {
            document.getElementById('contract-balance-usdt').textContent = 'Error loading balance';
        }
    } catch (error) {
        console.error('Error loading USDT balance:', error);
        document.getElementById('contract-balance-usdt').textContent = 'Error loading balance';
    }
}

// Load USDT balance when the page loads
document.addEventListener('DOMContentLoaded', loadUSDTBalance);
