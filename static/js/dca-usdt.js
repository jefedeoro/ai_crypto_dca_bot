// static/js/dca-usdt.js
import { getNearWalletBalance, getNearContractBalance, registerUserWithContract } from './near-wallet.js';

let isUserRegistered = false;

function updateDCAButton() {
    const submitButton = document.querySelector('#dca-usdt-setup-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = isUserRegistered ? 'Start USDT to NEAR DCA' : 'Register USDT to NEAR DCA';
    }
}

// Handle DCA setup form submission
window.startUsdtDCAInvestment = async function(event) {
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
            // Use same contract but with reverse flag
            await registerUserWithContract(amountPerSwap, interval, initialBudget, true);
            isUserRegistered = true;
            updateDCAButton();
            alert("DCA setup successful!");
            refreshUsdtDashboard();
            return;
        }

        const wallet = await window.selector.wallet();
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error setting up DCA:", error);
        alert("An error occurred while setting up DCA investment: " + error.message);
    }
}

// Change swap interval
window.changeUsdtSwapInterval = async function() {
    try {
        // Get wallet
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

        console.log("Sending change interval transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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

        console.log("Interval change successful");
        alert("Swap interval updated successfully.");
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error changing interval:", error);
        alert("An error occurred while updating interval: " + error.message);
    }
};

// Helper function to generate unique nonce
function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Check if user needs to register
async function checkUserRegistration(accountId) {
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
                id: 'dontcare',
                method: 'query',
                params: {
                    request_type: 'call_function',
                    finality: 'final',
                    account_id: 'test2.dca-near.testnet',
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

// Refresh dashboard and display the current investment status
async function refreshUsdtDashboard() {
    console.log("Refreshing USDT to NEAR dashboard...");
    const accountId = window.getNearAccountId();
    if (!accountId) {
        showConnectWalletMessage();
        return;
    }

    const dashboardBody = document.querySelector("#usdt-investment-dashboard tbody");
    if (!dashboardBody) return;

    try {
        // First check if user is registered
        const isRegistered = await checkUserRegistration(accountId);
        if (!isRegistered) {
            dashboardBody.innerHTML = `<tr><td colspan="6" class="text-center">Please register first to start using DCA.</td></tr>`;
            return;
        }

        console.log("Fetching user data for:", accountId);

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
                    account_id: 'test2.dca-near.testnet',
                    method_name: 'get_user',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        console.log('Full RPC Response:', result);

        // Check for error in result that indicates user doesn't exist
        if (result.result && result.result.error && result.result.error.includes("panicked")) {
            console.log("User not registered");
            dashboardBody.innerHTML = `<tr><td colspan="6" class="text-center">Please register first to start using DCA.</td></tr>`;
            return;
        }

        // Check for other errors
        if (result.error) {
            throw new Error(result.error.data || result.error.message);
        }

        // Get the result array and convert to string
        const resultArray = result.result.result;
        if (!resultArray || !Array.isArray(resultArray)) {
            throw new Error('Invalid RPC response format');
        }

        // Convert array of numbers to string
        const jsonString = String.fromCharCode.apply(null, resultArray);
        console.log('Converted JSON string:', jsonString);

        // Parse the JSON string
        try {
            const userData = JSON.parse(jsonString);
            console.log('Parsed user data:', userData);

            // Calculate number of swaps
            const numSwaps = userData.last_swap_timestamp > 0 
                ? Math.floor((Date.now() * 1_000_000 - userData.last_swap_timestamp) / userData.swap_interval) + 1 
                : 0;

            // Update desktop view
            dashboardBody.innerHTML = `
                <tr>
                    <td>${formatNearAmount(userData.amount_per_swap)}</td>
                    <td>${formatInterval(BigInt(userData.swap_interval))}</td>
                    <td>${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</td>
                    <td>${formatNearAmount(userData.amount)}</td>
                    <td>${formatUSDTAmount(userData.total_swapped)}</td>
                    <td>
                        <div class="status-badge ${userData.pause ? 'paused' : 'active'}">
                            ${userData.pause ? 'Paused' : 'Active'}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${userData.pause ? 
                                `<button onclick="resumeUsdtDCA()" class="dca-btn dca-btn-info btn-sm">
                                    <i class="fas fa-play-circle"></i> Resume
                                </button>` :
                                `<button onclick="pauseUsdtDCA()" class="dca-btn dca-btn-warning btn-sm">
                                    <i class="fas fa-pause-circle"></i> Pause
                                </button>`
                            }
                            <button onclick="removeUsdtUser()" class="dca-btn dca-btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Update mobile view
            const mobileView = document.querySelector('#usdt-mobile-view');
            if (mobileView) {
                mobileView.innerHTML = `
                    <div class="pool-card">
                        <div class="pool-header">USDT to NEAR Pool</div>
                        <div class="dashboard-grid">
                            <div class="dashboard-item">
                                <p class="item-label">Amount per Swap</p>
                                <div class="item-value">${formatNearAmount(userData.amount_per_swap)}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Interval</p>
                                <div class="item-value">${formatInterval(BigInt(userData.swap_interval))}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Next Swap</p>
                                <div class="item-value">${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">NEAR Balance</p>
                                <div class="item-value">${formatNearAmount(userData.amount)}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">USDT Swapped</p>
                                <div class="item-value">${formatUSDTAmount(userData.total_swapped)}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Status</p>
                                <div class="item-value">
                                    <div class="status-badge ${userData.pause ? 'paused' : 'active'}">
                                        ${userData.pause ? 'Paused' : 'Active'}
                                    </div>
                                </div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Actions</p>
                                <div class="item-value">
                                    ${userData.pause ? 
                                        `<button onclick="resumeUsdtDCA()" class="dca-btn dca-btn-info btn-sm">
                                            <i class="fas fa-play-circle"></i> Resume
                                        </button>` :
                                        `<button onclick="pauseUsdtDCA()" class="dca-btn dca-btn-warning btn-sm">
                                            <i class="fas fa-pause-circle"></i> Pause
                                        </button>`
                                    }
                                    <button onclick="removeUsdtUser()" class="dca-btn dca-btn-danger btn-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            await updateUsdtBalances();
        } catch (error) {
            console.error('Error parsing user data:', error);
            throw new Error('Failed to parse user data');
        }
    } catch (error) {
        console.error("Error refreshing dashboard:", error);
        // Check if error is from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const errorMessage = urlParams.get('errorMessage');
        if (errorMessage) {
            dashboardBody.innerHTML = `<tr><td colspan="6" class="text-center">Error: ${decodeURIComponent(errorMessage)}</td></tr>`;
        } else {
            dashboardBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading DCA data. Please try again.</td></tr>`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DCA-USDT.js: DOM Content Loaded");
    
    // Check if we're already logged in
    const accountId = window.getNearAccountId();
    if (accountId) {
        console.log("DCA-USDT.js: Account found, checking registration");
        await checkUserRegistration(accountId);
        refreshUsdtDashboard();
    }

    // Add event listener for refresh dashboard button
    const refreshButton = document.getElementById('refresh-usdt-dashboard-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshUsdtDashboard);
    }

    // Add event listener for form submission
    const dcaForm = document.getElementById('dca-usdt-setup-form');
    if (dcaForm) {
        dcaForm.onsubmit = startUsdtDCAInvestment;
    }
});

// Top up funds in the DCA contract
window.topUpUsdt = async function() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const depositAmount = document.getElementById('near_amount_usdt').value;

    if (!depositAmount) {
        alert("Please enter an amount to top up.");
        return;
    }

    // Convert depositAmount to yoctoNEAR using BigInt
    const depositAmountYocto = BigInt(Math.round(parseFloat(depositAmount) * 1e24));

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during top-up:", error);
        alert("An error occurred during top-up.");
    }
}

// Withdraw NEAR from the DCA contract
window.withdrawUsdtNear = async function() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('near_amount_usdt').value;

    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    // Convert withdrawAmount to yoctoNEAR using BigInt
    const withdrawAmountYocto = BigInt(Math.round(parseFloat(withdrawAmount) * 1e24));

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during withdrawal:", error);
        alert("An error occurred during withdrawal.");
    }
}

// Pause DCA swaps
window.pauseUsdtDCA = async function() {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        console.log("Sending pause transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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

        console.log("Pause successful");
        alert("DCA paused successfully.");
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error pausing DCA:", error);
        alert("An error occurred while pausing DCA: " + error.message);
    }
}

// Resume DCA swaps
window.resumeUsdtDCA = async function() {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        console.log("Sending resume transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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

        console.log("Resume successful");
        alert("DCA resumed successfully.");
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error resuming DCA:", error);
        alert("An error occurred while resuming DCA: " + error.message);
    }
}

// Remove user and withdraw funds from the DCA contract
window.removeUsdtUser = async function() {
    if (!confirm("Are you sure you want to remove your DCA setup? This will withdraw all your tokens.")) return;

    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during user removal:", error);
        alert("An error occurred while removing user.");
    }
}

function formatNearAmount(yoctoNear) {
    try {
        const value = BigInt(yoctoNear);
        return (Number(value) / 1e24).toFixed(6).replace(/\.?0+$/, '');
    } catch (error) {
        console.error("Error formatting NEAR amount:", error);
        return "0";
    }
}

function formatUSDTAmount(amount) {
    try {
        const value = BigInt(amount);
        return (Number(value) / 1e6).toFixed(2).replace(/\.?0+$/, '');
    } catch (error) {
        console.error("Error formatting USDT amount:", error);
        return "0";
    }
}

function formatInterval(nanoseconds) {
    const seconds = nanoseconds / 1_000_000_000n;
    if (seconds >= 86400n) return `${Number(seconds / 86400n)} days`;
    if (seconds >= 3600n) return `${Number(seconds / 3600n)} hours`;
    if (seconds >= 60n) return `${Number(seconds / 60n)} minutes`;
    return `${Number(seconds)} seconds`;
}

function formatTimestamp(nanoseconds) {
    const milliseconds = Math.floor(nanoseconds / 1_000_000);
    return new Date(milliseconds).toLocaleString();
}

function showConnectWalletMessage() {
    const dashboardBody = document.querySelector("#usdt-investment-dashboard tbody");
    if (dashboardBody) {
        dashboardBody.innerHTML = `<tr><td colspan="5" class="text-center">Please connect your wallet to view DCA investments.</td></tr>`;
    }
}

// Update balances for wallet and contract
async function updateUsdtBalances() {
    const accountId = window.getNearAccountId();
    const contractId = "test2.dca-near.testnet";

    if (!accountId) {
        document.querySelectorAll('.wallet-balance').forEach(el => {
            el.textContent = 'Not connected';
        });
        document.getElementById('contract-balance-usdt').textContent = 'Not connected';
        document.getElementById('near-contract-balance-usdt').textContent = 'Not connected';
        document.getElementById('usdt-contract-balance-usdt').textContent = 'Not connected';
        return;
    }

    try {
        // Fetch and display wallet balance
        const walletBalance = await getNearWalletBalance(accountId);
        const formattedBalance = formatNearAmount(walletBalance);
        document.querySelectorAll('.wallet-balance').forEach(el => {
            el.textContent = formattedBalance;
        });

        // Fetch and display contract pool balance
        const contractBalance = await getNearContractBalance(contractId);
        document.getElementById('contract-balance-usdt').textContent = formatNearAmount(contractBalance);
        
        // Get user's NEAR balance from contract and USDT balance
        const userData = await getUserData();
        if (userData) {
            document.getElementById('near-contract-balance-usdt').textContent = formatNearAmount(userData.amount);
            document.getElementById('usdt-contract-balance-usdt').textContent = formatUSDTAmount(userData.total_swapped);
        }
    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

// Helper function to get user data
async function getUserData() {
    try {
        const accountId = window.getNearAccountId();
        if (!accountId) return null;

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
                    account_id: 'test2.dca-near.testnet',
                    method_name: 'get_user',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error || !result.result || !result.result.result) {
            return null;
        }

        const jsonString = String.fromCharCode.apply(null, result.result.result);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Withdraw fungible tokens from the DCA contract
window.withdrawUsdtFT = async function() {
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('usdt_amount_usdt').value;

    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    // Convert withdrawAmount to USDT decimal format (6 decimals)
    const withdrawAmountUSDT = BigInt(Math.round(parseFloat(withdrawAmount) * 1e6));

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test2.dca-near.testnet",
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
        refreshUsdtDashboard();
    } catch (error) {
        console.error("Error during token withdrawal:", error);
        alert("An error occurred during token withdrawal.");
    }
}

// updateNearBalances to DOMContentLoaded
document.addEventListener("DOMContentLoaded", updateUsdtBalances);

// Export functions for use in HTML
window.startUsdtDCAInvestment = startUsdtDCAInvestment;
window.refreshUsdtDashboard = refreshUsdtDashboard;
window.topUpUsdt = topUpUsdt;
window.withdrawUsdtNear = withdrawUsdtNear;
window.withdrawUsdtFT = withdrawUsdtFT;
window.pauseUsdtDCA = pauseUsdtDCA;
window.resumeUsdtDCA = resumeUsdtDCA;
window.removeUsdtUser = removeUsdtUser;
window.changeUsdtSwapInterval = changeUsdtSwapInterval;
