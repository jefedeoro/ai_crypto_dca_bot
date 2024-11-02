// usdt-dashboard.js - Handles USDT dashboard UI updates and initialization
import { getUSDTBalance, formatNearAmount, formatUSDTAmount, formatInterval, formatTimestamp } from './usdt-balance.js';
import { registerUsdtToNearDCA } from './usdt-to-near-dca.js';
import { 
    topUpUsdt,
    withdrawUsdtNear,
    withdrawUsdtFT,
    pauseUsdtDCA,
    resumeUsdtDCA,
    removeUsdtUser
} from './usdt-dca.js';
import { getNearWalletBalance, getNearContractBalance } from '../near-wallet.js';

const contractId = "test2.dca-near.testnet";

function showConnectWalletMessage() {
    const dashboardBody = document.querySelector("#usdt-investment-dashboard tbody");
    if (dashboardBody) {
        dashboardBody.innerHTML = `<tr><td colspan="5" class="text-center">Please connect your wallet to view DCA investments.</td></tr>`;
    }
}

// Helper function to generate unique nonce
function generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Check if user needs to register
export async function checkUserRegistration(accountId) {
    if (!accountId) return false;
    
    try {
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
                    account_id: contractId,
                    method_name: 'get_user',
                    args_base64: encodeResult.result
                }
            })
        });
        
        const result = await response.json();
        if (result.error || (result.result && result.result.error)) {
            window.isUserRegistered = false;
            return false;
        }
        
        window.isUserRegistered = true;
        return true;
    } catch (error) {
        console.log("Error checking user registration:", error);
        window.isUserRegistered = false;
        return false;
    }
}

// Handle USDT DCA form submission
export async function startUsdtDCAInvestment(event) {
    event.preventDefault();
    
    const accountId = window.getNearAccountId();
    if (!accountId) {
        alert("Please connect your wallet first.");
        return;
    }

    const initialBudget = document.getElementById('initial_budget_usdt').value.trim();
    const amountPerSwap = document.getElementById('swap_amount_usdt').value.trim();
    const interval = document.getElementById('interval_usdt').value;

    // Enhanced validation
    if (!initialBudget || initialBudget === "0") {
        alert("Please enter a valid initial budget amount.");
        return;
    }

    if (!amountPerSwap || amountPerSwap === "0") {
        alert("Please enter a valid amount per swap.");
        return;
    }

    if (!interval || interval === "") {
        alert("Please select a swap interval.");
        return;
    }

    try {
        const isRegistered = await checkUserRegistration(accountId);
        
        if (!isRegistered) {
            console.log("User not registered, proceeding with registration...");
            await registerUsdtToNearDCA(amountPerSwap, interval);
            window.isUserRegistered = true;
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

// Update balances for wallet and contract
export async function updateUsdtBalances() {
    const accountId = window.getNearAccountId();

    // Helper function to safely update element text content
    const safeSetTextContent = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    };

    // Helper function to safely update multiple elements with same class
    const safeSetClassTextContent = (className, value) => {
        document.querySelectorAll(`.${className}`).forEach(el => {
            if (el) {
                el.textContent = value;
            }
        });
    };

    if (!accountId) {
        safeSetClassTextContent('wallet-balance-usdt', 'Not connected');
        safeSetTextContent('contract-balance-usdt', 'Not connected');
        safeSetTextContent('near-contract-balance-usdt', 'Not connected');
        safeSetTextContent('usdt-contract-balance-usdt', 'Not connected');
        return;
    }

    try {
        // Fetch and display USDT wallet balance
        const usdtBalance = await getUSDTBalance(accountId);
        const formattedUsdtBalance = formatUSDTAmount(usdtBalance);
        safeSetClassTextContent('wallet-balance-usdt', formattedUsdtBalance);

        // Fetch and display contract pool balance
        const contractBalance = await getNearContractBalance(contractId);
        safeSetTextContent('contract-balance-usdt', formatNearAmount(contractBalance));
        
        // Get user data for other balances
        const userEncodeResponse = await fetch('/api/base64/encode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: accountId, reverse: true })
        });
        const userEncodeResult = await userEncodeResponse.json();
        
        // Get user data
        const userResponse = await fetch('https://rpc.testnet.near.org', {
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
                    args_base64: userEncodeResult.result
                }
            })
        });

        const userResult = await userResponse.json();
        if (userResult.result && userResult.result.result) {
            const userDataString = String.fromCharCode.apply(null, userResult.result.result);
            const userData = JSON.parse(userDataString);
            
            // Update contract balances from user data
            safeSetTextContent('near-contract-balance-usdt', formatNearAmount(userData.amount));
            safeSetTextContent('usdt-contract-balance-usdt', formatUSDTAmount(userData.total_swapped));

            // Dispatch event with user data
            window.dispatchEvent(new CustomEvent('usdtUserDataUpdated', { 
                detail: {
                    amount: userData.amount,
                    totalSwapped: userData.total_swapped
                }
            }));
        } else {
            // If no user data, set balances to 0
            safeSetTextContent('near-contract-balance-usdt', '0');
            safeSetTextContent('usdt-contract-balance-usdt', '0');
        }
    } catch (error) {
        console.error('Error fetching balances:', error);
        // Set default values on error
        safeSetTextContent('contract-balance-usdt', '0');
        safeSetTextContent('near-contract-balance-usdt', '0');
        safeSetTextContent('usdt-contract-balance-usdt', '0');
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

        // Show USDT-NEAR UI and hide NEAR-USDT UI
        const nearToUsdtDashboard = document.querySelector('.investment-dashboard:not(:last-child)');
        const nearToUsdtManagement = document.querySelector('.dca-card:last-child');
        if (nearToUsdtDashboard) nearToUsdtDashboard.style.display = 'none';
        if (nearToUsdtManagement) nearToUsdtManagement.style.display = 'none';

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
                    account_id: contractId,
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
            window.isUserRegistered = false;  // Update registration state
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

            // Update registration state based on user data
            window.isUserRegistered = true;

            // Update desktop view
            dashboardBody.innerHTML = `
                <tr>
                    <td>${formatUSDTAmount(userData.amount)}</td>
                    <td>${formatInterval(BigInt(userData.swap_interval))}</td>
                    <td>${formatUSDTAmount(userData.amount_per_swap)}</td>
                    <td>${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</td>
                    <td>${formatNearAmount(userData.total_swapped)}</td>
                    <td>
                        <div class="status-badge ${userData.pause ? 'paused' : 'active'}">
                            ${userData.pause ? 'Paused' : 'Active'}
                        </div>
                    </td>
                    <td data-label="Actions">
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
                                <p class="item-label">USDT Balance</p>
                                <div class="item-value">${formatUSDTAmount(userData.amount)}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Interval</p>
                                <div class="item-value">${formatInterval(BigInt(userData.swap_interval))}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Amount per Swap</p>
                                <div class="item-value">${formatUSDTAmount(userData.amount_per_swap)}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">Next Swap</p>
                                <div class="item-value">${userData.last_swap_timestamp ? formatTimestamp(userData.last_swap_timestamp) : 'Not executed yet'}</div>
                            </div>
                            <div class="dashboard-item">
                                <p class="item-label">NEAR Swapped</p>
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
            window.isUserRegistered = false;  // Update registration state on error
            throw new Error('Failed to parse user data');
        }
    } catch (error) {
        console.error("Error refreshing dashboard:", error);
        // Update registration state on error
        window.isUserRegistered = false;
        
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
    console.log("USDT Dashboard: DOM Content Loaded");
    
    // Check if we're already logged in
    const accountId = window.getNearAccountId();
    if (accountId) {
        console.log("USDT Dashboard: Account found, checking registration");
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

    // Listen for wallet connection changes
    window.selector.on("signedIn", async ({ accounts }) => {
        if (accounts.length > 0) {
            await checkUserRegistration(accounts[0].accountId);
            refreshUsdtDashboard();
        }
    });
});

// Export functions to window for use in HTML
window.refreshUsdtDashboard = refreshUsdtDashboard;
window.startUsdtDCAInvestment = startUsdtDCAInvestment;
window.topUpUsdt = topUpUsdt;
window.withdrawUsdtNear = withdrawUsdtNear;
window.withdrawUsdtFT = withdrawUsdtFT;
window.pauseUsdtDCA = pauseUsdtDCA;
window.resumeUsdtDCA = resumeUsdtDCA;
window.removeUsdtUser = removeUsdtUser;
window.changeUsdtSwapInterval = changeUsdtSwapInterval;
window.checkUsdtUserRegistration = checkUserRegistration;
