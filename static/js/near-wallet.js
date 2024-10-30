// near-wallet.js
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui-js";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";

// Function to register a user with the DCA contract
export async function registerUserWithContract(amountPerSwap, swapInterval, deposit) {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) throw new Error("Wallet not connected");

        const depositYocto = BigInt(Math.round(parseFloat(deposit) * 1e24)).toString();
        const amountPerSwapYocto = BigInt(Math.round(parseFloat(amountPerSwap) * 1e24)).toString();
        
        return await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
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

// Initialize wallet selector and modal for NEAR
const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMyNearWallet(), setupHereWallet()],
});

const modal = setupModal(selector, {
    contractId: "test.dca-near.testnet",
});

window.selector = selector;
window.modal = modal;

// Wallet event handlers
selector.on("signedIn", async ({ accounts }) => {
    if (accounts.length > 0) {
        localStorage.setItem('nearAccountId', accounts[0].accountId);
        updateWalletButton(accounts[0].accountId);
        // Call refreshDashboard after account is set
        if (window.refreshDashboard) {
            window.refreshDashboard();
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
                id: "1",
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
                id: "1",
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
