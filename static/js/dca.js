// static/js/dca.js

import { getNearWalletBalance, getNearContractBalance } from './near-wallet.js';

// Change swap interval
window.changeSwapInterval = async function() {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        const newInterval = document.getElementById('new_interval').value;
        if (!newInterval) {
            alert("Please select a new interval");
            return;
        }

        console.log("Sending change interval transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "change_swap_interval",
                        args: { swap_interval: parseInt(newInterval) },
                        gas: "100000000000000",
                        deposit: "1" // Required for payable functions
                    }
                }
            ]
        });

        console.log("Interval change successful");
        alert("Swap interval updated successfully.");
        refreshDashboard();
    } catch (error) {
        console.error("Error changing interval:", error);
        alert("An error occurred while updating interval: " + error.message);
    }
};

// Helper function to get the active account ID dynamically from Wallet Selector
async function getAccountId() {
    const wallet = await window.selector.wallet();
    const accounts = await wallet.getAccounts();
    return accounts.length > 0 ? accounts[0].accountId : null;
}

// Helper function to generate unique nonce
function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Register the user with the DCA contract
async function registerUser() {
    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const amountPerSwapElem = document.getElementById('total_amount');
    const swapIntervalElem = document.getElementById('interval');
    const depositAmountElem = document.getElementById('initial_budget');

    if (!amountPerSwapElem || !swapIntervalElem || !depositAmountElem) {
        alert("Please complete all fields.");
        return;
    }

    const amountPerSwap = amountPerSwapElem.value;
    const swapInterval = swapIntervalElem.value;
    const depositAmount = depositAmountElem.value;

    if (isNaN(depositAmount) || isNaN(amountPerSwap) || !swapInterval) {
        alert("Invalid input values. Please ensure all fields are correctly filled.");
        return;
    }

    const depositAmountYocto = BigInt(Math.round(parseFloat(depositAmount) * 1e24)).toString();
    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "register_user",
                        args: {
                            amount_per_swap: amountPerSwap,
                            swap_interval: swapInterval,
                        },
                        gas: "300000000000000",
                        deposit: depositAmountYocto
                    }
                }
            ]
        });
        alert("User registered successfully.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during registration:", error);
        alert("An error occurred during registration.");
    }
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
            body: JSON.stringify({ user: accountId })
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
                    account_id: 'test.dca-near.testnet',
                    method_name: 'get_user',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error) {
            if (result.error.data && result.error.data.includes("panicked")) {
                return false;
            }
            throw new Error(result.error.data);
        }
        
        return true;
    } catch (error) {
        console.log("Error checking user registration:", error);
        return false;
    }
}

// Refresh dashboard and display the current investment status
async function refreshDashboard() {
    console.log("Refreshing dashboard...");
    const accountId = window.getNearAccountId(); // Use the stored account ID
    if (!accountId) {
        showConnectWalletMessage();
        return;
    }

    const dashboardBody = document.querySelector("#investment-dashboard tbody");
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
            body: JSON.stringify({ user: accountId })
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
                    account_id: 'test.dca-near.testnet',
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
                    <td>${formatNearAmount(userData.total_swapped)}</td>
                    <td>
                        <div class="status-badge ${userData.pause ? 'paused' : 'active'}">
                            ${userData.pause ? 'Paused' : 'Active'}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${userData.pause ? 
                                `<button onclick="resumeDCA()" class="dca-btn dca-btn-info btn-sm">
                                    <i class="fas fa-play-circle"></i> Resume
                                </button>` :
                                `<button onclick="pauseDCA()" class="dca-btn dca-btn-warning btn-sm">
                                    <i class="fas fa-pause-circle"></i> Pause
                                </button>`
                            }
                            <button onclick="removeUser()" class="dca-btn dca-btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Update mobile view
            const mobileView = document.querySelector('.mobile-view');
            if (mobileView) {
                mobileView.innerHTML = `
                    <div class="pool-card">
                        <div class="pool-header">Pool #1</div>
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
                                <div class="item-value">${formatNearAmount(userData.total_swapped)}</div>
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
                                        `<button onclick="resumeDCA()" class="dca-btn dca-btn-info btn-sm">
                                            <i class="fas fa-play-circle"></i> Resume
                                        </button>` :
                                        `<button onclick="pauseDCA()" class="dca-btn dca-btn-warning btn-sm">
                                            <i class="fas fa-pause-circle"></i> Pause
                                        </button>`
                                    }
                                    <button onclick="removeUser()" class="dca-btn dca-btn-danger btn-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            await updateNearBalances();
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
document.addEventListener('DOMContentLoaded', () => {
    console.log("DCA.js: DOM Content Loaded");
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('errorMessage');
    if (errorMessage) {
        console.log("Error from URL:", decodeURIComponent(errorMessage));
    }
    
    // Check if we're already logged in
    const accountId = window.getNearAccountId();
    if (accountId) {
        console.log("DCA.js: Account found, refreshing dashboard");
        refreshDashboard();
    }

    // Add event listener for refresh dashboard button
    const refreshButton = document.getElementById('refresh-dashboard-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDashboard);
    }
});

// Top up funds in the DCA contract
window.topUp = async function() {
    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const depositAmount = document.getElementById('near_amount').value;

    if (!depositAmount) {
        alert("Please enter an amount to top up.");
        return;
    }

    // Convert depositAmount to yoctoNEAR using BigInt
    const depositAmountYocto = BigInt(Math.round(parseFloat(depositAmount) * 1e24));

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "topup",
                        args: {},
                        gas: "100000000000000", // Increased to 100 TGas
                        deposit: depositAmountYocto.toString()
                    }
                }
            ]
        });
        alert("Top-up successful.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during top-up:", error);
        alert("An error occurred during top-up.");
    }
}

// Withdraw NEAR from the DCA contract
window.withdrawNear = async function() {
    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('withdraw-near-amount').value;

    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_near",
                        args: { amount: withdrawAmount },
                        gas: "100000000000000" // Increased to 100 TGas
                    }
                }
            ]
        });
        alert("Withdrawal successful.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during withdrawal:", error);
        alert("An error occurred during withdrawal.");
    }
}

// Pause DCA swaps
window.pauseDCA = async function() {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        console.log("Sending pause transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "pause",
                        args: {},
                        gas: "100000000000000",
                        deposit: "1" // Required for payable functions
                    }
                }
            ]
        });

        console.log("Pause successful");
        alert("DCA paused successfully.");
        refreshDashboard();
    } catch (error) {
        console.error("Error pausing DCA:", error);
        alert("An error occurred while pausing DCA: " + error.message);
    }
}

// Resume DCA swaps
window.resumeDCA = async function() {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        console.log("Sending resume transaction...");
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "resume",
                        args: {},
                        gas: "100000000000000",
                        deposit: "1" // Required for payable functions
                    }
                }
            ]
        });

        console.log("Resume successful");
        alert("DCA resumed successfully.");
        refreshDashboard();
    } catch (error) {
        console.error("Error resuming DCA:", error);
        alert("An error occurred while resuming DCA: " + error.message);
    }
}

// Remove user and withdraw funds from the DCA contract
window.removeUser = async function() {
    if (!confirm("Are you sure you want to remove your DCA setup? This will withdraw all your tokens.")) return;

    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "remove_user",
                        args: {},
                        gas: "100000000000000" // Increased to 100 TGas
                    }
                }
            ]
        });
        alert("User removed and tokens withdrawn.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during user removal:", error);
        alert("An error occurred while removing user.");
    }
}

function formatNearAmount(yoctoNear) {
    try {
        // Convert to BigInt and divide
        const nearValue = BigInt(yoctoNear) / BigInt(10 ** 20); // Keep 4 extra decimal places
        const nearString = nearValue.toString();
        
        // Add decimal point 4 places from the end
        const length = nearString.length;
        if (length <= 4) {
            // Pad with zeros if needed
            return "0." + nearString.padStart(4, '0');
        } else {
            return nearString.slice(0, -4) + "." + nearString.slice(-4);
        }
    } catch (error) {
        console.error("Error formatting NEAR amount:", error);
        return "0";
    }
}

// Utility Function to format intervals
function formatInterval(nanoseconds) {
    const seconds = nanoseconds / 1_000_000_000n; // Convert nanoseconds to seconds
    if (seconds >= 86400n) return `${Number(seconds / 86400n)} days`;
    if (seconds >= 3600n) return `${Number(seconds / 3600n)} hours`;
    if (seconds >= 60n) return `${Number(seconds / 60n)} minutes`;
    return `${Number(seconds)} seconds`;
}

// Utility Functions
function showConnectWalletMessage() {
    const dashboardBody = document.querySelector("#investment-dashboard tbody");
    if (dashboardBody) {
        dashboardBody.innerHTML = `<tr><td colspan="5" class="text-center">Please connect your wallet to view DCA investments.</td></tr>`;
    }
}

function formatTimestamp(nanoseconds) {
    const milliseconds = Math.floor(nanoseconds / 1_000_000);
    return new Date(milliseconds).toLocaleString();
}

// Update balances for wallet and contract
async function updateNearBalances() {
    const accountId = await getAccountId();
    const contractId = "test.dca-near.testnet";

    if (!accountId) {
        document.querySelectorAll('.wallet-balance').forEach(el => {
            el.textContent = 'Not connected';
        });
        document.getElementById('contract-balance').textContent = 'Not connected';
        document.getElementById('near-contract-balance').textContent = 'Not connected';
        document.getElementById('usdt-contract-balance').textContent = 'Not connected';
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
        document.getElementById('contract-balance').textContent = formatNearAmount(contractBalance);
        
        // Get user's NEAR balance from contract and USDT balance
        const userData = await getUserData();
        if (userData) {
            document.getElementById('near-contract-balance').textContent = formatNearAmount(userData.amount);
            document.getElementById('usdt-contract-balance').textContent = formatNearAmount(userData.total_swapped);
        }
    } catch (error) {
        console.error('Error fetching balances:', error);
    }
}

// Helper function to get user data
async function getUserData() {
    try {
        const accountId = await getAccountId();
        if (!accountId) return null;

        const encodeResponse = await fetch('/api/base64/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: accountId })
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
                    account_id: 'test.dca-near.testnet',
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

// Withdraw USDT from the DCA contract
window.withdrawUSDT = async function() {
    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const withdrawAmount = document.getElementById('usdt_amount').value;

    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    const wallet = await window.selector.wallet();

    try {
        await wallet.signAndSendTransaction({
            receiverId: "test.dca-near.testnet",
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "withdraw_usdt",
                        args: { amount: withdrawAmount },
                        gas: "100000000000000" // Increased to 100 TGas
                    }
                }
            ]
        });
        alert("USDT withdrawal successful.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during USDT withdrawal:", error);
        alert("An error occurred during USDT withdrawal.");
    }
}

// updateNearBalances to DOMContentLoaded
document.addEventListener("DOMContentLoaded", updateNearBalances);

window.refreshDashboard = refreshDashboard;
