// usdt-dca.js - Handles USDT DCA functionality
import { registerUserWithContract } from '../near-wallet.js';

const contractId = "test2.dca-near.testnet";
let isUserRegistered = false;

function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function updateDCAButton() {
    const submitButton = document.querySelector('#dca-usdt-setup-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = isUserRegistered ? 'Start USDT to NEAR DCA' : 'Register USDT to NEAR DCA';
    }
}

// Check if user needs to register
export async function checkUserRegistration(accountId) {
    if (!accountId) return false;
    
    try {
        // First encode the args using our base64 converter
        const encodeResponse = await fetch('/api/base64/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: accountId, reverse: true })
        });
        const encodeResult = await encodeResponse.json();
        if (encodeResult.error) {
            throw new Error(encodeResult.error);
        }

        // Use RPC directly for view calls with encoded args
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
                    account_id: contractId,
                    method_name: 'get_user',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error || (result.result && result.result.error)) {
            isUserRegistered = false;
            updateDCAButton();
            return false;
        }
        
        isUserRegistered = true;
        updateDCAButton();
        return true;
    } catch (error) {
        console.log("Error checking user registration:", error);
        isUserRegistered = false;
        updateDCAButton();
        return false;
    }
}

// DCA Investment Functions
export async function startUsdtDCAInvestment(event) {
    event.preventDefault();
    
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const initialBudget = document.getElementById('initial_budget_usdt').value;
    const amountPerSwap = document.getElementById('total_amount_usdt').value;
    const interval = document.getElementById('interval_usdt').value;

    if (!initialBudget || !amountPerSwap || !interval) {
        alert("Please complete all fields.");
        return;
    }

    try {
        const isRegistered = await checkUserRegistration(accountId);
        
        if (!isRegistered) {
            console.log("User not registered, proceeding with registration...");
            await registerUserWithContract(amountPerSwap, interval, initialBudget, true);
            isUserRegistered = true;
            updateDCAButton();
            alert("DCA setup successful!");
            window.refreshUsdtDashboard();
            return;
        }

        const wallet = await window.selector.wallet();
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "start_investment",
                        args: {
                            amount_per_swap: amountPerSwap,
                            swap_interval: interval,
                            reverse: true
                        },
                        gas: "300000000000000",
                        deposit: initialBudget
                    }
                }
            ]
        });
        alert("DCA investment started successfully!");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error setting up DCA:", error);
        alert("An error occurred while setting up DCA investment: " + error.message);
    }
}

// Contract Interaction Functions
export async function topUpUsdt() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const depositAmount = document.getElementById('usdt_amount_topup').value;
    if (!depositAmount) {
        alert("Please enter an amount to top up.");
        return;
    }

    const depositAmountYocto = BigInt(Math.round(parseFloat(depositAmount) * 1e24));
    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "topup",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: depositAmountYocto.toString()
                    }
                }
            ]
        });
        alert("Top-up successful.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during top-up:", error);
        alert("An error occurred during top-up.");
    }
}

export async function withdrawUsdtNear() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('near_amount_withdraw').value;
    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    const withdrawAmountYocto = BigInt(Math.round(parseFloat(withdrawAmount) * 1e24));
    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_near",
                        args: { 
                            amount: withdrawAmountYocto.toString(),
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        alert("Withdrawal successful.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during withdrawal:", error);
        alert("An error occurred during withdrawal.");
    }
}

export async function withdrawUsdtFT() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('usdt_amount_withdraw').value;
    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    const withdrawAmountUSDT = BigInt(Math.round(parseFloat(withdrawAmount) * 1e6));
    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_ft",
                        args: { 
                            amount: withdrawAmountUSDT.toString(),
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        alert("Token withdrawal successful.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during token withdrawal:", error);
        alert("An error occurred during token withdrawal.");
    }
}

// DCA Control Functions
export async function pauseUsdtDCA() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "pause",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });

        alert("DCA paused successfully.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error pausing DCA:", error);
        alert("An error occurred while pausing DCA: " + error.message);
    }
}

export async function resumeUsdtDCA() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "resume",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });

        alert("DCA resumed successfully.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error resuming DCA:", error);
        alert("An error occurred while resuming DCA: " + error.message);
    }
}

export async function removeUsdtUser() {
    if (!confirm("Are you sure you want to remove your DCA setup? This will withdraw all your tokens.")) return;

    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "remove_user",
                        args: { reverse: true },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });
        alert("User removed and tokens withdrawn.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during user removal:", error);
        alert("An error occurred while removing user.");
    }
}

export async function changeUsdtSwapInterval() {
    try {
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        const newInterval = document.getElementById('new_interval_usdt').value;
        if (!newInterval) {
            alert("Please select a new interval");
            return;
        }

        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "change_swap_interval",
                        args: { 
                            swap_interval: parseInt(newInterval),
                            reverse: true
                        },
                        gas: "100000000000000",
                        deposit: "1"
                    }
                }
            ]
        });

        alert("Swap interval updated successfully.");
        window.refreshUsdtDashboard();
    } catch (error) {
        console.error("Error changing interval:", error);
        alert("An error occurred while updating interval: " + error.message);
    }
}
