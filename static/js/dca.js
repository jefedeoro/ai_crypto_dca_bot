// static/js/dca.js
import { getNearWalletBalance, getNearContractBalance, registerUserWithContract } from './near-wallet.js';
import { POOL_TYPE, getSelectedPool, updatePoolVisibility } from './pool-toggle.js';

const contractId = "test2.dca-near.testnet";
let isUserRegistered = false;

function updateDCAButton() {
    const submitButton = document.querySelector('form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = isUserRegistered ? 'Start DCA Automated Investment' : 'Register DCA Automated Investment';
    }
}

// Handle DCA setup form submission
window.startDCAInvestment = async function(event) {
    event.preventDefault();
    
    const accountId = await getAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const initialBudget = document.getElementById('initial_budget').value;
    const amountPerSwap = document.getElementById('total_amount').value;
    const interval = document.getElementById('interval').value;

    if (!initialBudget || !amountPerSwap || !interval) {
        alert("Please complete all fields.");
        return;
    }

    try {
        const isRegistered = await checkUserRegistration(accountId);
        
        if (!isRegistered) {
            console.log("User not registered, proceeding with registration...");
            await registerUserWithContract(amountPerSwap, interval, initialBudget);
            isUserRegistered = true;
            updateDCAButton();
            alert("DCA setup successful!");
            refreshDashboard();
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
                            swap_interval: interval
                        },
                        gas: "300000000000000",
                        deposit: initialBudget
                    }
                }
            ]
        });
        alert("DCA investment started successfully!");
        refreshDashboard();
    } catch (error) {
        console.error("Error setting up DCA:", error);
        alert("An error occurred while setting up DCA investment: " + error.message);
    }
}

// Change swap interval
window.changeSwapInterval = async function(reverse=false) {
    try {
        // Get wallet
        const wallet = await window.selector.wallet();
        if (!wallet) {
            alert("Please connect your wallet first");
            return;
        }

        let newInterval;

        if (reverse) {
            newInterval = document.getElementById('new_interval_usdt').value;
        }
        else{
            newInterval = document.getElementById('new_interval').value;
        }
        


        if (!newInterval) {
            alert("Please select a new interval");
            return;
        }

        console.log("Sending change interval transaction...");
        await wallet.signAndSendTransaction({
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "change_swap_interval",
                        args: { swap_interval: parseInt(newInterval) },
                        gas: "100000000000000",
                        deposit: "1"
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

    try {
        await registerUserWithContract(amountPerSwap, swapInterval, depositAmount);
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

// Refresh dashboard and display the current investment status
async function refreshDashboard() {
    console.log("Refreshing dashboard...");
    const accountId = window.getNearAccountId();
    if (!accountId) {
        showConnectWalletMessage();
        return;
    }

    // // Define the dashboard section
    const dashboardSection = document.querySelector('.investment-dashboard');

    // // Check if USDT pool is active first
    // const usdtRegistered = await window.checkUsdtUserRegistration?.(accountId);
    // if (usdtRegistered) {
    //     // Hide NEAR-USDT UI if USDT pool is active
    //     if (dashboardSection) dashboardSection.style.display = 'none';
    //     const nearToUsdtManagement = document.querySelector('.dca-card:last-child');
    //     if (nearToUsdtManagement) nearToUsdtManagement.style.display = 'none';
    //     return;
    // }

    const dashboardBody = document.querySelector("#investment-dashboard tbody");
    // if (!dashboardBody) return;

    // // Check if this pool should be visible
    // const selectedPool = getSelectedPool();
    // if (selectedPool !== POOL_TYPE.NEAR_TO_USDT) {
    //     if (dashboardSection) dashboardSection.style.display = 'none';
    //     return;
    // } else {
    //     if (dashboardSection) dashboardSection.style.display = '';
    // }

    try {
        // First check if user is registered
        const isRegistered = await checkUserRegistration(accountId);
        if (!isRegistered) {
            // Hide dashboard if user is not registered
            //if (dashboardSection) dashboardSection.style.display = 'none';
            dashboardBody.innerHTML = `<tr><td colspan="6" class="text-center">Please register first to start using DCA.</td></tr>`;
            return;
        }

        // If user is registered, ensure the dashboard is visible
        //if (dashboardSection) dashboardSection.style.display = '';

        // Fetch and display user data as before
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

            if(!userData.reverse){
                // Update desktop view
        dashboardBody.innerHTML = `
        <tr>
            <td>${formatNearAmount(userData.amount)}</td>
            <td>${formatInterval(BigInt(userData.swap_interval))}</td>
            <td>${formatNearAmount(userData.amount_per_swap)}</td>
            <td>${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</td>
            <td>${formatUSDTAmount(userData.total_swapped)}</td>
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
                <div class="pool-header">NEAR to USDT Pool</div>
                <div class="dashboard-grid">
                    <div class="dashboard-item">
                        <p class="item-label">NEAR Balance</p>
                        <div class="item-value">${formatNearAmount(userData.amount)}</div>
                    </div>
                    <div class="dashboard-item">
                        <p class="item-label">Interval</p>
                        <div class="item-value">${formatInterval(BigInt(userData.swap_interval))}</div>
                    </div>
                    <div class="dashboard-item">
                        <p class="item-label">Amount per Swap</p>
                        <div class="item-value">${formatNearAmount(userData.amount_per_swap)}</div>
                    </div>
                    <div class="dashboard-item">
                        <p class="item-label">Next Swap</p>
                        <div class="item-value">${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</div>
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
document.addEventListener('DOMContentLoaded', async () => {
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
        console.log("DCA.js: Account found, checking registration");
        await checkUserRegistration(accountId);
        refreshDashboard();
    }

    // Add event listener for refresh dashboard button
    const refreshButton = document.getElementById('refresh-dashboard-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDashboard);
    }

    // Add event listener for form submission
    const dcaForm = document.getElementById('dca-setup-form');
    if (dcaForm) {
        dcaForm.onsubmit = startDCAInvestment;
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
            receiverId: contractId,
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

    const withdrawAmount = document.getElementById('near_amount').value;

    if (!withdrawAmount) {
        alert("Please enter an amount to withdraw.");
        return;
    }

    // Convert withdrawAmount to yoctoNEAR using BigInt
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
                        args: { amount: withdrawAmountYocto.toString() },
                        gas: "100000000000000", // Increased to 100 TGas
                        deposit: "1"
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
            receiverId: contractId,
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
            receiverId: contractId,
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
            receiverId: contractId,
            actions: [
                {
                    type: "FunctionCall",
                    params: {
                        methodName: "remove_user",
                        args: {},
                        gas: "100000000000000", // Increased to 100 TGas
                        deposit: "1" // Required for payable functions
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
        return (Number(value) / 1e6).toFixed(2).replace(/\.?0+$/, ''); // Using 1e6 for USDT's 6 decimal places
    } catch (error) {
        console.error("Error formatting USDT amount:", error);
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
            document.getElementById('usdt-contract-balance').textContent = formatUSDTAmount(userData.total_swapped);
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
window.withdrawFT = async function() {
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

    // Convert withdrawAmount to USDT decimal format (6 decimals)
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
                        args: { amount: withdrawAmountUSDT.toString() },
                        gas: "100000000000000", // Increased to 100 TGas
                        deposit: "1" // Required for payable functions
                    }
                }
            ]
        });
        alert("Token withdrawal successful.");
        refreshDashboard();
    } catch (error) {
        console.error("Error during token withdrawal:", error);
        alert("An error occurred during token withdrawal.");
    }
}

// updateNearBalances to DOMContentLoaded
document.addEventListener("DOMContentLoaded", updateNearBalances);

window.refreshDashboard = refreshDashboard;
