// near-wallet.js
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";

const USDT_CONTRACT = "usdt.fakes.testnet"; // USDT contract on NEAR testnet

// Function to check if wallet has USDT storage paid
export async function checkUSDTStorage(accountId) {
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
                    account_id: USDT_CONTRACT,
                    method_name: 'storage_balance_of',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();

        console.log("USDT storage result:", result);
        if (result.error) return false;

        // Decode the result using our base64 converter
        const decodeResponse = await fetch('/api/base64/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64: result.result.result })
        });
        const decodeResult = await decodeResponse.json();
        if (decodeResult.error) return false;

        const storage = decodeResult.result;
        console.log("USDT storage:", storage);
        return storage !== null && storage.total !== "0";
    } catch (error) {
        console.error("Error checking USDT storage:", error);
        return false;
    }
}

export async function checkUSDTStorage2(accountId) {
    try{
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        console.log("Checking USDT storage for:", accountId);
        // Call the USDT contract
        const storage = await wallet.viewMethod({ contractId: USDT_CONTRACT, method: 'storage_balance_of', args: { account_id: accountId } });
        console.log("USDT storage:", storage);
        return storage !== null && storage !== "0";
    } catch (error) {
        console.error("Error checking USDT storage:", error);
        return false;
    }
}

// Function to register wallet with USDT contract
export async function registerUSDTStorage() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        // Storage deposit for USDT contract (0.00125 NEAR is typical minimum)
        const STORAGE_DEPOSIT = "1250000000000000000000";

        return await wallet.signAndSendTransaction({
            receiverId: USDT_CONTRACT,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "storage_deposit",
                        args: {},
                        gas: "30000000000000",
                        deposit: STORAGE_DEPOSIT
                    }
                }
            ]
        });
    } catch (error) {
        console.error("Error registering USDT storage:", error);
        throw error;
    }
}

// Function to register a user with the DCA contract
export async function registerUserWithContract(amountPerSwap, swapInterval, deposit) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        const accounts = await wallet.getAccounts();
        if (!accounts.length) throw new Error("No account selected");

        // Check if wallet has USDT storage paid
        const hasStorage = await checkUSDTStorage2(accounts[0].accountId);
        if (!hasStorage) {
            throw new Error("Please register USDT storage first");
        }

        const depositYocto = BigInt(Math.round(parseFloat(deposit) * 1e24)).toString();
        const amountPerSwapYocto = BigInt(Math.round(parseFloat(amountPerSwap) * 1e24)).toString();
        
        return await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "register_user",
                        args: {
                            amount_per_swap: amountPerSwapYocto,
                            swap_interval: parseInt(swapInterval)
                        },
                        gas: "300000000000000",
                        deposit: depositYocto
                    }
                }
            ]
        });
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
}

// Helper function to generate unique nonce
function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Initialize wallet selector and modal for NEAR
const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMyNearWallet(), setupHereWallet()],
});

const modal = setupModal(selector, {
    contractId: "test2.dca-near.testnet",
});

window.selector = selector;
window.modal = modal;

// Export USDT storage functions to window for use in HTML
window.checkUSDTStorage = checkUSDTStorage;
window.registerUSDTStorage = registerUSDTStorage;

// Wallet event handlers
selector.on("signedIn", async ({ accounts }) => {
    if (accounts.length > 0) {
        localStorage.setItem('nearAccountId', accounts[0].accountId);
        updateWalletButton(accounts[0].accountId);
        // Call refreshDashboard after account is set
        if (window.refreshDashboard) {
            window.refreshDashboard();
        }
        // Check USDT storage status
        const hasStorage = await checkUSDTStorage2(accounts[0].accountId);
        const storageStatus = document.getElementById('usdt-storage-status');
        if (storageStatus) {
            if (hasStorage) {
                storageStatus.innerHTML = '<span class="text-success">✓ USDT Storage Registered</span>';
                document.getElementById('register-usdt-btn')?.classList.add('d-none');
            } else {
                storageStatus.innerHTML = '<span class="text-warning">⚠ USDT Storage Not Registered</span>';
                document.getElementById('register-usdt-btn')?.classList.remove('d-none');
            }
        }
    }
});

selector.on("signedOut", () => {
    localStorage.removeItem('nearAccountId');
    updateWalletButton();
});

// Initialize wallet state when the page loads
async function initWallet() {
    const wallet = await selector.wallet();
    const accounts = await wallet.getAccounts();

    if (accounts.length > 0) {
        localStorage.setItem('nearAccountId', accounts[0].accountId);
        updateWalletButton(accounts[0].accountId);
        // Call refreshDashboard after account is set during initialization
        if (window.refreshDashboard) {
            window.refreshDashboard();
        }
        // Check USDT storage status
        const hasStorage = await checkUSDTStorage2(accounts[0].accountId);
        const storageStatus = document.getElementById('usdt-storage-status');
        if (storageStatus) {
            if (hasStorage) {
                storageStatus.innerHTML = '<span class="text-success">✓ USDT Storage Registered</span>';
                document.getElementById('register-usdt-btn')?.classList.add('d-none');
            } else {
                storageStatus.innerHTML = '<span class="text-warning">⚠ USDT Storage Not Registered</span>';
                document.getElementById('register-usdt-btn')?.classList.remove('d-none');
            }
        }
    } else {
        localStorage.removeItem('nearAccountId');
        updateWalletButton();
    }
}

// Update wallet button text to reflect the connection status
function updateWalletButton(accountId = null) {
    const walletBtn = document.getElementById('wallet-btn');
    if (walletBtn) {
        walletBtn.textContent = accountId ? `${accountId.slice(0, 10)}...` : 'Connect Wallet';
    }
}

// Event listener for the wallet button to handle sign in/out
document.getElementById('wallet-btn').addEventListener('click', async () => {
    try {
        const wallet = await selector.wallet();
        const accounts = await wallet.getAccounts();
        
        if (accounts.length > 0) {
            // User is signed in, show confirmation dialog
            if (confirm('Are you sure you want to sign out?')) {
                await wallet.signOut();
                window.location.reload(); // Reload to update UI state
            }
        } else {
            // User is not signed in, show modal
            modal.show();
        }
    } catch (error) {
        console.error("Error handling wallet action:", error);
        modal.show(); // Fallback to showing modal if there's an error
    }
});

// Fetch the balance of the user's wallet from the NEAR blockchain
export async function getNearWalletBalance(accountId) {
    try {
        const response = await fetch(`https://rpc.testnet.near.org`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: generateNonce(),
                method: "query",
                params: {
                    request_type: "view_account",
                    finality: "final",
                    account_id: accountId
                }
            })
        });
        const data = await response.json();
        return data.result.amount; // Return balance in yoctoNEAR
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        return "0";
    }
}

// Fetch the balance of the user's funds in the DCA contract
export async function getNearContractBalance(contractId) {
    try {
        const response = await fetch(`https://rpc.testnet.near.org`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: generateNonce(),
                method: "query",
                params: {
                    request_type: "view_account",
                    finality: "final",
                    account_id: contractId
                }
            })
        });
        const data = await response.json();
        return data.result.amount; // Return balance in yoctoNEAR
    } catch (error) {
        console.error("Error fetching contract balance:", error);
        return "0";
    }
}

// Export helper functions to retrieve and clear the user's account ID from local storage
window.getNearAccountId = () => localStorage.getItem('nearAccountId');
window.clearNearAccountId = () => localStorage.removeItem('nearAccountId');

// Initialize wallet state on page load
initWallet();
